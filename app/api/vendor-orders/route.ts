import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 曜日文字列を数値に変換 (0: 日, 1: 月, ...)
const dayMap: Record<string, number> = {
    '日': 0, '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6
};

/**
 * 次回の締切日時と納品予定日を計算する
 */
function calculateCycle(supplier: any) {
    const now = new Date();
    const cutoffDay = dayMap[supplier.cutoffDayOfWeek || '月'] ?? 1;
    const [cutoffHour, cutoffMin] = (supplier.cutoffTime || '17:00').split(':').map(Number);
    const deliveryDay = dayMap[supplier.deliveryDayOfWeek || '火'] ?? 2;

    // 次回の締切を算出
    let cutoffAt = new Date(now);
    cutoffAt.setHours(cutoffHour, cutoffMin, 0, 0);

    // 今日が締切曜日で、既に時刻を過ぎている、または今日が締切曜日でない場合
    const currentDay = now.getDay();
    let daysUntilCutoff = (cutoffDay - currentDay + 7) % 7;

    if (daysUntilCutoff === 0 && now > cutoffAt) {
        daysUntilCutoff = 7;
    }
    cutoffAt.setDate(now.getDate() + daysUntilCutoff);

    // 納品予定日を算出 (締切日を基準に次の納品曜日を探す)
    let deliveryDate = new Date(cutoffAt);
    let daysUntilDelivery = (deliveryDay - cutoffAt.getDay() + 7) % 7;
    if (daysUntilDelivery === 0) daysUntilDelivery = 1; // 締切即納品は通常ないので最低1日あける（実務に合わせて調整可）
    deliveryDate.setDate(cutoffAt.getDate() + daysUntilDelivery);
    deliveryDate.setHours(0, 0, 0, 0);

    return { cutoffAt, deliveryDate };
}

// 業者別 注文リストの取得
export async function GET(request: Request) {
    // DATABASE_URL がない場合はビルド時とみなして空情報を返す
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
        return NextResponse.json([]);
    }
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status'); // DRAFT | CONFIRMED | SENT

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isStore = session.role === 'store';
    const storeLocationId = session.locationId;

    try {
        const orders = await prisma.vendorOrder.findMany({
            where: {
                ...(vendorId && { vendorId }),
                ...(status && { status }),
                ...(isStore && storeLocationId ? { lines: { some: { locationId: storeLocationId } } } : {}),
            },
            include: {
                lines: {
                    where: isStore && storeLocationId ? { locationId: storeLocationId } : undefined,
                    include: {
                        item: true,
                    },
                    orderBy: {
                        addedAt: 'asc'
                    }
                },
                vendor: true,
            },
            orderBy: [
            ]
        });

        // Strip price for store role
        const safeOrders = orders.map(order => ({
            ...order,
            lines: order.lines.map(line => ({
                ...line,
                price: isStore ? null : line.price
            }))
        }));

        return NextResponse.json(safeOrders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        // If store, force locationId and requestedBy to match session to prevent forgery
        const locationId = session.role === 'store' ? session.locationId : body.locationId;
        const requestedBy = session.role === 'store' ? session.username : body.requestedBy;
        const { vendorId, itemId, qty, unit, price, itemName, note } = body;

        const vendor = await prisma.supplier.findUnique({
            where: { id: vendorId }
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        const { cutoffAt, deliveryDate } = calculateCycle(vendor);

        // 適切な下書き(DRAFT)を探す
        // 同一業者・同一締切日時・未ロックのDRAFTを対象とする
        let order = await prisma.vendorOrder.findFirst({
            where: {
                vendorId,
                status: 'DRAFT',
                cutoffAt: cutoffAt,
                isLocked: false
            }
        });

        if (!order) {
            // 期間表示用 (締切の1週間前からを期間とする簡易設定)
            const periodStart = new Date(cutoffAt);
            periodStart.setDate(cutoffAt.getDate() - 7);
            const periodEnd = cutoffAt;

            order = await prisma.vendorOrder.create({
                data: {
                    id: `VORD-${Date.now()}`,
                    vendorId,
                    periodStart,
                    periodEnd,
                    cutoffAt,
                    deliveryDate,
                    status: 'DRAFT'
                }
            });
        }

        // 明細を追加 (同じ商品でも履歴保持のため常に新規行として追加)
        // ※表示・印刷時にフロントエンドで合算する
        const newLine = await prisma.vendorOrderLine.create({
            data: {
                orderId: order.id,
                itemId,
                itemName,
                qty,
                unit,
                price: price || 0,
                note,
                requestedBy,
                locationId,
                addedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, orderId: order.id, lineId: newLine.id });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
    }
}

// ステータス更新 (確定・発注済)
export async function PATCH(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, status, confirmedBy, isLocked } = await request.json();

        // 権限チェック: 店舗ユーザーは CONFIRMED (自店舗の受付済として確定させるアクション) だけ可能とする。
        // ※実際には店舗は「受付済」状態のOrder自体を「確定」状態にする仕様か？
        // ※全体Lock等はAdminが行う想定
        if (session.role === 'store' && status === 'SENT') {
            return NextResponse.json({ error: 'Stores cannot mark orders as SENT' }, { status: 403 });
        }
        const order = await prisma.vendorOrder.update({
            where: { id },
            data: {
                status,
                isLocked: isLocked !== undefined ? isLocked : (status === 'CONFIRMED' || status === 'SENT'),
                ...(confirmedBy && { confirmedBy, confirmedAt: new Date() }),
            }
        });
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 業者別 注文リストの取得
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status'); // DRAFT | CONFIRMED | SENT

    try {
        const orders = await prisma.vendorOrder.findMany({
            where: {
                ...(vendorId && { vendorId }),
                ...(status && { status }),
            },
            include: {
                lines: {
                    include: {
                        item: true,
                    }
                },
                vendor: true,
            },
            orderBy: {
                updatedAt: 'desc',
            }
        });
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// 注文（明細）の追加・更新
export async function POST(request: Request) {
    try {
        const { vendorId, itemId, qty, unit, price, itemName, note, createdBy } = await request.json();

        // アクティブな下書きを探す（存在しなければ作成）
        // 本来は期間(period)の計算が必要だが、まずはシンプルに最新のDRAFTを対象とする
        let order = await prisma.vendorOrder.findFirst({
            where: {
                vendorId,
                status: 'DRAFT',
            }
        });

        if (!order) {
            // 期間の計算（とりあえず現在から1週間後までとする）
            const now = new Date();
            const periodStart = new Date(now);
            const periodEnd = new Date(now);
            periodEnd.setDate(now.getDate() + 7);

            order = await prisma.vendorOrder.create({
                data: {
                    vendorId,
                    periodStart,
                    periodEnd,
                    id: `VORD-${Date.now()}`,
                }
            });
        }

        // 明細の追加または合算
        const existingLine = await prisma.vendorOrderLine.findFirst({
            where: {
                orderId: order.id,
                itemId: itemId,
            }
        });

        if (existingLine) {
            await prisma.vendorOrderLine.update({
                where: { id: existingLine.id },
                data: {
                    qty: existingLine.qty + qty,
                    note: note || existingLine.note,
                    updatedAt: new Date(),
                }
            });
        } else {
            await prisma.vendorOrderLine.create({
                data: {
                    orderId: order.id,
                    itemId,
                    itemName,
                    qty,
                    unit,
                    price,
                    note,
                    createdBy,
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

// ステータス更新 (確定・発注済)
export async function PATCH(request: Request) {
    try {
        const { id, status, confirmedBy } = await request.json();
        const order = await prisma.vendorOrder.update({
            where: { id },
            data: {
                status,
                ...(confirmedBy && { confirmedBy, confirmedAt: new Date() }),
            }
        });
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

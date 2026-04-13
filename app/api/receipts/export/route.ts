import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Receipt } from '@prisma/client';

const prisma = new PrismaClient();

// 弥生 貸方勘定科目 変換ルール
function mapPaymentToCreditAccount(method: string | null) {
    switch (method) {
        case '現金': return '現金';
        case 'クレジットカード': return '未払金';
        case '電子マネー/QR': return '未払金';
        case '請求書払い': return '買掛金';
        case '立替': return '役員借入金';
        default: return '未決済';
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json().catch(() => ({}));
        const monthString = data?.month; // e.g. "2024-04"

        // ベース条件
        let whereClause: any = { status: 'CONFIRMED' };

        // 月指定フィルター（YYYY-MM）
        if (monthString && monthString.length === 7) {
            const year = parseInt(monthString.split('-')[0]);
            const monthIndex = parseInt(monthString.split('-')[1]) - 1; // 0-based
            const firstDay = new Date(year, monthIndex, 1);
            const lastDay = new Date(year, monthIndex + 1, 0, 23, 59, 59);

            whereClause.receiptDate = {
                gte: firstDay,
                lte: lastDay
            };
        }

        // 【重複防止】未出力かつ確定済（CONFIRMED）のものだけを対象とする
        const receipts = await prisma.receipt.findMany({
            where: whereClause,
            orderBy: { receiptDate: 'asc' }
        });

        if (receipts.length === 0) {
            return NextResponse.json({ error: '対象の確定済データがありません。' }, { status: 400 });
        }

        // CSVヘッダー
        const headers = [
            '日付',
            '借方勘定科目',
            '借方金額',
            '内消費税額',
            '貸方勘定科目',
            '貸方金額',
            '摘要'
        ];

        // CSV行の生成
        const rows = receipts.map((r: Receipt) => {
            const dateStr = r.receiptDate ? new Date(r.receiptDate).toISOString().split('T')[0] : '';
            const debitAccount = r.accountCode || '';
            const amount = r.amount || 0;
            const taxAmount = r.taxAmount || 0;

            const creditAccount = mapPaymentToCreditAccount(r.paymentMethod);
            const memoParts = [r.payee || '', r.memo || ''].filter(Boolean);
            const description = memoParts.join(' / ').replace(/,/g, '，');

            return [
                dateStr,
                debitAccount,
                amount,
                taxAmount,
                creditAccount,
                amount,
                description
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

        // 【事故防止】出力したデータを「出力済 (EXPORT_READY)」に更新する
        await prisma.receipt.updateMany({
            where: { id: { in: receipts.map((r: Receipt) => r.id) } },
            data: { status: 'EXPORT_READY' }
        });

        // 成功した場合はCSVのバイナリと、何件出力したかのヘッダーを返す
        return new NextResponse(Buffer.concat([bom, Buffer.from(csvContent)]), {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="yayoi_export_${monthString || new Date().toISOString().split('T')[0]}.csv"`,
                'X-Export-Count': receipts.length.toString()
            },
        });

    } catch (error: any) {
        console.error('CSV Export Error:', error);
        return NextResponse.json({ error: '内部サーバーエラーが発生しました。' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

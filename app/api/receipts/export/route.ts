import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Receipt } from '@prisma/client';

const prisma = new PrismaClient();

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

        // 汎用CSVヘッダー
        const headers = [
            '日付',
            '伝票No.',
            '勘定科目',
            '補助科目',
            '支払い先',
            '摘要',
            '税区分',
            '金額',
            '消費税額',
            '元画像'
        ];

        // CSV行の生成
        const rows = receipts.map((r: any) => {
            const dateStr = r.receiptDate ? new Date(r.receiptDate).toISOString().split('T')[0] : '';
            const slipNo = r.slipNo || '';
            const account = r.accountCode || '';
            const subAccount = r.subAccount || '';
            const payee = r.payee || '';
            const description = r.description || '';
            const taxCategory = r.taxCategory || '';
            const amount = r.amount || 0;
            const taxAmount = r.taxAmount || 0;
            const imageInfo = r.imageUrl && r.imageUrl.startsWith('data:image') ? 'Base64画像保存済' : (r.imageUrl || '');

            // エスケープ処理（カンマや改行を含む場合）
            const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

            return [
                dateStr,
                escapeCsv(slipNo),
                escapeCsv(account),
                escapeCsv(subAccount),
                escapeCsv(payee),
                escapeCsv(description),
                escapeCsv(taxCategory),
                amount,
                taxAmount,
                escapeCsv(imageInfo)
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

        // 【事故防止】出力したデータを「出力済 (EXPORT_READY)」に更新する
        await prisma.receipt.updateMany({
            where: { id: { in: receipts.map((r: any) => r.id) } },
            data: { status: 'EXPORT_READY' }
        });

        // 成功した場合はCSVのバイナリと、何件出力したかのヘッダーを返す
        return new NextResponse(Buffer.concat([bom, Buffer.from(csvContent)]), {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="receipts_export_${monthString || new Date().toISOString().split('T')[0]}.csv"`,
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

import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import ExportButton from './ExportButton';

const prisma = new PrismaClient();

// Disable caching for this dashboard so receipts appear immediately after upload
export const dynamic = 'force-dynamic';

export default async function ReceiptsDashboard() {
    const receipts = await prisma.receipt.findMany({
        orderBy: [
            { receiptDate: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    // UX Mapping
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'UPLOADED': return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">未確認</span>;
            case 'OCR_DONE': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">要確認・修正</span>;
            case 'NEEDS_REVIEW': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">エラー / 手動入力求</span>;
            case 'CONFIRMED': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">✅ 確定済</span>;
            case 'EXPORT_READY': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">出力待ち</span>;
            default: return <span className="px-3 py-1 bg-slate-100 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 text-slate-800">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">領収書管理 (Receipts)</h1>
                <div className="flex gap-3">
                    <ExportButton />
                    <Link
                        href="/receipts/upload"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm"
                    >
                        ＋ 新規アップロード
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-sm">日付</th>
                            <th className="p-4 font-semibold text-sm">支払先</th>
                            <th className="p-4 font-semibold text-sm">金額</th>
                            <th className="p-4 font-semibold text-sm">ステータス</th>
                            <th className="p-4 font-semibold text-sm">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {receipts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                    領収書がありません。右上のボタンからアップロードしてください。
                                </td>
                            </tr>
                        ) : (
                            receipts.map((receipt: any) => (
                                <tr key={receipt.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString('ja-JP') : '-'}
                                    </td>
                                    <td className="p-4 font-medium">{receipt.payee || '-'}</td>
                                    <td className="p-4">
                                        {receipt.amount ? `¥${receipt.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(receipt.status)}
                                    </td>
                                    <td className="p-4">
                                        <Link
                                            href={`/receipts/${receipt.id}`}
                                            className="text-blue-600 hover:underline text-sm font-medium"
                                        >
                                            確認・編集
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

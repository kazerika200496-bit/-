import Link from 'next/link';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Disable caching for this dashboard so receipts appear immediately after upload
export const dynamic = 'force-dynamic';

export default async function ReceiptsDashboard() {
    const receipts = await prisma.receipt.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="max-w-6xl mx-auto p-6 text-slate-800">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">領収書管理 (Receipts)</h1>
                <Link
                    href="/receipts/upload"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                    ＋ 新規アップロード
                </Link>
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
                            receipts.map((receipt) => (
                                <tr key={receipt.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString('ja-JP') : '-'}
                                    </td>
                                    <td className="p-4 font-medium">{receipt.payee || '-'}</td>
                                    <td className="p-4">
                                        {receipt.amount ? `¥${receipt.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                                            {receipt.status}
                                        </span>
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

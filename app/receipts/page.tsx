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
            case 'UPLOADED': return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200 shadow-sm">未確認</span>;
            case 'OCR_DONE': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200 shadow-sm">要確認・修正</span>;
            case 'NEEDS_REVIEW': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 shadow-sm">エラー / 手動入力求</span>;
            case 'CONFIRMED': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">✅ 確定済</span>;
            case 'EXPORT_READY': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200 shadow-sm">出力待ち</span>;
            default: return <span className="px-3 py-1 bg-slate-100 rounded-full text-xs shadow-sm">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header Area */}
            <div className="bg-blue-600 shadow-md">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">
                            いしだクリーニング
                        </h1>
                        <p className="text-blue-100 text-sm mt-1">領収書・レシート管理システム</p>
                    </div>
                    <div className="flex gap-3">
                        <ExportButton />
                        <Link
                            href="/receipts/upload"
                            className="bg-white hover:bg-blue-50 text-blue-700 px-5 py-2.5 rounded-md font-bold shadow-sm transition-colors border border-blue-100 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            新規アップロード
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto p-6 mt-4 text-slate-800">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                            <tr>
                                <th className="p-4 font-bold text-sm tracking-wide">日付</th>
                                <th className="p-4 font-bold text-sm tracking-wide">支払先</th>
                                <th className="p-4 font-bold text-sm tracking-wide text-right">金額</th>
                                <th className="p-4 font-bold text-sm tracking-wide text-center">ステータス</th>
                                <th className="p-4 font-bold text-sm tracking-wide text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {receipts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium">領収書データがありません</p>
                                            <p className="text-sm mt-1">右上のボタンから画像ファイルをアップロードしてください。</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                receipts.map((receipt: any) => (
                                    <tr key={receipt.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="p-4 font-medium text-slate-700">
                                            {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString('ja-JP') : '-'}
                                        </td>
                                        <td className="p-4 text-slate-700">{receipt.payee || '-'}</td>
                                        <td className="p-4 font-mono font-medium text-right text-slate-700">
                                            {receipt.amount ? `¥${receipt.amount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(receipt.status)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Link
                                                href={`/receipts/${receipt.id}`}
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium transition-colors text-sm"
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
        </div>
    );
}

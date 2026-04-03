import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ReceiptReviewPage({ params }: { params: { id: string } }) {
    const receipt = await prisma.receipt.findUnique({
        where: { id: params.id }
    });

    if (!receipt) notFound();

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <Link href="/receipts" className="text-blue-600 hover:underline text-sm mb-2 block">← 一覧に戻る</Link>
                    <h1 className="text-2xl font-bold text-slate-800">抽出結果の確認・修正</h1>
                </div>
                <div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        ステータス: {receipt.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Original Image Preview */}
                <div className="bg-slate-100 rounded-lg border border-slate-200 p-4 min-h-[500px] flex items-center justify-center relative overflow-hidden">
                    {receipt.imageUrl ? (
                        <img
                            src={`/api/receipts/image/${receipt.id}`}
                            alt="Receipt Original"
                            className="max-w-full max-h-[800px] object-contain shadow-sm"
                            loading="lazy"
                        />
                    ) : (
                        <span className="text-slate-400">画像がありません</span>
                    )}
                </div>

                {/* Right: Extracted Data / Editor */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold border-b pb-2 mb-6">OCR抽出データ</h2>

                    <form className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">支払先 (店名)</label>
                            <input
                                type="text"
                                defaultValue={receipt.payee || ''}
                                className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">日付</label>
                                <input
                                    type="date"
                                    defaultValue={receipt.receiptDate ? new Date(receipt.receiptDate).toISOString().split('T')[0] : ''}
                                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">通貨</label>
                                <input
                                    type="text"
                                    defaultValue={receipt.currency || 'JPY'}
                                    className="w-full border border-slate-300 rounded p-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">合計金額</label>
                                <input
                                    type="number"
                                    defaultValue={receipt.amount || ''}
                                    className="w-full border border-slate-300 rounded p-2 font-mono text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">内消費税額等</label>
                                <input
                                    type="number"
                                    defaultValue={receipt.taxAmount || ''}
                                    className="w-full border border-slate-300 rounded p-2 font-mono"
                                />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t flex justify-end gap-3">
                            <button type="button" className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium">
                                破棄する
                            </button>
                            <button type="button" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-sm">
                                確定して保存 (VERIFY)
                            </button>
                        </div>
                    </form>

                    {/* Raw JSON Debug (Collapsible in real app) */}
                    <div className="mt-12">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">RAW OCR JSON DATA (Debug)</h3>
                        <pre className="bg-slate-900 text-slate-300 p-4 rounded text-xs overflow-x-auto h-48">
                            {JSON.stringify(receipt.rawOcrData, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

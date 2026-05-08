import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReceiptForm from './ReceiptForm';

const prisma = new PrismaClient();

export default async function ReceiptReviewPage({ params }: { params: { id: string } }) {
    const receipt = await prisma.receipt.findUnique({
        where: { id: params.id }
    });

    if (!receipt) notFound();

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header Area */}
            <div className="bg-blue-600 shadow-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <Link href="/receipts" className="text-blue-100 hover:text-white transition-colors bg-blue-700/50 p-1.5 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </Link>
                            <h1 className="text-xl font-bold text-white tracking-wide">抽出結果の確認・修正</h1>
                        </div>
                    </div>
                    <div>
                        <span className="px-4 py-1.5 bg-blue-800/50 border border-blue-400 text-blue-50 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                            ステータス: {receipt.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Original Image Preview */}
                    <div className="flex flex-col">
                        <div className="bg-white rounded-t-xl border border-slate-200 border-b-0 p-4">
                            <h2 className="font-bold text-slate-700 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                元画像プレビュー
                            </h2>
                        </div>
                        <div className="bg-slate-100 rounded-b-xl border border-slate-200 p-2 min-h-[600px] flex items-center justify-center relative overflow-hidden shadow-sm">
                            {receipt.imageUrl ? (
                                <img
                                    src={receipt.imageUrl}
                                    alt="Receipt Original"
                                    className="max-w-full max-h-[800px] object-contain rounded drop-shadow-md"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    画像がありません
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Extracted Data / Editor */}
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-lg font-bold border-b border-slate-100 pb-3 mb-6 text-slate-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            入力・修正フォーム
                        </h2>

                        <ReceiptForm receipt={receipt} />

                        {/* Raw JSON Debug (Collapsible in real app) */}
                        <div className="mt-12 pt-6 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                RAW OCR JSON DATA (Debug)
                            </h3>
                            <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto h-48 shadow-inner">
                                {JSON.stringify(receipt.rawOcrData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

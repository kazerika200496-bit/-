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

                    <ReceiptForm receipt={receipt} />

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

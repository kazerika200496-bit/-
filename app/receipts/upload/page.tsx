'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReceiptUploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            // for MVP, user hardcoded or logic placeholder
            formData.append('createdById', 'anonymous');

            // 1. Upload to Blob
            const res = await fetch('/api/receipts/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // 2. Trigger OCR Process
            const ocrRes = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiptId: data.receiptId })
            });
            const ocrData = await ocrRes.json();

            if (!ocrRes.ok) throw new Error(ocrData.error);

            // 3. Redirect to Review
            router.push(`/receipts/${data.receiptId}`);
        } catch (err: any) {
            setError(err.message || 'アップロードに失敗しました');
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">領収書アップロード</h1>
                <Link href="/receipts" className="text-slate-500 hover:text-slate-700">戻る</Link>
            </div>

            <form onSubmit={handleUpload} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        レシート画像を選択
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 transition-colors">
                        <input
                            type="file"
                            accept="image/jpeg, image/png, image/webp, application/pdf"
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>
                </div>

                {error && <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}

                <button
                    type="submit"
                    disabled={!file || isUploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-md transition-colors"
                >
                    {isUploading ? '解析中 (Document AI連携)...' : 'アップロードして自動解析'}
                </button>
            </form>
        </div>
    );
}

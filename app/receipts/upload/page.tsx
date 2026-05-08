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
            // MVPではcreatedByIdをあえて指定せず、DB上でnullとして扱う（外部キー制約エラーを防ぐため）

            // 1. Upload to Blob
            const res = await fetch('/api/receipts/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // 3. Redirect to Review
            router.push(`/receipts/${data.receiptId}`);
        } catch (err: any) {
            setError(err.message || 'アップロードに失敗しました');
            setIsUploading(false);
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
                    <Link
                        href="/receipts"
                        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors border border-blue-500"
                    >
                        一覧へ戻る
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto p-6 mt-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        領収書のアップロード
                    </h2>
                    
                    <form onSubmit={handleUpload}>
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-slate-700 mb-3">
                                レシート画像を選択してください
                            </label>
                            <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-12 text-center hover:bg-blue-50 transition-colors cursor-pointer group">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-blue-400 group-hover:text-blue-500 mb-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp, application/pdf"
                                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer file:transition-colors cursor-pointer mx-auto max-w-[300px]"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-slate-400 mt-4">対応フォーマット: JPEG, PNG, WEBP, PDF</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!file || isUploading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 px-4 rounded-lg shadow-sm transition-all flex justify-center items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    アップロード＆解析中...
                                </>
                            ) : (
                                'アップロードして自動解析'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

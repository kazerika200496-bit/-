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
        <div className="container">
            <header>
                <div>
                    <div className="header-title">いしだクリーニング 領収書管理</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link
                        href="/receipts"
                        className="nav-link-important"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)' }}
                    >
                        一覧へ戻る
                    </Link>
                </div>
            </header>

            <div style={{ maxWidth: '600px', margin: '40px auto 0' }}>
                <div className="card" style={{ padding: '30px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                        領収書のアップロード
                    </h2>
                    
                    <form onSubmit={handleUpload}>
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '10px' }}>
                                レシート画像を選択してください
                            </label>
                            <div style={{ 
                                border: '2px dashed #cbd5e1', 
                                backgroundColor: '#f8fafc', 
                                borderRadius: '12px', 
                                padding: '40px 20px', 
                                textAlign: 'center' 
                            }}>
                                <label style={{
                                    display: 'inline-block',
                                    padding: '10px 20px',
                                    backgroundColor: '#fff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    color: 'var(--primary-color)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {file ? file.name : 'ファイルを選択する'}
                                    <input
                                        type="file"
                                        accept="image/jpeg, image/png, image/webp, application/pdf"
                                        style={{ display: 'none' }}
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '15px' }}>対応フォーマット: JPEG, PNG, WEBP, PDF</p>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!file || isUploading}
                            className="btn-primary"
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                fontSize: '16px',
                                opacity: (!file || isUploading) ? 0.5 : 1,
                                cursor: (!file || isUploading) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isUploading ? 'アップロード＆解析中...' : 'アップロードして自動解析'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

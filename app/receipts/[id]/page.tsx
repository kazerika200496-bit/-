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
        <div className="container">
            {/* Header Area */}
            <header>
                <div>
                    <div className="header-title">抽出結果の確認・修正</div>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span style={{ 
                        padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.2)', 
                        border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', 
                        fontSize: '14px', fontWeight: 'bold' 
                    }}>
                        ステータス: {receipt.status}
                    </span>
                    <Link href="/receipts" className="nav-link" style={{ backgroundColor: 'transparent' }}>
                        ← 一覧に戻る
                    </Link>
                </div>
            </header>

            <div className="main-layout">
                {/* Left: Original Image Preview */}
                <div className="center-content">
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                            元画像プレビュー
                        </h2>
                        <div style={{ 
                            backgroundColor: '#f8fafc', borderRadius: '8px', 
                            border: '1px solid #e2e8f0', padding: '10px', 
                            minHeight: '500px', maxHeight: '650px', display: 'flex', 
                            alignItems: 'flex-start', justifyContent: 'center', 
                            overflowY: 'auto', flex: 1
                        }}>
                            {receipt.imageUrl ? (
                                <img
                                    src={receipt.imageUrl}
                                    alt="Receipt Original"
                                    style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
                                    loading="lazy"
                                />
                            ) : (
                                <div style={{ color: '#94a3b8', textAlign: 'center', alignSelf: 'center' }}>
                                    画像がありません
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Extracted Data / Editor */}
                <div className="right-panel">
                    <div className="card">
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                            入力・修正フォーム
                        </h2>

                        <ReceiptForm receipt={receipt} />

                        {/* Raw JSON Debug (Collapsible in real app) */}
                        {/* ユーザー要望: デバッグ表示は非表示にする。本運用では削除または隠す */}
                        {process.env.NODE_ENV === 'development' && (
                            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
                                    RAW OCR JSON DATA (Debug)
                                </h3>
                                <pre style={{ 
                                    backgroundColor: '#0f172a', color: '#cbd5e1', 
                                    padding: '15px', borderRadius: '8px', 
                                    fontSize: '11px', overflowX: 'auto', maxHeight: '200px' 
                                }}>
                                    {JSON.stringify(receipt.rawOcrData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

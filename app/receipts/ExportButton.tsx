'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExportButton() {
    const [isExporting, setIsExporting] = useState(false);
    const [month, setMonth] = useState(''); // e.g. "2024-04"
    const router = useRouter();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/receipts/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.error || '出力対象のデータがありません。');
                setIsExporting(false);
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const contentDisposition = response.headers.get('content-disposition');
            let filename = `yayoi_export_${month || 'all'}.csv`;
            if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                filename = contentDisposition.split('filename=')[1].replace(/["']/g, '');
            }
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            const exportedCount = response.headers.get('X-Export-Count') || '複数';
            alert(`CSV出力完了: ${exportedCount} 件のデータを「出力済」にマークしました！`);

            router.refresh();
            setMonth(''); // Reset filter after success
        } catch (error) {
            alert('ネットワークエラーが発生しました');
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    // テスト用：出力済み状態のリセット
    const handleResetExport = async () => {
        if (!confirm('【テスト用機能】\n全ての「出力済」データを「未出力(確定済)」に戻しますか？')) return;

        try {
            const res = await fetch('/api/receipts/reset-export', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                router.refresh();
            } else {
                alert('リセットに失敗しました');
            }
        } catch (e) {
            alert('通信エラー');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border border-slate-300 rounded px-2 py-2 text-sm text-slate-600"
                title="対象月を絞り込む (未選択で全件対象)"
            />

            <button
                onClick={handleExport}
                disabled={isExporting}
                className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm transition-colors ${isExporting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
            >
                {isExporting ? '出力中...' : '↓ 弥生CSV出力'}
            </button>

            {/* 開発・テスト用リセットボタン（本運用時は非表示推奨） */}
            {process.env.NODE_ENV === 'development' && (
                <button
                    onClick={handleResetExport}
                    className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 rounded border border-slate-200"
                    title="テストやり直し用: 出力済をリセット"
                >
                    🔄 テストやり直し
                </button>
            )}
        </div>
    );
}

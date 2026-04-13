'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReceiptForm({ receipt }: { receipt: any }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States
    const [payee, setPayee] = useState(receipt.payee || '');
    const [amount, setAmount] = useState(receipt.amount?.toString() || '');
    const [receiptDate, setReceiptDate] = useState(
        receipt.receiptDate ? new Date(receipt.receiptDate).toISOString().split('T')[0] : ''
    );
    const [currency, setCurrency] = useState(receipt.currency || 'JPY');
    const [taxAmount, setTaxAmount] = useState(receipt.taxAmount?.toString() || '');
    const [paymentMethod, setPaymentMethod] = useState(receipt.paymentMethod || '');
    const [accountCode, setAccountCode] = useState(receipt.accountCode || '');
    const [memo, setMemo] = useState(receipt.memo || '');

    // Validation
    const isValid = payee.trim() !== '' && amount.trim() !== '' && receiptDate !== '';

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) {
            alert('必須項目（支払先、日付、合計金額）をすべて入力してください。');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/receipts/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiptId: receipt.id,
                    payee,
                    amount,
                    currency,
                    taxAmount,
                    receiptDate,
                    paymentMethod,
                    accountCode,
                    memo
                })
            });
            if (res.ok) {
                router.push('/receipts');
                router.refresh();
            } else {
                alert('保存に失敗しました');
            }
        } catch (err) {
            alert('通信エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleConfirm} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                    支払先 (店名) <span className="text-red-500 text-xs ml-1">※必須</span>
                </label>
                <input
                    type="text"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    required
                    placeholder="※OCR未読取・要入力"
                    className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 transition-colors ${!payee.trim() ? 'border-red-400 bg-red-50 placeholder-red-300' : 'border-slate-300'}`}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        日付 <span className="text-red-500 text-xs ml-1">※必須</span>
                    </label>
                    <input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        required
                        className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 transition-colors ${!receiptDate ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">通貨</label>
                    <input
                        type="text"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 bg-slate-50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        合計金額 <span className="text-red-500 text-xs ml-1">※必須</span>
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        placeholder="0"
                        className={`w-full border rounded p-2 font-mono text-lg focus:ring-2 focus:ring-blue-500 transition-colors ${!amount.trim() ? 'border-red-400 bg-red-50 placeholder-red-300' : 'border-slate-300'}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">内消費税額等</label>
                    <input
                        type="number"
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 font-mono bg-slate-50"
                        placeholder="任意"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">借方勘定科目 (弥生用)</label>
                    <select
                        value={accountCode}
                        onChange={(e) => setAccountCode(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2"
                    >
                        <option value="">未選択</option>
                        <option value="消耗品費">消耗品費</option>
                        <option value="荷造運賃">荷造運賃</option>
                        <option value="水道光熱費">水道光熱費</option>
                        <option value="旅費交通費">旅費交通費</option>
                        <option value="雑費">雑費</option>
                        <option value="その他">その他</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">貸方・支払方法</label>
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2"
                    >
                        <option value="">未選択</option>
                        <option value="現金">現金</option>
                        <option value="クレジットカード">クレジットカード</option>
                        <option value="電子マネー/QR">電子マネー/QR</option>
                        <option value="請求書払い">請求書払い</option>
                        <option value="立替">立替精算</option>
                    </select>
                </div>
            </div>

            <div className="mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">メモ・用途</label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-sm h-20"
                    placeholder="購入目的や備考を記載してください"
                />
            </div>

            <div className="pt-6 mt-6 border-t flex justify-end gap-3">
                <button type="button" onClick={() => router.push('/receipts')} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium transition">
                    破棄して一覧へ戻る
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className={`px-6 py-2 rounded font-medium shadow-sm transition ${!isValid
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isSubmitting ? '保存中...' : '確定して保存 (VERIFY)'}
                </button>
            </div>
        </form>
    );
}

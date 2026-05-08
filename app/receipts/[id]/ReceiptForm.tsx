'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const FAVORITE_ACCOUNTS = [
    '109 売掛金',
    '300 支払手形',
    '306 預り金',
    '204 車両運搬具',
    '226 敷金',
    '602 商品仕入',
    '703 法定福利費',
    '704 福利厚生費',
    '735 荷造運賃',
    '739 保険料',
    '742 租税公課',
    '743 消耗品費',
    '744 事務消耗品費',
    '750 調査研究費',
    '759 雑費',
    '801 受取利息',
    '804 雑収入'
];

const TAX_CATEGORIES = [
    '課税仕入10%',
    '課税仕入8%（軽減）',
    '対象外',
    '非課税',
    '不課税'
];

export default function ReceiptForm({ receipt }: { receipt: any }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States
    const [payee, setPayee] = useState(receipt.payee || '');
    const [amount, setAmount] = useState(receipt.amount?.toString() || '');
    const [receiptDate, setReceiptDate] = useState(
        receipt.receiptDate ? new Date(receipt.receiptDate).toISOString().split('T')[0] : ''
    );
    const [taxAmount, setTaxAmount] = useState(receipt.taxAmount?.toString() || '');
    
    // New Fields
    const [slipNo, setSlipNo] = useState(receipt.slipNo || '');
    
    // Account Field (Code + Name combined for UI)
    const initialAccount = receipt.accountCode 
        ? (receipt.accountName ? `${receipt.accountCode} ${receipt.accountName}` : receipt.accountCode) 
        : (receipt.accountName || '');
    const [accountInput, setAccountInput] = useState(initialAccount);

    const [subAccount, setSubAccount] = useState(receipt.subAccount || '');
    const [description, setDescription] = useState(receipt.description || '');
    const [taxCategory, setTaxCategory] = useState(receipt.taxCategory || '');
    const [paymentMethod, setPaymentMethod] = useState(receipt.paymentMethod || '');
    const [memo, setMemo] = useState(receipt.memo || ''); // For internal note

    // Validation
    const isValid = payee.trim() !== '' && amount.trim() !== '' && receiptDate !== '';

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) {
            alert('必須項目（支払先、日付、合計金額）をすべて入力してください。');
            return;
        }

        setIsSubmitting(true);

        // Parse Account Input
        let submitCode = '';
        let submitName = accountInput.trim();
        const match = accountInput.trim().match(/^(\d+)\s+(.+)$/);
        if (match) {
            submitCode = match[1];
            submitName = match[2];
        }

        try {
            const res = await fetch('/api/receipts/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiptId: receipt.id,
                    slipNo,
                    receiptDate,
                    payee,
                    amount,
                    taxAmount,
                    accountCode: submitCode,
                    accountName: submitName,
                    subAccount,
                    description,
                    taxCategory,
                    paymentMethod,
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
        <form onSubmit={handleConfirm} className="space-y-4">
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">伝票No.</label>
                    <input
                        type="text"
                        value={slipNo}
                        onChange={(e) => setSlipNo(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 bg-slate-50"
                        placeholder="任意"
                    />
                </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">勘定科目</label>
                    <input
                        list="accounts"
                        value={accountInput}
                        onChange={(e) => setAccountInput(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="入力して検索..."
                    />
                    <datalist id="accounts">
                        {FAVORITE_ACCOUNTS.map(acc => <option key={acc} value={acc} />)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">補助科目</label>
                    <input
                        type="text"
                        value={subAccount}
                        onChange={(e) => setSubAccount(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="任意"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">摘要 (購入内容など)</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="品代、飲食代など"
                />
            </div>

            <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-2">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">税区分</label>
                    <select
                        value={taxCategory}
                        onChange={(e) => setTaxCategory(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">未選択</option>
                        {TAX_CATEGORIES.map(tax => <option key={tax} value={tax}>{tax}</option>)}
                    </select>
                </div>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">消費税額</label>
                    <input
                        type="number"
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 font-mono bg-slate-50"
                        placeholder="任意"
                    />
                </div>
            </div>

            <div className="mt-2 pt-4 border-t">
                <label className="block text-sm font-medium text-slate-700 mb-1">内部メモ (CSVには出力されません)</label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-sm h-16"
                    placeholder="後から確認するためのメモ"
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
                    {isSubmitting ? '保存中...' : '確定して保存'}
                </button>
            </div>
        </form>
    );
}

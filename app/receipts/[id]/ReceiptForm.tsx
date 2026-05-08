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
        <form onSubmit={handleConfirm} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                        <span>日付</span>
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">必須</span>
                    </label>
                    <input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        required
                        className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm ${!receiptDate ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">伝票No.</label>
                    <input
                        type="text"
                        value={slipNo}
                        onChange={(e) => setSlipNo(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                        placeholder="任意"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                    <span>支払先 (店名)</span>
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">必須</span>
                </label>
                <input
                    type="text"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    required
                    placeholder="※OCR未読取・要入力"
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm ${!payee.trim() ? 'border-red-300 bg-red-50 placeholder-red-300' : 'border-slate-300'}`}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">勘定科目</label>
                    <input
                        list="accounts"
                        value={accountInput}
                        onChange={(e) => setAccountInput(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-white"
                        placeholder="入力して検索..."
                    />
                    <datalist id="accounts">
                        {FAVORITE_ACCOUNTS.map(acc => <option key={acc} value={acc} />)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">補助科目</label>
                    <input
                        type="text"
                        value={subAccount}
                        onChange={(e) => setSubAccount(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-white"
                        placeholder="任意"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">摘要 (購入内容など)</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                    placeholder="品代、飲食代など"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-slate-100 pt-5">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">税区分</label>
                    <select
                        value={taxCategory}
                        onChange={(e) => setTaxCategory(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-white"
                    >
                        <option value="">未選択</option>
                        {TAX_CATEGORIES.map(tax => <option key={tax} value={tax}>{tax}</option>)}
                    </select>
                </div>
                <div className="sm:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                        <span>合計金額</span>
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">必須</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">¥</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            placeholder="0"
                            className={`w-full border rounded-lg p-2.5 pl-8 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm ${!amount.trim() ? 'border-red-300 bg-red-50 placeholder-red-300' : 'border-slate-300'}`}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">消費税額</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
                        <input
                            type="number"
                            value={taxAmount}
                            onChange={(e) => setTaxAmount(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 pl-8 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                            placeholder="任意"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-5">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">内部メモ <span className="text-xs font-normal text-slate-400 ml-1">(CSVには出力されません)</span></label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-slate-50 focus:bg-white resize-none"
                    placeholder="後から確認するためのメモ"
                />
            </div>

            <div className="pt-8 mt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => router.push('/receipts')} className="w-full sm:w-auto px-6 py-3 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-bold transition-colors shadow-sm">
                    キャンセル
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${!isValid
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            保存中...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            確定して保存
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

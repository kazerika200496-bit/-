'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { VendorOrder, Supplier, Item, VendorOrderLine } from '../types';

export default function VendorOrdersPage() {
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 管理者モードの簡易設定 (LocalStorageまたはクエリパラメータ)
        const adminStatus = localStorage.getItem('is_admin') === 'true' ||
            new URLSearchParams(window.location.search).get('admin') === '1';
        setIsAdmin(adminStatus);

        const fetchData = async () => {
            try {
                const [ordersRes, masterRes] = await Promise.all([
                    fetch('/api/vendor-orders'),
                    fetch('/api/master')
                ]);
                const ordersData = await ordersRes.json();
                const masterData = await masterRes.json();

                setOrders(ordersData);
                setSuppliers(masterData.suppliers.filter((s: Supplier) => s.type === '業者'));
                setItems(masterData.items);

                if (masterData.suppliers.length > 0) {
                    setSelectedVendorId(masterData.suppliers.find((s: Supplier) => s.type === '業者')?.id || '');
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => !selectedVendorId || o.vendorId === selectedVendorId);
    }, [orders, selectedVendorId]);

    const activeOrder = useMemo(() => {
        return filteredOrders.find(o => o.status === 'DRAFT');
    }, [filteredOrders]);

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        if (!isAdmin) return;
        try {
            const res = await fetch('/api/vendor-orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus, confirmedBy: isAdmin ? '管理者' : '不明' })
            });
            if (res.ok) {
                const updated = await res.json();
                setOrders(orders.map(o => o.id === orderId ? { ...o, ...updated } : o));
            }
        } catch (err) {
            alert('更新に失敗しました');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <header className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#1a73e8' }}>📦 業者別 注文リスト</h1>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>スタッフが追加した注文内容を確認・確定します</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: '#666', padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px' }}>← 戻る</Link>
                    <button onClick={() => { localStorage.setItem('is_admin', (!isAdmin).toString()); setIsAdmin(!isAdmin); }} style={{ backgroundColor: isAdmin ? '#d93025' : '#1a73e8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                        {isAdmin ? '管理者モードOFF' : '管理者モードON'}
                    </button>
                </div>
            </header>

            <section className="no-print" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>業者を選択</label>
                        <select
                            value={selectedVendorId}
                            onChange={(e) => setSelectedVendorId(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                        >
                            <option value="">すべての業者</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.method || '不明'})</option>
                            ))}
                        </select>
                    </div>
                    {activeOrder && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handlePrint} style={{ backgroundColor: '#fff', border: '1px solid #1a73e8', color: '#1a73e8', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📄 印刷プレビュー</button>
                            {isAdmin && (
                                <button
                                    onClick={() => handleUpdateStatus(activeOrder.id, 'CONFIRMED')}
                                    style={{ backgroundColor: '#28a745', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    ✅ 注文確定 (ロック)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 注文リスト表示エリア */}
            {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0', border: '2px dashed #ddd', borderRadius: '12px', color: '#999' }}>
                    注文データが見つかりません
                </div>
            ) : (
                <div className="print-area">
                    {filteredOrders.map(order => (
                        <div key={order.id} style={{
                            backgroundColor: '#fff',
                            border: order.status === 'DRAFT' ? '2px solid #1a73e8' : '1px solid #ddd',
                            borderRadius: '12px',
                            padding: '25px',
                            marginBottom: '30px',
                            pageBreakAfter: 'always'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666' }}>
                                        期間: {new Date(order.periodStart).toLocaleDateString()} 〜 {new Date(order.periodEnd).toLocaleDateString()}
                                    </div>
                                    <h2 style={{ fontSize: '24px', margin: '5px 0' }}>{order.vendor.name} 御中</h2>
                                    <div style={{ fontSize: '14px', color: '#333' }}>
                                        発注方法: <span style={{ fontWeight: 'bold' }}>{order.vendor.method || '訪問'}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        backgroundColor: order.status === 'DRAFT' ? '#e8f0fe' : order.status === 'CONFIRMED' ? '#e6ffed' : '#f1f3f4',
                                        color: order.status === 'DRAFT' ? '#1a73e8' : order.status === 'CONFIRMED' ? '#28a745' : '#5f6368',
                                        marginBottom: '10px'
                                    }}>
                                        {order.status === 'DRAFT' ? '下書き (収集中)' : order.status === 'CONFIRMED' ? '確定済み' : '送信済み'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>伝票番号: {order.id}</div>
                                    {order.confirmedAt && (
                                        <div style={{ fontSize: '12px', color: '#28a745', marginTop: '5px' }}>
                                            確定: {new Date(order.confirmedAt).toLocaleString()} ({order.confirmedBy})
                                        </div>
                                    )}
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 8px' }}>品目</th>
                                        <th style={{ padding: '12px 8px' }}>数量</th>
                                        <th style={{ padding: '12px 8px' }}>単位</th>
                                        <th style={{ padding: '12px 8px' }}>単価</th>
                                        <th style={{ padding: '12px 8px' }}>金額</th>
                                        <th style={{ padding: '12px 8px' }}>備考</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.lines.map((line: any) => (
                                        <tr key={line.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {line.item?.imageUrl && (
                                                    <img src={line.item.imageUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} className="no-print" />
                                                )}
                                                {line.itemName}
                                            </td>
                                            <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{line.qty}</td>
                                            <td style={{ padding: '12px 8px' }}>{line.unit}</td>
                                            <td style={{ padding: '12px 8px', color: '#666' }}>¥{line.price.toLocaleString()}</td>
                                            <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>¥{(line.qty * line.price).toLocaleString()}</td>
                                            <td style={{ padding: '12px 8px', color: '#666', fontSize: '13px' }}>{line.note || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ textAlign: 'right', fontSize: '20px', fontWeight: 'bold' }}>
                                合計金額: ¥{order.lines.reduce((sum, line) => sum + (line.qty * line.price), 0).toLocaleString()} (税込)
                            </div>

                            <div className="no-print" style={{ marginTop: '20px', borderTop: '1px dashed #eee', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                {isAdmin && order.status === 'CONFIRMED' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'SENT')} style={{ backgroundColor: '#1a73e8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>完了 (発注済みへ)</button>
                                )}
                                {isAdmin && order.status !== 'DRAFT' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'DRAFT')} style={{ backgroundColor: '#fff', color: '#666', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>確定解除</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; margin: 0; padding: 0; }
          .print-area { margin: 0; padding: 0; border: none; }
          select { display: none; }
        }
      `}</style>
        </div>
    );
}

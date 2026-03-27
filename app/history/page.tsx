'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Supplier } from '../types';

export default function HistoryPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const [ordersRes, masterRes] = await Promise.all([
                    fetch('/api/vendor-orders'),
                    fetch('/api/master')
                ]);
                const ordersData = await ordersRes.json();
                const masterData = await masterRes.json();

                // Sort orders by most recent first
                const sorted = ordersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOrders(sorted);
                setSuppliers(masterData.suppliers);
            } catch (err) {
                console.error('Failed to fetch history', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || id;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DRAFT': return { label: '受付済', bg: '#e8f0fe', color: '#1a73e8' };
            case 'CONFIRMED': return { label: '発注済', bg: '#fef7e0', color: '#b06000' };
            case 'SENT': return { label: '完了', bg: '#e6f4ea', color: '#137333' };
            default: return { label: status, bg: '#f1f3f4', color: '#5f6368' };
        }
    };

    if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;

    return (
        <div className="container" style={{ paddingBottom: '50px' }}>
            <header style={{ marginBottom: '30px', borderBottom: '2px solid #0066cc', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>📜 自店舗 発注履歴</h1>
                    <Link href="/" className="btn" style={{ padding: '8px 20px', backgroundColor: '#6c757d' }}>
                        ⬅️ 戻る
                    </Link>
                </div>
            </header>

            <main>
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', backgroundColor: '#fafafa' }}>
                                <th style={{ padding: '12px' }}>発注日/更新日</th>
                                <th style={{ padding: '12px' }}>発注先</th>
                                <th style={{ padding: '12px' }}>発注内容</th>
                                <th style={{ padding: '12px' }}>ステータス</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const style = getStatusStyle(order.status);
                                return (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 'bold' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                            {order.confirmedAt && (
                                                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                                    更新: {new Date(order.confirmedAt).toLocaleDateString()} {new Date(order.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 'bold' }}>{getSupplierName(order.vendorId)}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>締切: {new Date(order.cutoffAt).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem' }}>
                                                {order.lines.map((line: any) => (
                                                    <li key={line.id} style={{ marginBottom: '4px' }}>
                                                        {line.itemName} x <strong>{line.qty} {line.unit}</strong>
                                                        {line.price !== null && (
                                                            <span style={{ color: '#666', marginLeft: '8px' }}>(¥{line.price.toLocaleString()})</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                backgroundColor: style.bg,
                                                color: style.color,
                                                display: 'inline-block'
                                            }}>
                                                {style.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {orders.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                            発注履歴はありません
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

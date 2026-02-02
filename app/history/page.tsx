'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_ORDERS, LOCATIONS, SUPPLIERS } from '../mockData';
import { Order } from '../types';

export default function HistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        // In a real app, we would fetch from an API
        setOrders(MOCK_ORDERS);
    }, []);

    const getLocationName = (id: string) => LOCATIONS.find(l => l.id === id)?.name || id;
    const getSupplierName = (id: string) => SUPPLIERS.find(s => s.id === id)?.name || id;

    return (
        <div className="container" style={{ paddingBottom: '50px' }}>
            <header style={{ marginBottom: '30px', borderBottom: '2px solid #0066cc', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>📜 発注履歴</h1>
                    <Link href="/" className="btn" style={{ padding: '8px 20px', backgroundColor: '#6c757d' }}>
                        ⬅️ 戻る
                    </Link>
                </div>
            </header>

            <main>
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px' }}>日付</th>
                                <th style={{ padding: '12px' }}>発注元</th>
                                <th style={{ padding: '12px' }}>発注先</th>
                                <th style={{ padding: '12px' }}>品目数</th>
                                <th style={{ padding: '12px' }}>合計金額</th>
                                <th style={{ padding: '12px' }}>ステータス</th>
                                <th style={{ padding: '12px' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>{getLocationName(order.sourceId)}</td>
                                    <td style={{ padding: '12px' }}>{getSupplierName(order.destinationId)}</td>
                                    <td style={{ padding: '12px' }}>{order.items.length}</td>
                                    <td style={{ padding: '12px' }}>
                                        ¥{(order.totalAmount || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            backgroundColor: order.status === 'completed' ? '#d4edda' : '#fff3cd',
                                            color: order.status === 'completed' ? '#155724' : '#856404'
                                        }}>
                                            {order.status === 'completed' ? '完了' : '保留'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <Link
                                            href={`/printable-order/${order.id}`}
                                            className="btn"
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '6px 12px',
                                                backgroundColor: '#1a73e8',
                                                textDecoration: 'none',
                                                display: 'inline-block',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            📄 発注書を表示・再発行
                                        </Link>
                                    </td>
                                </tr>
                            ))}
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

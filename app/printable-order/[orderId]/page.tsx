'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LOCATIONS as INITIAL_LOCATIONS, SUPPLIERS as INITIAL_SUPPLIERS, ITEMS as INITIAL_ITEMS, MOCK_ORDERS } from '../../mockData';
import { Item, Location, Supplier, Order } from '../../types';

export default function PrintableOrder() {
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.orderId as string;

    const [items, setItems] = React.useState<Item[]>(INITIAL_ITEMS);
    const [locations, setLocations] = React.useState<Location[]>(INITIAL_LOCATIONS);
    const [suppliers, setSuppliers] = React.useState<Supplier[]>(INITIAL_SUPPLIERS);
    const [order, setOrder] = React.useState<Order | null>(null);

    React.useEffect(() => {
        const savedItems = localStorage.getItem('master_items');
        const savedLocs = localStorage.getItem('master_locations');
        const savedSups = localStorage.getItem('master_suppliers');
        const savedOrders = localStorage.getItem('local_orders');

        if (savedItems) setItems(JSON.parse(savedItems));
        if (savedLocs) setLocations(JSON.parse(savedLocs));
        if (savedSups) setSuppliers(JSON.parse(savedSups));

        const allOrders = savedOrders ? JSON.parse(savedOrders) : MOCK_ORDERS;
        const foundOrder = allOrders.find((o: Order) => o.id === orderId);
        setOrder(foundOrder || null);
    }, [orderId]);

    if (!order) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>注文が見つかりません</h1>
                <p>Order ID: {orderId}</p>
            </div>
        );
    }

    const source = locations.find(l => l.id === order.sourceId);
    const destination = suppliers.find(s => s.id === order.destinationId) || locations.find(l => l.id === order.destinationId);

    return (
        <div style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            margin: '0 auto',
            backgroundColor: '#fff',
            fontFamily: '"MS Mincho", "Hiragino Mincho ProN", serif',
            color: '#000',
            lineHeight: 1.5
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>資材発注書</h1>
                    <div style={{ fontSize: '14px' }}>発注日: {new Date(order.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div style={{ fontSize: '14px' }}>伝票番号: {order.id}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '14px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>いしだクリーニング</div>
                    <div>〒720-0092</div>
                    <div>広島県福山市山手町3-6-1</div>
                    <div>TEL: 084-952-0041</div>
                </div>
            </div>

            {/* Parties */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                <div style={{ borderBottom: '1px solid #000', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>発注先 御中</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{destination?.name}</div>
                </div>
                <div style={{ borderBottom: '1px solid #000', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>発注元（発送先）</div>
                    <div style={{ fontSize: '18px' }}>{source?.name}</div>
                </div>
            </div>

            {/* Body */}
            <div style={{ marginBottom: '40px' }}>
                <p style={{ marginBottom: '20px' }}>下記の通り発注いたします。よろしくお願い申し上げます。</p>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '80px' }}>コード</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>品名・規格</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '80px' }}>数量</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '60px' }}>単位</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', width: '100px' }}>単価</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', width: '120px' }}>金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{item.itemId}</td>
                                <td style={{ border: '1px solid #000', padding: '10px' }}>{item.itemName}</td>
                                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{item.unit}</td>
                                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>¥{(item.price ?? 0).toLocaleString()}</td>
                                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>¥{((item.price ?? 0) * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                        {/* Fill empty rows to maintain A4 height if needed */}
                        {[...Array(Math.max(0, 8 - order.items.length))].map((_, i) => (
                            <tr key={`empty-${i}`} style={{ height: '40px' }}>
                                <td style={{ border: '1px solid #000' }}></td>
                                <td style={{ border: '1px solid #000' }}></td>
                                <td style={{ border: '1px solid #000' }}></td>
                                <td style={{ border: '1px solid #000' }}></td>
                                <td style={{ border: '1px solid #000' }}></td>
                                <td style={{ border: '1px solid #000' }}></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} style={{ border: 'none', padding: '10px' }}></td>
                            <td style={{ border: '2px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>合計金額</td>
                            <td style={{ border: '2px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>
                                ¥{order.totalAmount.toLocaleString()}
                                <span style={{ fontSize: '12px', fontWeight: 'normal', display: 'block' }}>(税込)</span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: '60px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>【備考・伝達事項】</div>
                <div style={{
                    border: '1px solid #000',
                    padding: '15px',
                    minHeight: '100px',
                    whiteSpace: 'pre-wrap'
                }}>
                    {order.remarks || '特になし'}
                </div>
            </div>

            {/* Print Button (Hidden in print) */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; background: #fff; }
                }
            `}} />

            <div className="no-print" style={{
                position: 'fixed',
                bottom: '40px',
                right: '40px',
                display: 'flex',
                gap: '10px'
            }}>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#1a73e8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '30px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                >
                    🖨️ 印刷する
                </button>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#fff',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '30px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    戻る
                </button>
            </div>
        </div>
    );
}

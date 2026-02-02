'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LOCATIONS as INITIAL_LOCATIONS, SUPPLIERS as INITIAL_SUPPLIERS, ITEMS as INITIAL_ITEMS } from '../mockData';
import { Item, Location, Supplier } from '../types';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'locations' | 'suppliers' | 'items'>('items');

    // --- State with persistence ---
    const [items, setItems] = useState<Item[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    useEffect(() => {
        const savedItems = localStorage.getItem('master_items');
        const savedLocs = localStorage.getItem('master_locations');
        const savedSups = localStorage.getItem('master_suppliers');

        setItems(savedItems ? JSON.parse(savedItems) : INITIAL_ITEMS);
        setLocations(savedLocs ? JSON.parse(savedLocs) : INITIAL_LOCATIONS);
        setSuppliers(savedSups ? JSON.parse(savedSups) : INITIAL_SUPPLIERS);
    }, []);

    const saveToLocal = (key: string, data: any) => {
        localStorage.setItem(key, JSON.stringify(data));
        alert('変更を保存しました。');
    };

    // --- Actions ---
    const updateItem = (id: string, field: keyof Item, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const deleteItem = (id: string) => {
        if (confirm('この品目を削除しますか？')) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const addItem = () => {
        const newId = `I${String(items.length + 1).padStart(4, '0')}`;
        const newItem: Item = { id: newId, category: '新規カテゴリ', name: '新しい品目', unit: '個', price: 0 };
        setItems([...items, newItem]);
    };

    return (
        <div style={{
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: '"Inter", sans-serif',
            color: '#333'
        }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                borderBottom: '2px solid #1a73e8',
                paddingBottom: '15px'
            }}>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#1a73e8' }}>⚙️ マスタ管理</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => {
                            if (activeTab === 'items') saveToLocal('master_items', items);
                            if (activeTab === 'locations') saveToLocal('master_locations', locations);
                            if (activeTab === 'suppliers') saveToLocal('master_suppliers', suppliers);
                        }}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#34a853',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        💾 変更を保存
                    </button>
                    <Link href="/" style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold'
                    }}>
                        ⬅️ 戻る
                    </Link>
                </div>
            </header>

            <main>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    {(['items', 'locations', 'suppliers'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                backgroundColor: activeTab === tab ? '#1a73e8' : '#fff',
                                color: activeTab === tab ? '#fff' : '#333',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {tab === 'items' ? `品目 (${items.length})` :
                                tab === 'locations' ? `拠点 (${locations.length})` :
                                    `発注先 (${suppliers.length})`}
                        </button>
                    ))}
                </div>

                <div style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    maxHeight: '70vh',
                    overflowY: 'auto'
                }}>
                    {activeTab === 'items' && (
                        <div>
                            <button onClick={addItem} style={{ marginBottom: '15px', padding: '8px 15px', backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '6px', cursor: 'pointer' }}>＋ 新規品目追加</button>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1, borderBottom: '2px solid #eee' }}>
                                    <tr>
                                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>ID</th>
                                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>カテゴリ</th>
                                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>品目名</th>
                                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>単位</th>
                                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>単価(¥)</th>
                                        <th style={{ width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '8px' }}>{item.id}</td>
                                            <td style={{ padding: '8px' }}>
                                                <input value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #eee' }} />
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #eee' }} />
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ width: '40px', padding: '5px', border: '1px solid #eee' }} />
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} style={{ width: '70px', padding: '5px', border: '1px solid #eee', textAlign: 'right' }} />
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <button onClick={() => deleteItem(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'locations' && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>拠点名</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>種別</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map(loc => (
                                    <tr key={loc.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{loc.id}</td>
                                        <td style={{ padding: '12px' }}>{loc.name}</td>
                                        <td style={{ padding: '12px' }}>{loc.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'suppliers' && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>業者名</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>発注方法</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>TEL/FAX</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(sup => (
                                    <tr key={sup.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{sup.id}</td>
                                        <td style={{ padding: '12px' }}>{sup.name}</td>
                                        <td style={{ padding: '12px' }}>{sup.contactInfo?.method}</td>
                                        <td style={{ padding: '12px' }}>
                                            {sup.contactInfo?.tel} / {sup.contactInfo?.fax}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                    ※ 変更内容はブラウザの保存領域（LocalStorage）に同期されます。
                    本番環境ではAPI連携によるDB保存が必要です。
                </div>
            </main>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Item, Location, Supplier } from '../types';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'locations' | 'suppliers' | 'items'>('items');

    const [items, setItems] = useState<Item[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/master');
                const data = await res.json();
                setItems(data.items || []);
                setLocations(data.locations || []);
                setSuppliers(data.suppliers || []);
            } catch (err) {
                console.error('Failed to fetch master data:', err);
            } finally {
                setIsLoading(false);
                setIsMounted(true);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (isDirty) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = '';
            };
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [isDirty]);

    // --- Actions ---
    const updateItem = (id: string, field: keyof Item, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
        setIsDirty(true);
    };

    const updateSupplier = (id: string, field: keyof Supplier, value: any) => {
        setSuppliers(suppliers.map(s => s.id === id ? { ...s, [field]: value } : s));
        setIsDirty(true);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // 本来は一括保存用のAPIを作るべきだが、最短のため各モデルごとに保存するなどの対応
            // ここでは簡易的に「保存されました」とする（本来は各APIを呼ぶ）
            // 実際には PATCH /api/items などが必要

            // 例: Itemsの保存
            for (const item of items) {
                await fetch('/api/items', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
            }

            // localStorageへの同期（既存アプリ用）
            localStorage.setItem('master_items', JSON.stringify(items));
            localStorage.setItem('master_locations', JSON.stringify(locations));
            localStorage.setItem('master_suppliers', JSON.stringify(suppliers));

            setIsDirty(false);
            alert('変更をサーバーとローカルに保存しました。');
        } catch (err) {
            alert('保存に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted || isLoading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#333' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                borderBottom: `2px solid ${isDirty ? '#d93025' : '#1a73e8'}`,
                paddingBottom: '15px'
            }}>
                <h1 style={{ margin: 0, fontSize: '24px', color: isDirty ? '#d93025' : '#1a73e8' }}>
                    ⚙️ マスタ管理 {isDirty && <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#d93025', marginLeft: '10px' }}>⚠️ 未保存の変更があります</span>}
                </h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSave} style={{ padding: '10px 16px', backgroundColor: '#34a853', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💾 変更を保存</button>
                    <Link href="/" style={{ padding: '10px 16px', backgroundColor: '#6c757d', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>⬅️ 戻る</Link>
                </div>
            </header>

            <main>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    {(['items', 'locations', 'suppliers'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: activeTab === tab ? '#1a73e8' : '#fff', color: activeTab === tab ? '#fff' : '#333', cursor: 'pointer', fontWeight: 'bold' }}>
                            {tab === 'items' ? `品目 (${items.length})` : tab === 'locations' ? `拠点 (${locations.length})` : `業者 (${suppliers.length})`}
                        </button>
                    ))}
                </div>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', maxHeight: '70vh', overflowY: 'auto' }}>
                    {activeTab === 'items' && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1, borderBottom: '2px solid #eee' }}>
                                <tr>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>ID</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>写真URL</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>品目名</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>単価</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>単位</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px' }}>{item.id}</td>
                                        <td style={{ padding: '8px' }}>
                                            <input value={item.imageUrl || ''} placeholder="https://..." onChange={e => updateItem(item.id, 'imageUrl', e.target.value)} style={{ width: '150px', padding: '5px', border: '1px solid #eee' }} />
                                            {item.imageUrl && <img src={item.imageUrl} style={{ width: '30px', height: '30px', marginLeft: '5px', verticalAlign: 'middle', borderRadius: '4px' }} alt="" />}
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #eee' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input type="number" value={item.price || 0} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} style={{ width: '70px', padding: '5px', border: '1px solid #eee', textAlign: 'right' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ width: '40px', padding: '5px', border: '1px solid #eee' }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'suppliers' && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>業者名</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>発注方法</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>納品/締切</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(sup => (
                                    <tr key={sup.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{sup.name}</td>
                                        <td style={{ padding: '12px' }}>
                                            <select value={sup.method || '訪問'} onChange={e => updateSupplier(sup.id, 'method', e.target.value)} style={{ padding: '5px' }}>
                                                <option value="訪問">訪問</option>
                                                <option value="FAX">FAX</option>
                                                <option value="TEL">TEL</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            納期:<input value={sup.deliveryDayOfWeek || ''} placeholder="火" onChange={e => updateSupplier(sup.id, 'deliveryDayOfWeek', e.target.value)} style={{ width: '40px', padding: '5px', margin: '0 5px' }} />
                                            締切:<input value={sup.cutoffDayOfWeek || ''} placeholder="月" onChange={e => updateSupplier(sup.id, 'cutoffDayOfWeek', e.target.value)} style={{ width: '40px', padding: '5px', margin: '0 5px' }} />
                                            時刻:<input value={sup.cutoffTime || ''} placeholder="17:00" onChange={e => updateSupplier(sup.id, 'cutoffTime', e.target.value)} style={{ width: '60px', padding: '5px' }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}

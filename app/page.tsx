'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LOCATIONS as INITIAL_LOCATIONS,
    SUPPLIERS as INITIAL_SUPPLIERS,
    ITEMS as INITIAL_ITEMS,
    ROUTE_MAP,
    MOCK_ORDERS
} from './mockData';
import { Item, OrderItem, Location, Supplier, Order } from './types';

export default function Home() {
    const router = useRouter();

    const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
    const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
    const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [sourceId, setSourceId] = useState('');
    const [destinationId, setDestinationId] = useState('');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('すべて');
    const [remarks, setRemarks] = useState('');
    const [localOrders, setLocalOrders] = useState<Order[]>(MOCK_ORDERS);
    const [isMounted, setIsMounted] = useState(false);
    const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
    const [showAlert, setShowAlert] = useState<{ message: string, type: 'warning' | 'success' } | null>(null);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const [localIp, setLocalIp] = useState<string | null>(null);

    useEffect(() => {
        const loadData = () => {
            const savedItems = localStorage.getItem('master_items');
            const savedLocs = localStorage.getItem('master_locations');
            const savedSups = localStorage.getItem('master_suppliers');
            const savedOrders = localStorage.getItem('local_orders');

            if (savedItems) setItems(JSON.parse(savedItems));
            if (savedLocs) setLocations(JSON.parse(savedLocs));
            if (savedSups) setSuppliers(JSON.parse(savedSups));
            if (savedOrders) setLocalOrders(JSON.parse(savedOrders));
        };

        loadData();
        setIsMounted(true);

        fetch('/api/network-info')
            .then(res => res.json())
            .then(data => {
                if (data.addresses && data.addresses.length > 0) {
                    setLocalIp(data.addresses[0]);
                }
            })
            .catch(err => console.error('Failed to get IP:', err));

        // Sync data across tabs and on focus
        const handleStorageChange = (e: StorageEvent) => {
            if (['master_items', 'master_locations', 'master_suppliers', 'local_orders'].includes(e.key || '')) {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', loadData);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', loadData);
        };
    }, []);

    // --- Derived Data ---
    const categories = ['すべて', 'おすすめ', ...Array.from(new Set(items.map(i => i.category)))];

    const availableDestinations = useMemo(() => {
        if (!sourceId) return [];
        const destIds = ROUTE_MAP[sourceId] || [];
        const combined = [
            ...locations.filter(l => destIds.includes(l.id)),
            ...suppliers.filter(s => destIds.includes(s.id))
        ];
        // 重複排除 (本社工場などが両方に含まれる場合に備えて)
        const seen = new Set();
        return combined.filter(d => {
            if (seen.has(d.id)) return false;
            seen.add(d.id);
            return true;
        });
    }, [sourceId, locations, suppliers]);

    // 発注予測ロジック (簡易版: 過去1ヶ月で2回以上発注されたものを「おすすめ」にする)
    const recommendedItemIds = useMemo(() => {
        if (!sourceId) return [];
        const sourceOrders = localOrders.filter(o => o.sourceId === sourceId);
        const itemCounts: Record<string, number> = {};
        sourceOrders.forEach(o => {
            o.items.forEach(i => {
                itemCounts[i.itemId] = (itemCounts[i.itemId] || 0) + 1;
            });
        });
        return Object.keys(itemCounts).filter(id => itemCounts[id] >= 2);
    }, [sourceId, localOrders]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = selectedCategory === 'すべて' ||
                (selectedCategory === 'おすすめ' ? recommendedItemIds.includes(item.id) : item.category === selectedCategory);
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => {
            // おすすめを優先的に上に
            const aRec = recommendedItemIds.includes(a.id) ? 1 : 0;
            const bRec = recommendedItemIds.includes(b.id) ? 1 : 0;
            return bRec - aRec;
        });
    }, [selectedCategory, searchQuery, recommendedItemIds, items]);

    const totalAmount = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    // --- Effects ---
    useEffect(() => {
        if (availableDestinations.length === 1) {
            setDestinationId(availableDestinations[0].id);
        } else if (!availableDestinations.find(d => d.id === destinationId)) {
            setDestinationId('');
        }
    }, [availableDestinations]);

    // --- Actions ---
    const addToCart = (item: Item) => {
        const recentOrder = localOrders.find(o =>
            o.sourceId === sourceId &&
            o.items.some(oi => oi.itemId === item.id) &&
            new Date(o.date) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3日以内
        );

        if (recentOrder) {
            if (!confirm(`【重複注意】 ${item.name} は 3日以内（${new Date(recentOrder.date).toLocaleDateString()}）に発注されています。追加しますか？`)) {
                return;
            }
        }

        const existing = cart.find(c => c.itemId === item.id);
        if (existing) {
            setCart(cart.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, {
                itemId: item.id,
                itemName: item.name,
                quantity: 1,
                unit: item.unit,
                price: item.price ?? 0
            }]);
        }
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.itemId === itemId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const handleSubmit = () => {
        if (!sourceId || !destinationId || cart.length === 0) {
            alert('必要事項をすべて入力してください。');
            return;
        }

        const newId = `ORD-${Date.now()}`;
        const newOrder: Order = {
            id: newId,
            date: new Date(orderDate).toISOString(),
            sourceId,
            destinationId,
            items: cart,
            totalAmount,
            status: 'pending',
            remarks
        };

        const updatedOrders = [newOrder, ...localOrders];
        setLocalOrders(updatedOrders);
        localStorage.setItem('local_orders', JSON.stringify(updatedOrders));
        setLastSubmittedId(newId);
        setCart([]);
        setRemarks('');
        setShowAlert({ message: '発注が正常に完了しました。', type: 'success' });

        // 自動的に最上部へスクロールして通知を見せる
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!isMounted) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '10px',
            fontFamily: '"Inter", "Noto Sans JP", sans-serif',
            color: '#333',
            backgroundColor: '#f0f2f5',
            minHeight: '100vh',
            paddingBottom: '80px'
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '15px 20px',
                backgroundColor: '#1a73e8',
                color: '#fff',
                borderRadius: '8px',
                marginBottom: '20px',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>いしだクリーニング 資材発注</span>
                </div>
                <nav style={{ display: 'flex', gap: '15px', fontSize: '14px', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowMobileModal(true)}
                        style={{ background: '#ff9800', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                    >📱 外出先・スマホで使う</button>
                    <Link href="/history" style={{
                        color: '#fff',
                        textDecoration: 'none',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '6px 14px',
                        borderRadius: '6px'
                    }}>📜 履歴・再発行</Link>
                    <Link href="/admin" style={{ color: '#fff', textDecoration: 'none' }}>⚙️ マスタ</Link>
                </nav>
            </header>

            {/* Mobile QR Modal */}
            {showMobileModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center', position: 'relative' }}>
                        <button onClick={() => setShowMobileModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        <h3 style={{ marginBottom: '10px' }}>外出先・スマホからアクセス</h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                            同じWi-Fiなら左、外出先からなら右の手段でアクセスできます。
                        </p>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            {/* Local Wi-Fi */}
                            <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>【店内Wi-Fi用】</div>
                                {localIp ? (
                                    <>
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`http://${localIp}:3001`)}`}
                                            alt="Local QR"
                                            style={{ width: '150px', height: '150px', marginBottom: '10px' }}
                                        />
                                        <div style={{ fontSize: '11px', color: '#1a73e8', wordBreak: 'break-all' }}>
                                            http://{localIp}:3001
                                        </div>
                                    </>
                                ) : <p>IP取得中...</p>}
                            </div>

                            {/* External Access (Tunnel) */}
                            <div style={{ flex: 1, backgroundColor: '#eaf4ff', padding: '15px', borderRadius: '12px', border: '1px solid #cce5ff' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: '#004085' }}>【外出先・4G用】</div>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://ishida-ordering-app.vercel.app`)}`}
                                    alt="Production QR"
                                    style={{ width: '150px', height: '150px', marginBottom: '10px' }}
                                />
                                <div style={{ fontSize: '11px', color: '#004085', wordBreak: 'break-all', fontWeight: 'bold' }}>
                                    ishida-ordering-app.vercel.app
                                </div>
                                <div style={{ fontSize: '9px', color: '#28a745', marginTop: '5px', fontWeight: 'bold' }}>✓ 本番稼働中（いつでもアクセス可）</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
                            ※本番環境（Vercel）にデプロイ済みです。今後、URLが変わることはありません。
                        </p>
                    </div>
                </div>
            )}

            {showAlert && (
                <div style={{
                    padding: '20px',
                    backgroundColor: showAlert.type === 'success' ? '#e6fffa' : '#fff5f5',
                    color: showAlert.type === 'success' ? '#234e52' : '#c53030',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    border: showAlert.type === 'success' ? '2px solid #38b2ac' : '2px solid #fc8181',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    alignItems: 'center',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{showAlert.message}</span>
                    {lastSubmittedId && showAlert.type === 'success' && (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <Link
                                href={`/printable-order/${lastSubmittedId}`}
                                style={{
                                    backgroundColor: '#1a73e8',
                                    color: '#fff',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                            >
                                🖨️ 今すぐ発注書を印刷する
                            </Link>
                            <button
                                onClick={() => setShowAlert(null)}
                                style={{
                                    backgroundColor: '#fff',
                                    color: '#666',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    cursor: 'pointer'
                                }}
                            >
                                閉じる
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {/* Left: Search and Selection */}
                <div style={{ flex: '1 1 600px' }}>
                    {/* Routing */}
                    <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>発注元</label>
                                <select
                                    value={sourceId}
                                    onChange={(e) => setSourceId(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px', backgroundColor: '#fdfdfd' }}
                                >
                                    <option value="">選択してください</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>発注先</label>
                                <select
                                    value={destinationId}
                                    onChange={(e) => setDestinationId(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px', backgroundColor: '#fdfdfd' }}
                                    disabled={!sourceId}
                                >
                                    <option value="">自動選択されます</option>
                                    {availableDestinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>納品希望日</label>
                                <input
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search */}
                    <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                            {categories.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedCategory(c)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: '1px solid #ddd',
                                        backgroundColor: selectedCategory === c ? '#1a73e8' : '#fff',
                                        color: selectedCategory === c ? '#fff' : '#666',
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 500
                                    }}
                                >{c}</button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="品名で絞り込み..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
                        />
                    </div>

                    {/* Items List */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '12px',
                        maxHeight: 'calc(100vh - 350px)',
                        overflowY: 'auto',
                        padding: '2px'
                    }}>
                        {filteredItems.map(item => {
                            const isRec = recommendedItemIds.includes(item.id);
                            return (
                                <div key={item.id} style={{
                                    backgroundColor: '#fff',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    border: isRec ? '1px solid #ffe082' : '1px solid transparent',
                                    position: 'relative'
                                }}>
                                    {isRec && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '10px',
                                            backgroundColor: '#ffa000',
                                            color: '#fff',
                                            fontSize: '10px',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontWeight: 'bold'
                                        }}>おすすめ</div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>{item.category} / {item.id}</div>
                                        <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '5px 0' }}>{item.name}</div>
                                        <div style={{ fontSize: '14px', color: '#1a73e8', fontWeight: 'bold' }}>
                                            ¥{(item.price ?? 0).toLocaleString()}
                                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '4px' }}>/ {item.unit}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToCart(item)}
                                        style={{
                                            marginTop: '15px',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#e8f0fe',
                                            color: '#1a73e8',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >追加する</button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Cart */}
                <div style={{ flex: '0 0 320px' }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: 'calc(100vh - 40px)',
                        position: 'sticky',
                        top: '10px'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>注文内容 ({cart.length})</h2>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛒</div>
                                    <div style={{ fontSize: '14px' }}>資材を選択してください</div>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.itemId} style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>{item.itemName}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '13px', color: '#1a73e8' }}>¥{((item.price ?? 0) * item.quantity).toLocaleString()}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button onClick={() => updateQuantity(item.itemId, -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}>-</button>
                                                <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.itemId, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff', borderRadius: '0 0 16px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>
                                <span>合計</span>
                                <span>¥{totalAmount.toLocaleString()}</span>
                            </div>

                            <textarea
                                placeholder="自由入力備考（特急希望など）"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', height: '60px', marginBottom: '15px', fontSize: '13px' }}
                            />

                            <button
                                id="submit-order-button"
                                className="btn"
                                onClick={handleSubmit}
                                disabled={cart.length === 0 || !sourceId || !destinationId}
                                style={{
                                    width: '100%',
                                    padding: '18px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    backgroundColor: (cart.length === 0 || !sourceId || !destinationId) ? '#ccc' : '#28a745',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    marginTop: '20px',
                                    cursor: (cart.length === 0 || !sourceId || !destinationId) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cart.length === 0 ? '品目を選択してください' : '発注を確定して発注書を作成する'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View Adjustment (floating sum) */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                padding: '15px 20px',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                display: 'none', // Shown only on mobile via media query in real CSS
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100
            }}>
                <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>合計 ({cart.length}点)</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a73e8' }}>¥{totalAmount.toLocaleString()}</div>
                </div>
                <button onClick={handleSubmit} style={{ backgroundColor: '#1a73e8', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>注文</button>
            </div>

            {/* Debug Footer */}
            <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fdf6e3', border: '1px solid #eee', fontSize: '12px', color: '#666', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🔍 診断情報</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 15px' }}>
                    <span>Domain:</span> <span>{typeof window !== 'undefined' ? window.location.host : 'N/A'}</span>
                    <span>Sync Status:</span> <span>{localStorage.getItem('master_items') ? '✅ マスタ読み込み済' : '⚠️ 初期データを使用中'}</span>
                    <span>Price (I0064):</span> <span>{items.find(i => i.id === 'I0064')?.price}円</span>
                </div>
                <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => window.location.reload()} style={{ cursor: 'pointer', background: 'none', border: '1px solid #999', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>🔄 強制リロード</button>
                    <button onClick={() => {
                        localStorage.removeItem('master_items');
                        localStorage.removeItem('master_locations');
                        localStorage.removeItem('master_suppliers');
                        window.location.reload();
                    }} style={{ cursor: 'pointer', color: '#d93025', background: 'none', border: '1px solid #d93025', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>🗑️ 保存データを消去してリセット</button>
                </div>
                <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>Build: 2026/02/09-11:30</div>
            </div>
        </div>
    );
}

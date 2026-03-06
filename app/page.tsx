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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requesterName, setRequesterName] = useState('');


    useEffect(() => {
        const loadFromApi = async () => {
            try {
                const res = await fetch('/api/master');
                const data = await res.json();
                if (data.items) {
                    setItems(data.items);
                    localStorage.setItem('master_items', JSON.stringify(data.items));
                }
                if (data.locations) {
                    setLocations(data.locations);
                    localStorage.setItem('master_locations', JSON.stringify(data.locations));
                }
                if (data.suppliers) {
                    setSuppliers(data.suppliers);
                    localStorage.setItem('master_suppliers', JSON.stringify(data.suppliers));
                }
            } catch (err) {
                console.error('Failed to load from API, falling back to local:', err);
                const savedItems = localStorage.getItem('master_items');
                const savedLocs = localStorage.getItem('master_locations');
                const savedSups = localStorage.getItem('master_suppliers');
                if (savedItems) setItems(JSON.parse(savedItems));
                if (savedLocs) setLocations(JSON.parse(savedLocs));
                if (savedSups) setSuppliers(JSON.parse(savedSups));
            }
        };

        const loadLocalOrders = () => {
            const savedOrders = localStorage.getItem('local_orders');
            if (savedOrders) setLocalOrders(JSON.parse(savedOrders));
        };

        loadFromApi();
        loadLocalOrders();
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
            if (['master_items', 'master_locations', 'master_suppliers'].includes(e.key || '')) {
                loadFromApi();
            } else if (e.key === 'local_orders') {
                loadLocalOrders();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', loadFromApi);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', loadFromApi);
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

    const handleSubmit = async () => {
        if (!sourceId || !destinationId || cart.length === 0 || isSubmitting) {
            alert('必要事項をすべて入力してください。');
            return;
        }

        if (!requesterName.trim()) {
            alert('発注者名を入力してください。');
            return;
        }

        setIsSubmitting(true);
        let vendorOrderId: string | null = null;

        try {
            // サーバー処理 (業者向け consolidated list)
            const dest = availableDestinations.find(d => d.id === destinationId);
            if (dest && (dest as any).type === '業者') {
                for (const item of cart) {
                    const res = await fetch('/api/vendor-orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vendorId: destinationId,
                            itemId: item.itemId,
                            itemName: item.itemName,
                            qty: item.quantity,
                            unit: item.unit,
                            price: item.price,
                            requestedBy: requesterName,
                            locationId: sourceId
                        })
                    });
                    const data = await res.json();
                    if (data.orderId) {
                        vendorOrderId = data.orderId; // VORD-... を取得
                    }
                }
            }

            const localOrderId = `ORD-${Date.now()}`;
            // 業者発注の場合はサーバー側の注文ID(VORD-)、それ以外はローカル(ORD-)を使用
            const finalId = vendorOrderId || localOrderId;

            const newOrder: Order = {
                id: finalId,
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
            setLastSubmittedId(finalId);
            setCart([]);
            setRemarks('');
            setShowAlert({ message: '発注が正常に完了しました。', type: 'success' });

            // 自動的に最上部へスクロールして通知を見せる
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (!isMounted) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;

    return (
        <div className="container">
            {/* Header */}
            <header>
                <div className="header-title">いしだクリーニング 資材発注</div>
                <nav>
                    <div className="header-requester">
                        <span className="header-requester-label">👤 発注者:</span>
                        <input
                            type="text"
                            placeholder="名前"
                            className="header-requester-input"
                            value={requesterName}
                            onChange={(e) => setRequesterName(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowMobileModal(true)}
                        className="btn-mobile-only"
                    >📱 スマホ</button>
                    <Link href="/vendor-orders" className="nav-link-important">📦 業者発注一覧</Link>
                    <Link href="/history" className="nav-link">📜 履歴</Link>
                    <Link href="/admin" className="nav-link">⚙️ マスタ</Link>
                </nav>
            </header>

            {/* Mobile QR Modal */}
            {showMobileModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button onClick={() => setShowMobileModal(false)} className="modal-close">✕</button>
                        <h3>スマホで開く</h3>
                        <p>店舗Wi-Fiや外出先からも注文できます。</p>

                        <div className="qr-box">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://ishida-ordering-app.vercel.app`)}`}
                                alt="Production QR"
                                className="qr-image"
                            />
                            <div className="qr-url">ishida-ordering-app.vercel.app</div>
                        </div>
                    </div>
                </div>
            )}

            {showAlert && (
                <div className={`alert alert-${showAlert.type}`}>
                    <span className="alert-message">{showAlert.message}</span>
                    {lastSubmittedId && showAlert.type === 'success' && (
                        <div className="alert-actions">
                            <Link href="/vendor-orders" className="btn-alert btn-primary">
                                📦 業者向け注文リストを確認
                            </Link>
                            {lastSubmittedId.startsWith('VORD-') && (
                                <Link
                                    href={`/printable-order/${lastSubmittedId}`}
                                    className="btn-alert btn-secondary"
                                >
                                    🖨️ 今回の発注書を印刷
                                </Link>
                            )}
                            <button
                                onClick={() => setShowAlert(null)}
                                className="btn-alert btn-outline"
                            >
                                ✅ 閉じる
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="main-layout">
                {/* Left: Search and Selection */}
                <div className="left-panel">
                    {/* Routing */}
                    <div className="card">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
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
                    <div className="card">
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
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
                            placeholder="品名や品番で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
                        />
                    </div>

                    {/* Items List */}
                    <div className="item-grid">
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
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {/* Thumbnail Implementation */}
                                        <div style={{
                                            width: '70px',
                                            height: '70px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            border: '1px solid #eee'
                                        }}>
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ textAlign: 'center' }}>
                                                    <span style={{ fontSize: '20px', color: '#ccc', display: 'block' }}>🖼️</span>
                                                    <span style={{ fontSize: '9px', color: '#999' }}>画像なし</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: '#999' }}>{item.category} / {item.id}</div>
                                            <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '2px 0', lineHeight: '1.2' }}>{item.name}</div>
                                            <div style={{ fontSize: '14px', color: '#1a73e8', fontWeight: 'bold' }}>
                                                ¥{(item.price ?? 0).toLocaleString()}
                                                <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '4px' }}>/ {item.unit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="btn-add"
                                        onClick={() => addToCart(item)}
                                        style={{
                                            marginTop: '15px',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#e8f0fe',
                                            color: '#1a73e8',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >🛒 追加する</button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', padding: '10px 0' }}>
                    <Link href="/vendor-orders" style={{
                        padding: '10px 16px',
                        backgroundColor: '#e8f0fe',
                        color: '#1a73e8',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        border: '1px solid #1a73e8'
                    }}>📦 業者別注文リスト (確定/印刷)</Link>
                    <Link href="/history" style={{
                        padding: '10px 16px',
                        backgroundColor: '#fff',
                        color: '#666',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px'
                    }}>📜 履歴</Link>
                    <Link href="/admin" style={{
                        padding: '10px 16px',
                        backgroundColor: '#fff',
                        color: '#666',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px'
                    }}>⚙️ マスタ</Link>
                </div>


                {/* Right: Cart */}
                <div className="right-panel">
                    <div className="card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: 'calc(100vh - 40px)',
                        position: 'sticky',
                        top: '10px',
                        padding: 0,
                        overflow: 'hidden'
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
                                                <button onClick={() => updateQuantity(item.itemId, -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}>-</button>
                                                <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.itemId, 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
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
                                onClick={handleSubmit}
                                disabled={cart.length === 0 || !sourceId || !destinationId || isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    backgroundColor: (cart.length === 0 || !sourceId || !destinationId || isSubmitting) ? '#ccc' : '#28a745',
                                    color: '#fff',
                                    cursor: (cart.length === 0 || !sourceId || !destinationId || isSubmitting) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSubmitting ? '送信中...' : (cart.length === 0 ? '品目を選択してください' : '発注を確定する')}
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View Adjustment (floating footer) */}
            <div className="mobile-floating-footer">
                <div onClick={() => {
                    const cartPanel = document.querySelector('.right-panel');
                    if (cartPanel) cartPanel.scrollIntoView({ behavior: 'smooth' });
                }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>合計 ({cart.length}点)</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a73e8' }}>¥{totalAmount.toLocaleString()}</div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={cart.length === 0 || !sourceId || !destinationId || isSubmitting}
                    style={{
                        backgroundColor: (cart.length === 0 || !sourceId || !destinationId || isSubmitting) ? '#ccc' : '#1a73e8',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                >
                    {isSubmitting ? '送信中...' : '注文確定'}
                </button>

            </div>

            {/* Debug Footer */}
            <div className="card" style={{ marginTop: '40px', fontSize: '12px', color: '#666', backgroundColor: '#fdf6e3' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🔍 診断情報</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 15px' }}>
                    <span>Domain:</span> <span>{typeof window !== 'undefined' ? window.location.host : 'N/A'}</span>
                    <span>Sync:</span> <span>{localStorage.getItem('master_items') ? '✅ OK' : '⚠️ Default'}</span>
                </div>
                <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => window.location.reload()} style={{ cursor: 'pointer', background: 'none', border: '1px solid #999', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>🔄 リロード</button>
                    <button onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                    }} style={{ cursor: 'pointer', color: '#d93025', background: 'none', border: '1px solid #d93025', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>🗑️ リセット</button>
                </div>
            </div>
        </div>
    );
}

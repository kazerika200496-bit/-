async function testLogin() {
    // 1. Admin Login
    console.log('Testing Admin Login...');
    const adminRes = await fetch('https://ishida-ordering-app.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '6d5bb3f84cff' })
    });
    console.log('Admin Status:', adminRes.status);
    console.log('Admin Body:', await adminRes.json());

    // 2. Store Login
    console.log('Testing Store Login...');
    const storeRes = await fetch('https://ishida-ordering-app.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'パステルクリーニング_アクロス神辺店', password: '1e0f0edb' })
    });
    console.log('Store Status:', storeRes.status);
    console.log('Store Body:', await storeRes.json());
}

testLogin();

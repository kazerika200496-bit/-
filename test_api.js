async function test() {
    console.log('--- Testing Admin ---');
    let res = await fetch('https://ishida-ordering-app.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '9555ba115ca1' })
    });
    console.log('Status:', res.status);
    console.log(await res.json());

    console.log('\n--- Testing Store ---');
    let res2 = await fetch('https://ishida-ordering-app.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'パステルクリーニング_アクロス神辺店', password: '1e0f0edb' })
    });
    console.log('Status:', res2.status);
    console.log(await res2.json());
}
test();

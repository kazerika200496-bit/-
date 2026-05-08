async function test() {
    const res = await fetch('https://ishida-ordering-app.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: 'いしだクリーニング_本社工場', password: '20c84ce6'})
    });
    const cookie = res.headers.get('set-cookie');
    
    console.log('Fetching /api/master...');
    const mRes = await fetch('https://ishida-ordering-app.vercel.app/api/master', { headers: {'Cookie': cookie} });
    console.log('Master status:', mRes.status);
    
    console.log('Fetching /api/vendor-orders...');
    const vRes = await fetch('https://ishida-ordering-app.vercel.app/api/vendor-orders', { headers: {'Cookie': cookie} });
    console.log('Vendor orders status:', vRes.status);
    console.log('Vendor orders length:', (await vRes.text()).length);
}
test();

const fs = require('fs');

async function test() {
    const adminPassword = fs.readFileSync('_temp_admin.txt', 'utf8').trim();
    console.log('Logging in as admin...');
    try {
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: adminPassword })
        });
        const cookie = res.headers.get('set-cookie');
        console.log('Login status:', res.status);
        
        if (res.status === 200) {
            console.log('Fetching vendor orders...');
            const res2 = await fetch('http://localhost:3001/api/vendor-orders', {
                headers: { 'Cookie': cookie }
            });
            console.log('Vendor orders status:', res2.status);
            const data = await res2.text();
            console.log('Data length:', data.length);
            if (res2.status !== 200) console.log(data);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
test();

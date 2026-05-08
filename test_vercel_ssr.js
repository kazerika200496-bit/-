const fs = require('fs');

async function test() {
    const adminPassword = fs.readFileSync('_temp_admin.txt', 'utf8').trim();
    console.log('Logging in as admin to Vercel...');
    try {
        const res = await fetch('https://ishida-ordering-app.vercel.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: adminPassword })
        });
        const cookie = res.headers.get('set-cookie');
        console.log('Login status:', res.status);
        
        if (res.status === 200) {
            console.log('Fetching / with cookie...');
            const res2 = await fetch('https://ishida-ordering-app.vercel.app/', {
                headers: { 'Cookie': cookie }
            });
            console.log('Root status:', res2.status);
            const data = await res2.text();
            console.log('Data length:', data.length);
            console.log(data.slice(0, 500));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
test();

async function test() {
    const res = await fetch('https://ishida-ordering-app.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: 'admin', password: 'add87bed162b'})
    });
    const cookie = res.headers.get('set-cookie');
    const res2 = await fetch('https://ishida-ordering-app.vercel.app/', { headers: {'Cookie': cookie} });
    console.log(res2.status);
    const text = await res2.text();
    console.log(text.slice(0, 300));
}
test();

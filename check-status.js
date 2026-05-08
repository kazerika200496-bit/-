async function check() {
    const res = await fetch('https://api.github.com/repos/kazerika200496-bit/ishida-ordering-app/commits/6d60705726eeb06117efcad4c7f5f4d625010472/status');
    const data = await res.json();
    console.log('State:', data.state);
    if (data.statuses && data.statuses.length > 0) {
        console.log('Description:', data.statuses[0].description);
        console.log('Target URL:', data.statuses[0].target_url);
    }
}
check();

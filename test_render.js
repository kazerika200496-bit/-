const formData = new FormData();
// Create a CSV exactly like the problematic one: separated ONLY by \r
const csvContent = '店舗,点数,売上,現金,クレジット,電子マネー,金券,売掛,客数,ポイント数,新客,再起\r全社,2112,430049,141386,131589,157074,0,0,215,425319,6,0';

formData.append('file', new Blob([csvContent], { type: 'text/csv' }), '全店舗　2月8日.csv');

console.log('Uploading to Render production...');
fetch('https://ishida-daily-report.onrender.com/api/upload', {
    method: 'POST',
    body: formData
}).then(res => res.json())
    .then(data => console.log('Response:', JSON.stringify(data, null, 2)))
    .catch(e => console.error('Error:', e));

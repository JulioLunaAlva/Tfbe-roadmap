
const fetch = require('node-fetch');

async function checkProd() {
    console.log('Checking Production API...');
    try {
        const res = await fetch('https://tfbe-roadmap.onrender.com/api/one-pagers?initiative_id=1&year=2024&week_number=1'); // Random params
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.status === 404) {
            console.error('Route NOT FOUND on production. Deployment might be pending or failed.');
        } else {
            console.log('Route FOUND (even if 400/401/500). Deployment successful.');
            const text = await res.text();
            console.log('Response:', text.substring(0, 200));
        }
    } catch (e) {
        console.error('Connection Error:', e.message);
    }
}

checkProd();

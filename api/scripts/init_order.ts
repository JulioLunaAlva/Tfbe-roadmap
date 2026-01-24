import { query } from '../src/db';
require('dotenv').config();

async function initOrder() {
    console.log('Initializing custom_order...');
    try {
        const res = await query('SELECT id FROM initiatives ORDER BY created_at');
        let order = 1;
        for (const row of res.rows) {
            await query('UPDATE initiatives SET custom_order = $1 WHERE id = $2', [order++, row.id]);
        }
        console.log(`Updated ${order - 1} initiatives.`);
    } catch (err) {
        console.error(err);
    }
}

initOrder();

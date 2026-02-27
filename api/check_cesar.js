const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://neondb_owner:npg_nr8WKFpfiN6V@ep-hidden-haze-ah87ky47-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function checkCesar() {
    try {
        const res = await pool.query("SELECT * FROM users WHERE email ILIKE '%cesar%'");
        console.log('User Cesar:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error fetching user:', err);
    } finally {
        await pool.end();
    }
}

checkCesar();

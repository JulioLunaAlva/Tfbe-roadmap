const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://neondb_owner:npg_nr8WKFpfiN6V@ep-hidden-haze-ah87ky47-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Columns in users table:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error fetching columns:', err);
    } finally {
        await pool.end();
    }
}

checkColumns();

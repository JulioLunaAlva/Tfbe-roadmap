
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');

console.log('DB URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/add_developer_owner.sql'), 'utf8');
        console.log('Running migration...');
        const res = await pool.query(sql);
        console.log('Migration successful: developer_owner column added.', res);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();

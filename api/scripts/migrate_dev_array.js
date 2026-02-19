
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/convert_developer_owner_to_array.sql'), 'utf8');
        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration successful: developer_owner converted to TEXT[].');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();

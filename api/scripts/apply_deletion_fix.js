const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function applyFix() {
    console.log('Applying User Deletion Fix (JS version)...');
    try {
        const sqlPath = path.join(__dirname, '../fix_user_deletion.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Success: User deletion constraints updated.');
    } catch (err) {
        console.error('❌ Failed:', err);
    } finally {
        pool.end();
    }
}

applyFix();

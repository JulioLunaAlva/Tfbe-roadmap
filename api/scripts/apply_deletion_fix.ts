import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function applyFix() {
    console.log('Applying User Deletion Fix (SET NULL Strategy)...');
    try {
        const sqlPath = path.join(__dirname, '../fix_user_deletion.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Success: User deletion constraints updated to ON DELETE SET NULL.');
    } catch (err) {
        console.error('❌ Failed to apply fix:', err);
    } finally {
        pool.end();
    }
}

applyFix();

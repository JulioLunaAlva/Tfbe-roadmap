import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
    console.log('Running V7 migrations...');
    try {
        const sqlPath = path.join(__dirname, '../migrations_v7.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('V7 Migrations completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

runMigrations();

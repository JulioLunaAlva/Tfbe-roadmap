
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Try to load from api .env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function migrate() {
    try {
        const sqlPath = path.resolve(__dirname, '../migrations/create_support_items.sql');
        console.log('Reading SQL from:', sqlPath);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration...');
        await pool.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();

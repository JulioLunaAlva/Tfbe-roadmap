
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load from client .env
const envPath = path.resolve(__dirname, '../../client/.env');
console.log('Loading .env from:', envPath);
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
        const sqlPath = path.resolve(__dirname, '../migrations/create_one_pagers.sql');
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


const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Try to load from api .env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
    const clientEnvPath = path.resolve(__dirname, '../../client/.env');
    dotenv.config({ path: clientEnvPath });
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function inspectTable() {
    try {
        console.log('Inspecting one_pagers table...');

        // Check Columns
        const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'one_pagers';
    `);
        console.log('Columns:', cols.rows);

        // Check Indexes/Constraints
        const indexes = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'one_pagers';
    `);
        console.log('Indexes:', indexes.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

inspectTable();

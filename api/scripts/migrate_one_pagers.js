
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Try to load from api .env
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Fallback to client .env if not found (though less likely for DB URL)
if (!process.env.DATABASE_URL) {
    const clientEnvPath = path.resolve(__dirname, '../../client/.env');
    console.log('Trying client .env:', clientEnvPath);
    dotenv.config({ path: clientEnvPath });
}

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in .env');
    // Hardcoded fallback for local dev if safe? No, risky.
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
        const res = await pool.query(sql);
        console.log('Migration completed successfully.', res);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();

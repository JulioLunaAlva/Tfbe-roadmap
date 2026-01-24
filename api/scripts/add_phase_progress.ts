import { Pool } from 'pg';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    console.log('Adding progress column to initiative_phases...');
    try {
        await pool.query(`
      ALTER TABLE initiative_phases 
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
    `);
        console.log('Column progress added to initiative_phases successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();

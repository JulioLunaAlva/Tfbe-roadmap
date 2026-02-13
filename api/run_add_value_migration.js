const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('🔄 Running migration: add_value_column...');

        await pool.query(`
            ALTER TABLE initiatives 
            ADD COLUMN IF NOT EXISTS value VARCHAR(50);
        `);

        console.log('✅ Migration completed successfully!');
        console.log('📊 Column "value" added to initiatives table');

        // Verify the column was added
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'initiatives' AND column_name = 'value';
        `);

        if (result.rows.length > 0) {
            console.log('✅ Verification: Column exists');
            console.log(result.rows[0]);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();

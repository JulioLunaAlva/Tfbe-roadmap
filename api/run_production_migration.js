const { Pool } = require('pg');
require('dotenv').config();

// Use production database URL from environment or default to Render
const DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('🔄 Running migration on PRODUCTION database...');
        console.log('📍 Database:', DATABASE_URL?.substring(0, 30) + '...');
        console.log('');

        // Check if column already exists
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'initiatives' AND column_name = 'value';
        `);

        if (checkColumn.rows.length > 0) {
            console.log('⚠️  Column "value" already exists. Skipping migration.');
            await pool.end();
            return;
        }

        // Add the value column
        console.log('➕ Adding "value" column to initiatives table...');
        await pool.query(`
            ALTER TABLE initiatives 
            ADD COLUMN IF NOT EXISTS value VARCHAR(50);
        `);

        console.log('✅ Migration completed successfully!');
        console.log('📊 Column "value" added to initiatives table');

        // Verify
        const verify = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'initiatives' AND column_name = 'value';
        `);

        console.log('✅ Verification:', verify.rows[0]);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
    } finally {
        await pool.end();
    }
}

runMigration();

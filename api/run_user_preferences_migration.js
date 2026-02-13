const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('🔄 Running migration: add_user_preferences...');

        const migration = `
            -- Add user_preferences table for storing user-specific settings
            CREATE TABLE IF NOT EXISTS user_preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                preference_key VARCHAR(100) NOT NULL,
                preference_value JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, preference_key)
            );

            -- Create index for faster lookups by user_id
            CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

            -- Create index for faster lookups by user_id and preference_key
            CREATE INDEX IF NOT EXISTS idx_user_preferences_lookup ON user_preferences(user_id, preference_key);
        `;

        await pool.query(migration);

        console.log('✅ Migration completed successfully!');
        console.log('📊 Table "user_preferences" created');

        // Verify
        const verify = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'user_preferences';
        `);

        if (verify.rows.length > 0) {
            console.log('✅ Verification: Table exists');

            // Check columns
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user_preferences'
                ORDER BY ordinal_position;
            `);

            console.log('📋 Columns:');
            columns.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type}`);
            });
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
    } finally {
        await pool.end();
    }
}

runMigration();

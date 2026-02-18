const { Pool } = require('pg');
require('dotenv').config();

// Use production database URL
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runProductionMigration() {
    try {
        console.log('🔄 Running user_preferences migration on PRODUCTION...');
        console.log('📍 Database:', DATABASE_URL?.substring(0, 40) + '...');
        console.log('');

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
        console.log('📊 Table "user_preferences" created on PRODUCTION');

        // Verify
        const verify = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'user_preferences';
        `);

        if (verify.rows.length > 0) {
            console.log('✅ Verification: Table exists in production');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
    } finally {
        await pool.end();
    }
}

runProductionMigration();

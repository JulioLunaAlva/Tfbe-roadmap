
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../client/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkOnePagers() {
    try {
        // 1. Check if table exists
        const tableRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'one_pagers'
      );
    `);
        console.log('Table one_pagers exists:', tableRes.rows[0].exists);

        if (!tableRes.rows[0].exists) {
            // Create table if it doesn't exist (using the content of the migration file content, simplified)
            console.log('Creating table...');
            await pool.query(`
            CREATE TABLE IF NOT EXISTS one_pagers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Using gen_random_uuid() as standard
            initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
            year INTEGER NOT NULL,
            week_number INTEGER NOT NULL,
            main_progress TEXT,
            next_steps TEXT,
            stoppers_risks TEXT,
            created_by UUID REFERENCES users(id),
            updated_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(initiative_id, year, week_number)
            );
        `);
            console.log('Table created.');
        } else {
            // Check columns to be sure
            const columnsRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'one_pagers';
        `);
            console.log('Columns:', columnsRes.rows.map(r => r.column_name));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkOnePagers();

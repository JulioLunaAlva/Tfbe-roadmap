
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env
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

async function testUpsert() {
    console.log('--- Testing OnePager UPSERT Logic ---');
    try {
        // 1. Get a valid Initiative
        const initRes = await pool.query('SELECT id, name FROM initiatives LIMIT 1');
        if (initRes.rows.length === 0) {
            console.log('No initiatives found.');
            return;
        }
        const initiativeId = initRes.rows[0].id;
        console.log(`Using Initiative: ${initiativeId} (${initRes.rows[0].name})`);

        const year = 2026;
        const week = 42; // Answer to life, the universe, and everything

        // 2. Clean up
        await pool.query('DELETE FROM one_pagers WHERE initiative_id = $1 AND year = $2 AND week_number = $3', [initiativeId, year, week]);

        // 3. First Insert
        console.log('Attempting First Insert...');
        const res1 = await pool.query(
            `INSERT INTO one_pagers (
                initiative_id, year, week_number, 
                main_progress, next_steps, stoppers_risks
            ) 
            VALUES ($1, $2, $3, 'Initial Progress', 'Initial Next Steps', 'Initial Risks')
            RETURNING *`,
            [initiativeId, year, week]
        );
        console.log('Insert 1 Success:', res1.rows[0].id);

        // 4. Upsert (Update existing)
        console.log('Attempting Upsert (Update)...');
        const res2 = await pool.query(
            `INSERT INTO one_pagers (
                initiative_id, year, week_number, 
                main_progress, next_steps, stoppers_risks,
                updated_at
            ) 
            VALUES ($1, $2, $3, 'UPDATED Progress', 'UPDATED Next Steps', 'UPDATED Risks', NOW())
            ON CONFLICT (initiative_id, year, week_number) 
            DO UPDATE SET
                main_progress = EXCLUDED.main_progress,
                next_steps = EXCLUDED.next_steps,
                stoppers_risks = EXCLUDED.stoppers_risks,
                updated_at = NOW()
            RETURNING *`,
            [initiativeId, year, week]
        );

        console.log('Upsert Success:', res2.rows[0].id);
        console.log('Updated Progress:', res2.rows[0].main_progress);

        if (res2.rows[0].main_progress === 'UPDATED Progress') {
            console.log('VERIFICATION PASSED: Upsert incorrectly updated the record.');
        } else {
            console.error('VERIFICATION FAILED: Record was not updated correctly.');
        }

    } catch (err) {
        console.error('UPSERT TEST FAILED:', err);
    } finally {
        await pool.end();
    }
}

testUpsert();

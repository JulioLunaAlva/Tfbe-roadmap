
const fetch = require('node-fetch');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// We need a valid token. Since we can't easily login, let's try to bypass auth or assume we have a way. 
// Actually, for a quick test, we might struggle with auth middleware.
// Let's first try to just talk to the DB directly to see if we CAN insert. 
// If DB insert works, the issue is likely in the API layer (Auth or logic).

if (!process.env.DATABASE_URL) {
    const clientEnvPath = path.resolve(__dirname, '../../client/.env');
    dotenv.config({ path: clientEnvPath });
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function testDirectDBInsert() {
    console.log('--- Testing Direct DB Insert ---');
    try {
        // Get a valid initiative ID first
        const initRes = await pool.query('SELECT id FROM initiatives LIMIT 1');
        if (initRes.rows.length === 0) {
            console.log('No initiatives found to test with.');
            return;
        }
        const initiativeId = initRes.rows[0].id;
        const year = 2026;
        const week = 40; // Test week

        console.log(`Testing with Initiative: ${initiativeId}`);

        // Clean up previous test
        await pool.query('DELETE FROM one_pagers WHERE initiative_id = $1 AND year = $2 AND week_number = $3', [initiativeId, year, week]);

        // Attempt Insert
        await pool.query(
            `INSERT INTO one_pagers (
                initiative_id, year, week_number, 
                main_progress, next_steps, stoppers_risks
            ) 
            VALUES ($1, $2, $3, 'Test Progress', 'Test Next Steps', 'Test Risks')`,
            [initiativeId, year, week]
        );
        console.log('Direct DB Insert Success!');

    } catch (err) {
        console.error('Direct DB Insert FAILED:', err);
    } finally {
        await pool.end();
    }
}

testDirectDBInsert();

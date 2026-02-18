const { Pool } = require('pg');
require('dotenv').config();

// Use production database URL
const DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log('🔍 Inspecting specific initiative on PRODUCTION...');

        // Find 'Tracking concentrado'
        const initRes = await pool.query("SELECT * FROM initiatives WHERE name = 'Tracking concentrado'");
        const initiative = initRes.rows[0];

        if (!initiative) {
            console.error('❌ Initiative not found');
            return;
        }

        console.log('\n=== Initiative ===');
        console.table([initiative]);

        // Get phases
        const phasesRes = await pool.query(`
            SELECT ip.*, p.name as phase_name, p.default_order
            FROM initiative_phases ip
            JOIN phases p ON ip.phase_id = p.id
            WHERE ip.initiative_id = $1
            ORDER BY p.default_order
        `, [initiative.id]);

        console.log('\n=== Phases ===');
        console.table(phasesRes.rows);

    } catch (error) {
        console.error('❌ Inspection failed:', error);
    } finally {
        await pool.end();
    }
}

inspect();

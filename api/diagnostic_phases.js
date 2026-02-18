const { Pool } = require('pg');
require('dotenv').config();

// Use production database URL
const DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function diagnose() {
    try {
        console.log('🔍 Diagnosing initiatives and phases on PRODUCTION...');

        // 1. Check total initiatives
        const total = await pool.query('SELECT COUNT(*) FROM initiatives');
        console.log(`Total initiatives: ${total.rows[0].count}`);

        // 2. Check initiatives with phase counts
        const query = `
            SELECT i.id, i.name, COUNT(ip.id) as phase_count
            FROM initiatives i
            LEFT JOIN initiative_phases ip ON i.id = ip.initiative_id
            GROUP BY i.id, i.name
            ORDER BY phase_count ASC
            LIMIT 20;
        `;

        const res = await pool.query(query);
        console.log('\ninitiatives with lowest phase counts:');
        console.table(res.rows);

        // 3. List all phases available
        const phases = await pool.query('SELECT id, name, default_order FROM phases ORDER BY default_order');
        console.log('\nAvailable Phases:');
        console.table(phases.rows);

    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
    } finally {
        await pool.end();
    }
}

diagnose();

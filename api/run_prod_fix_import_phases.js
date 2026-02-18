const { Pool } = require('pg');
require('dotenv').config();

// Use production database URL
const DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixMissingPhases() {
    try {
        console.log('🔍 Checking for initiatives with missing phases on PRODUCTION...');
        console.log('📍 Database:', DATABASE_URL?.substring(0, 40) + '...');

        // 1. Get all phases
        const phasesRes = await pool.query('SELECT id, default_order, name FROM phases ORDER BY default_order');
        const phases = phasesRes.rows;

        if (phases.length === 0) {
            console.error('❌ No phases found in database! Setup phases first.');
            return;
        }

        console.log(`✅ Loaded ${phases.length} default phases`);

        // 2. Find initiatives that have NO phases
        const initiativesWithoutPhasesRes = await pool.query(`
            SELECT i.id, i.name 
            FROM initiatives i
            LEFT JOIN initiative_phases ip ON i.id = ip.initiative_id
            WHERE ip.id IS NULL
        `);

        const initiativesToFix = initiativesWithoutPhasesRes.rows;
        console.log(`⚠️  Found ${initiativesToFix.length} initiatives with missing phases.`);

        if (initiativesToFix.length === 0) {
            console.log('🎉 No repairs needed.');
            return;
        }

        // 3. Fix them
        console.log('🛠️  Starting repair...');
        let fixedCount = 0;

        for (const init of initiativesToFix) {
            // Insert all phases for this initiative
            for (const phase of phases) {
                await pool.query(
                    `INSERT INTO initiative_phases (initiative_id, phase_id, is_active, custom_order)
                     VALUES ($1, $2, true, $3)
                     ON CONFLICT (initiative_id, phase_id) DO NOTHING`,
                    [init.id, phase.id, phase.default_order]
                );
            }
            fixedCount++;
            if (fixedCount % 10 === 0) process.stdout.write('.');
        }

        console.log('\n\n✨ Repair complete!');
        console.log(`Total initiatives fixed: ${fixedCount}`);

    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        await pool.end();
    }
}

fixMissingPhases();

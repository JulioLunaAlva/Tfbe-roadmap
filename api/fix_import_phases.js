const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixMissingPhases() {
    try {
        console.log('🔍 Checking for initiatives with missing phases...');

        // 1. Get all phases
        const phasesRes = await pool.query('SELECT id, default_order, name FROM phases ORDER BY default_order');
        const phases = phasesRes.rows;

        if (phases.length === 0) {
            console.error('❌ No phases found in database! Setup phases first.');
            return;
        }

        console.log(`✅ Loaded ${phases.length} default phases: ${phases.map(p => p.name).join(', ')}`);

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
            // Check again inside loop just in case (though query handled it)
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
            process.stdout.write(`\r✅ Fixed ${fixedCount}/${initiativesToFix.length}: "${init.name}"`);
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

// Diagnostic script to check for duplicate phases in the database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDuplicatePhases() {
    console.log('🔍 Checking for duplicate phases...\n');

    try {
        // 1. Check if there are duplicate phase names in the phases table
        console.log('1️⃣ Checking for duplicate phase names in phases table:');
        const duplicatePhases = await pool.query(`
            SELECT name, COUNT(*) as count
            FROM phases
            GROUP BY name
            HAVING COUNT(*) > 1
        `);

        if (duplicatePhases.rows.length > 0) {
            console.log('❌ FOUND DUPLICATE PHASES:');
            console.table(duplicatePhases.rows);
        } else {
            console.log('✅ No duplicate phase names found\n');
        }

        // 2. Check all phases in the phases table
        console.log('2️⃣ All phases in the database:');
        const allPhases = await pool.query('SELECT * FROM phases ORDER BY default_order');
        console.table(allPhases.rows);

        // 3. Check for initiatives with duplicate phases
        console.log('\n3️⃣ Checking for initiatives with duplicate phase assignments:');
        const duplicateInitiativePhases = await pool.query(`
            SELECT 
                ip.initiative_id,
                i.name as initiative_name,
                p.name as phase_name,
                COUNT(*) as duplicate_count
            FROM initiative_phases ip
            JOIN phases p ON ip.phase_id = p.id
            JOIN initiatives i ON ip.initiative_id = i.id
            GROUP BY ip.initiative_id, i.name, p.name
            HAVING COUNT(*) > 1
        `);

        if (duplicateInitiativePhases.rows.length > 0) {
            console.log('❌ FOUND INITIATIVES WITH DUPLICATE PHASES:');
            console.table(duplicateInitiativePhases.rows);
        } else {
            console.log('✅ No initiatives with duplicate phases found\n');
        }

        // 4. Get a sample initiative to check its phases
        console.log('4️⃣ Sample initiative phases (most recent):');
        const sampleInitiative = await pool.query(`
            SELECT i.id, i.name
            FROM initiatives i
            ORDER BY i.created_at DESC
            LIMIT 1
        `);

        if (sampleInitiative.rows.length > 0) {
            const initId = sampleInitiative.rows[0].id;
            const initName = sampleInitiative.rows[0].name;
            console.log(`Initiative: ${initName} (${initId})\n`);

            const phases = await pool.query(`
                SELECT ip.id, p.name as phase_name, ip.custom_order, ip.is_active
                FROM initiative_phases ip
                JOIN phases p ON ip.phase_id = p.id
                WHERE ip.initiative_id = $1
                ORDER BY ip.custom_order
            `, [initId]);

            console.table(phases.rows);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkDuplicatePhases();

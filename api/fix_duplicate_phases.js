// Script to fix duplicate phases in the database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixDuplicatePhases() {
    console.log('🔧 Starting duplicate phases cleanup...\n');

    try {
        await pool.query('BEGIN');

        // Step 1: Delete duplicate initiative_phases
        console.log('1️⃣ Deleting duplicate initiative_phases...');
        const deleteInitPhases = await pool.query(`
            DELETE FROM initiative_phases
            WHERE id IN (
                SELECT ip.id
                FROM initiative_phases ip
                JOIN phases p ON ip.phase_id = p.id
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM (
                        SELECT DISTINCT ON (ip2.initiative_id, p2.name) ip2.id
                        FROM initiative_phases ip2
                        JOIN phases p2 ON ip2.phase_id = p2.id
                        ORDER BY ip2.initiative_id, p2.name, ip2.id
                    ) AS first_phases
                    WHERE first_phases.id = ip.id
                )
            )
        `);
        console.log(`✅ Deleted ${deleteInitPhases.rowCount} duplicate initiative_phase records\n`);

        // Step 2: Delete duplicate weekly_progress records that would cause conflicts
        console.log('2️⃣ Deleting duplicate weekly_progress records...');
        const deleteProgress = await pool.query(`
            DELETE FROM weekly_progress
            WHERE id IN (
                SELECT wp.id
                FROM weekly_progress wp
                JOIN phases p ON wp.phase_id = p.id
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM (
                        SELECT DISTINCT ON (wp2.initiative_id, p2.name, wp2.year, wp2.week_number) wp2.id
                        FROM weekly_progress wp2
                        JOIN phases p2 ON wp2.phase_id = p2.id
                        ORDER BY wp2.initiative_id, p2.name, wp2.year, wp2.week_number, wp2.id
                    ) AS first_progress
                    WHERE first_progress.id = wp.id
                )
            )
        `);
        console.log(`✅ Deleted ${deleteProgress.rowCount} duplicate weekly_progress records\n`);

        // Step 3: Update remaining weekly_progress to reference the correct phase_id
        console.log('3️⃣ Updating weekly_progress references to use non-duplicate phases...');
        const updateProgress = await pool.query(`
            UPDATE weekly_progress wp
            SET phase_id = (
                SELECT MIN(p.id)
                FROM phases p
                WHERE p.name = (
                    SELECT p2.name
                    FROM phases p2
                    WHERE p2.id = wp.phase_id
                )
            )
            WHERE wp.phase_id IN (
                SELECT id
                FROM phases
                WHERE id NOT IN (
                    SELECT MIN(id)
                    FROM phases
                    GROUP BY name
                )
            )
        `);
        console.log(`✅ Updated ${updateProgress.rowCount} weekly_progress records\n`);

        // Step 4: Update initiative_phases to reference the correct phase_id
        console.log('4️⃣ Updating initiative_phases references to use non-duplicate phases...');
        const updateInitPhases = await pool.query(`
            UPDATE initiative_phases ip
            SET phase_id = (
                SELECT MIN(p.id)
                FROM phases p
                WHERE p.name = (
                    SELECT p2.name
                    FROM phases p2
                    WHERE p2.id = ip.phase_id
                )
            )
            WHERE ip.phase_id IN (
                SELECT id
                FROM phases
                WHERE id NOT IN (
                    SELECT MIN(id)
                    FROM phases
                    GROUP BY name
                )
            )
        `);
        console.log(`✅ Updated ${updateInitPhases.rowCount} initiative_phases records\n`);

        // Step 5: Delete duplicate phases from phases table
        console.log('5️⃣ Deleting duplicate phases from phases table...');
        const deletePhases = await pool.query(`
            DELETE FROM phases
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM phases
                GROUP BY name
            )
        `);
        console.log(`✅ Deleted ${deletePhases.rowCount} duplicate phase records\n`);

        // Step 6: Add unique constraint
        console.log('6️⃣ Adding unique constraint to phases table...');
        try {
            await pool.query('ALTER TABLE phases ADD CONSTRAINT phases_name_unique UNIQUE (name)');
            console.log('✅ Unique constraint added successfully\n');
        } catch (err) {
            if (err.code === '42P07') {
                console.log('ℹ️  Unique constraint already exists\n');
            } else {
                throw err;
            }
        }

        await pool.query('COMMIT');
        console.log('✅ Transaction committed successfully!\n');

        // Verify the fix
        console.log('7️⃣ Verifying cleanup:');
        const phases = await pool.query('SELECT * FROM phases ORDER BY default_order');
        console.log('Phases after cleanup:');
        console.table(phases.rows);

        const duplicates = await pool.query(`
            SELECT name, COUNT(*) as count
            FROM phases
            GROUP BY name
            HAVING COUNT(*) > 1
        `);

        if (duplicates.rows.length > 0) {
            console.log('❌ Still have duplicates:');
            console.table(duplicates.rows);
        } else {
            console.log('\n✅ No more duplicate phases!\n');
        }

        // Check a sample initiative
        console.log('8️⃣ Checking sample initiative phases:');
        const sampleInit = await pool.query(`
            SELECT i.id, i.name
            FROM initiatives i
            ORDER BY i.created_at DESC
            LIMIT 1
        `);

        if (sampleInit.rows.length > 0) {
            const initId = sampleInit.rows[0].id;
            const initName = sampleInit.rows[0].name;
            console.log(`Initiative: ${initName}\n`);

            const initPhases = await pool.query(`
                SELECT p.name as phase_name, ip.custom_order
                FROM initiative_phases ip
                JOIN phases p ON ip.phase_id = p.id
                WHERE ip.initiative_id = $1
                ORDER BY ip.custom_order
            `, [initId]);

            console.table(initPhases.rows);
            console.log(`Total phases: ${initPhases.rows.length} (should be 6)\n`);
        }

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error during cleanup:', error);
        console.log('Transaction rolled back');
    } finally {
        await pool.end();
    }
}

fixDuplicatePhases();

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function repair() {
    console.log('Starting DB Repair...');
    try {
        // 1. Check Phases
        const phasesCheck = await pool.query('SELECT count(*) FROM phases');
        if (parseInt(phasesCheck.rows[0].count) === 0) {
            console.log('Phases table empty. Seeding...');
            // Insert default phases
            const phases = [
                { name: 'Entendimiento', order: 1 },
                { name: 'Requerimientos', order: 2 },
                { name: 'Desarrollo', order: 3 },
                { name: 'Pruebas', order: 4 },
                { name: 'Ajustes', order: 5 },
                { name: 'Implementación', order: 6 }
            ];
            for (const p of phases) {
                await pool.query('INSERT INTO phases (name, default_order) VALUES ($1, $2)', [p.name, p.order]);
            }
            console.log('Phases seeded.');
        }

        // 2. Fix Initiatives with NO phases
        const initRes = await pool.query(`
        SELECT i.id, i.name 
        FROM initiatives i 
        LEFT JOIN initiative_phases ip ON i.id = ip.initiative_id 
        WHERE ip.id IS NULL
    `);

        if (initRes.rows.length > 0) {
            console.log(`Found ${initRes.rows.length} initiatives without phases. Fixing...`);
            const phases = await pool.query('SELECT id, default_order FROM phases');

            for (const init of initRes.rows) {
                console.log(`Fixing initiative: ${init.name}`);
                for (const p of phases.rows) {
                    await pool.query(
                        'INSERT INTO initiative_phases (initiative_id, phase_id, custom_order, is_active) VALUES ($1, $2, $3, true)',
                        [init.id, p.id, p.default_order]
                    );
                }
            }
        } else {
            console.log('All initiatives have phases.');
        }

        // 3. Clean up orphans (Optional / Safe-guard)
        // Delete progress for non-existent initiatives (if any)
        await pool.query('DELETE FROM weekly_progress WHERE initiative_id NOT IN (SELECT id FROM initiatives)');

        console.log('Repair completed successfully.');
    } catch (err) {
        console.error('Repair failed:', err);
    } finally {
        pool.end();
    }
}

repair();

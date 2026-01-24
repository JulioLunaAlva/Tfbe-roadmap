import { query } from '../src/db';
require('dotenv').config();

async function checkV3() {
    console.log('Checking V3 Migration...');
    try {
        // Check if initiative_milestones table exists
        const res = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'initiative_milestones';
        `);

        if (res.rows.length > 0) {
            console.log('✅ Table "initiative_milestones" exists.');
            // Check columns
            const cols = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'initiative_milestones';
            `);
            console.log('Columns:', cols.rows.map(r => `${r.column_name} (${r.data_type})`));
        } else {
            console.error('❌ Table "initiative_milestones" DOES NOT exist.');
        }

    } catch (err) {
        console.error('Check failed:', err);
    }
}

checkV3();

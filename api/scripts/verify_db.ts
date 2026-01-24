import { query } from '../src/db';
require('dotenv').config();

async function verify() {
    console.log('Verifying Database Schema...');
    try {
        // Check initiative_phases columns
        const res = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'initiative_phases' AND column_name = 'progress';
        `);
        if (res.rows.length > 0) {
            console.log('✅ Column "progress" exists in initiative_phases.');
        } else {
            console.error('❌ Column "progress" MISSING in initiative_phases.');
        }

        // Check recent initiatives tech
        const resTech = await query('SELECT count(*) FROM initiative_technologies');
        console.log(`✅ Initiative Technologies count: ${resTech.rows[0].count}`);

    } catch (err) {
        console.error('Verification failed:', err);
    }
}

verify();

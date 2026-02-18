const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        console.log('🔍 Checking Schema...');

        // 1. Phases table structure & constraints
        console.log('\n=== Phases Table Structure ===');
        const phasesRes = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'phases'
            ORDER BY ordinal_position;
        `);
        console.table(phasesRes.rows);

        console.log('\n=== Phases Table Constraints ===');
        const constraintsRes = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'phases'::regclass;
        `);
        console.table(constraintsRes.rows);

        // 2. Phases content
        console.log('\n=== Existing Phases ===');
        const phasesContent = await pool.query('SELECT * FROM phases ORDER BY default_order');
        console.table(phasesContent.rows);

        // 3. Initiatives table structure (checking for existing type col)
        console.log('\n=== Initiatives Table Structure ===');
        const initRes = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'initiatives' AND column_name = 'methodology_type';
        `);
        if (initRes.rows.length > 0) {
            console.log('✅ methodology_type column exists');
        } else {
            console.log('❌ methodology_type column DOES NOT exist');
        }

    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        await pool.end();
    }
}

checkSchema();

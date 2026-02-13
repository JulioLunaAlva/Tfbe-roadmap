const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function testValueColumn() {
    try {
        console.log('🔍 Testing value column...\n');

        // Test 1: Check if column exists
        console.log('Test 1: Checking if value column exists...');
        const columnCheck = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'initiatives' AND column_name = 'value';
        `);
        console.log('✅ Column info:', columnCheck.rows[0]);
        console.log('');

        // Test 2: Try to insert a test record with value
        console.log('Test 2: Inserting test initiative with value...');
        const testInsert = await pool.query(`
            INSERT INTO initiatives (name, area, champion, transformation_lead, complexity, is_top_priority, year, notes, status, start_date, end_date, progress, value)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, name, value;
        `, ['TEST Initiative', 'TEST Area', 'TEST Champion', 'TEST Lead', 'Media', false, 2026, 'TEST Notes', 'En espera', null, null, 0, 'Estrategico Alto Valor']);

        console.log('✅ Inserted record:', testInsert.rows[0]);
        console.log('');

        // Test 3: Query the record back
        console.log('Test 3: Querying the test record...');
        const testQuery = await pool.query(`
            SELECT id, name, value FROM initiatives WHERE name = 'TEST Initiative';
        `);
        console.log('✅ Queried record:', testQuery.rows[0]);
        console.log('');

        // Test 4: Clean up
        console.log('Test 4: Cleaning up test record...');
        await pool.query(`DELETE FROM initiatives WHERE name = 'TEST Initiative';`);
        console.log('✅ Test record deleted');
        console.log('');

        console.log('🎉 All tests passed! The value column is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', error.message);
    } finally {
        await pool.end();
    }
}

testValueColumn();

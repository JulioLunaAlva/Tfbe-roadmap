const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgres://neondb_owner:npg_nr8WKFpfiN6V@ep-hidden-haze-ah87ky47-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // Update 5 initiatives to be created in April 2026
        const query = `
      UPDATE initiatives 
      SET created_at = '2026-04-15' 
      WHERE id IN (
        SELECT id FROM initiatives ORDER BY id LIMIT 5
      )
      RETURNING id, name, created_at;
    `;

        const res = await pool.query(query);
        console.log('Updated initiatives:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await pool.end();
    }
}

run();

const { Pool } = require('pg');
require('dotenv').config({ path: './api/.env' });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT id, name, status, end_date, year 
            FROM initiatives 
            WHERE status = 'Entregado'
            ORDER BY end_date DESC
        `);
        
        console.log('--- Iniciativas con estado "Entregado" ---');
        console.table(res.rows);
        
        const resAll = await pool.query(`
            SELECT status, count(*) 
            FROM initiatives 
            GROUP BY status
        `);
        console.log('\n--- Conteo por Estatus ---');
        console.table(resAll.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();

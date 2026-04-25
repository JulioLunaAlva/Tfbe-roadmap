const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function find() {
    try {
        const res = await pool.query("SELECT name, status, end_date FROM initiatives WHERE status = 'Entregado'");
        console.log('--- Iniciativas Entregadas ---');
        res.rows.forEach(r => {
            console.log(`[${r.end_date ? 'OK' : 'MISSING DATE'}] ${r.name} - Fecha: ${r.end_date}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

find();

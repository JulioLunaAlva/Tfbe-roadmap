const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        await client.connect();
        
        console.log('--- Iniciativas con estatus "Entregado" ---');
        const res = await client.query(`
            SELECT id, name, status, end_date, year 
            FROM initiatives 
            WHERE status = 'Entregado'
            ORDER BY end_date DESC
        `);
        
        console.log(`Total "Entregado": ${res.rows.length}`);
        res.rows.forEach((r, i) => {
            console.log(`${i+1}. ${r.name} | Status: ${r.status} | EndDate: ${r.end_date} | Year: ${r.year}`);
        });

        const currentYear = new Date().getFullYear();
        console.log(`\nAño actual (Node): ${currentYear}`);
        
        const validForTrends = res.rows.filter(r => {
            if (!r.end_date) return false;
            const d = new Date(r.end_date);
            return d.getFullYear() === currentYear;
        });

        console.log(`\nIniciativas que pasarían el filtro de DashboardTrends (Año ${currentYear}): ${validForTrends.length}`);
        
        if (validForTrends.length < res.rows.length) {
            console.log('\n--- Iniciativas EXCLUIDAS del widget ---');
            res.rows.forEach(r => {
                if (!validForTrends.find(v => v.id === r.id)) {
                    console.log(`EXCLUIDA: ${r.name} (Motivo: ${!r.end_date ? 'Sin Fecha' : 'Año ' + new Date(r.end_date).getFullYear()})`);
                }
            });
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

check();

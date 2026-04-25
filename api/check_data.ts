import { query } from './src/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        console.log('--- Buscando iniciativas con estatus "Entregado" ---');
        const res = await query(`
            SELECT id, name, status, end_date, year, created_at
            FROM initiatives 
            WHERE status = 'Entregado'
            ORDER BY end_date DESC
        `);
        
        console.log(`Encontradas ${res.rows.length} iniciativas:`);
        res.rows.forEach((row, idx) => {
            console.log(`${idx + 1}. [ID: ${row.id}] ${row.name}`);
            console.log(`   Estatus: ${row.status}, Fecha Fin: ${row.end_date}, Año: ${row.year}`);
        });

        const currentYear = new Date().getFullYear();
        console.log(`\nAño actual detectado en Node: ${currentYear}`);
        
        const countInCurrentYear = res.rows.filter(row => {
            if (!row.end_date) return false;
            const endDate = new Date(row.end_date);
            return endDate.getFullYear() === currentYear;
        }).length;
        
        console.log(`Iniciativas en el año actual (${currentYear}): ${countInCurrentYear}`);

    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        process.exit();
    }
}

check();

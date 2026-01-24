import { query } from '../src/db';
require('dotenv').config();

async function run() {
    try {
        const res = await query('SELECT * FROM phases ORDER BY id');
        console.log('Phases:', res.rows);

        const resInit = await query('SELECT * FROM initiative_phases LIMIT 5');
        console.log('Initiative Phases Sample:', resInit.rows);
    } catch (e) {
        console.error(e);
    }
}
run();

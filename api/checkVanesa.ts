import { pool } from './src/db';

async function checkUser() {
    try {
        const res = await pool.query("SELECT email, role, allowed_pages FROM users WHERE email ILIKE '%vanesa%'");
        console.log("Vanesa:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
checkUser();

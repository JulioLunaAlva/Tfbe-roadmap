const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgres://neondb_owner:npg_nr8WKFpfiN6V@ep-hidden-haze-ah87ky47-pooler.c-3.us-east-1.aws.neon.tech/neondb',
    ssl: { rejectUnauthorized: false }
});

async function resetCesar() {
    try {
        // Check who cesar is
        const check = await pool.query("SELECT id, email, role FROM users WHERE email ILIKE '%cesar%'");
        console.log('Usuarios encontrados:', JSON.stringify(check.rows, null, 2));

        if (check.rows.length === 0) {
            console.log('No se encontro usuario cesar');
            return;
        }

        const newPassword = 'Cesar2026';
        const hash = await bcrypt.hash(newPassword, 10);

        const result = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE email ILIKE '%cesar%' RETURNING email, role",
            [hash]
        );

        console.log('Contrasena actualizada para:', JSON.stringify(result.rows));
        console.log('Nueva contrasena:', newPassword);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

resetCesar();

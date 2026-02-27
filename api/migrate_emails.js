const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://neondb_owner:npg_nr8WKFpfiN6V@ep-hidden-haze-ah87ky47-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        // Fetch all users
        const res = await pool.query("SELECT id, email FROM users WHERE email LIKE '%@tfbe.com'");
        console.log(`Found ${res.rows.length} users to migrate.`);

        for (const user of res.rows) {
            const newUsername = user.email.split('@')[0];
            console.log(`Migrating ${user.email} -> ${newUsername}`);

            try {
                await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newUsername, user.id]);
            } catch (e) {
                console.error(`Failed to update ${user.email}:`, e.message);
            }
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

migrate();

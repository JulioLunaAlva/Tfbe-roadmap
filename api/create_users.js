const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgres://neondb_owner:npg_nr8WKFpfiN6V@ep-hidden-haze-ah87ky47-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const usersToCreate = [
    { name: 'Silvia', role: 'admin' },
    { name: 'Myriam', role: 'admin' },
    { name: 'Christian', role: 'admin' },
    { name: 'Federico', role: 'viewer' },
    { name: 'Beatriz', role: 'viewer' },
    { name: 'Aldo', role: 'viewer' },
    { name: 'Gabriela', role: 'viewer' },
    { name: 'Sergio', role: 'viewer' },
    { name: 'Yara', role: 'viewer' }
];

async function createUsers() {
    console.log('Starting user creation...');
    const credentials = [];

    try {
        for (const user of usersToCreate) {
            // Check if user exists (simplistic check by username part of email if needed, but here we just create)
            // We'll generate a consistent username usually based on name: silvia@tfbe.com or just silvia
            // User requested sharing credentials, so let's stick to name as username if typical or email.
            // Assuming email format name@tfbe.com for login uniqueness
            const email = `${user.name.toLowerCase()}@tfbe.com`;

            // Random suffix for password: transformacion + 3 random digits
            const randomSuffix = Math.floor(100 + Math.random() * 900); // 100-999
            const password = `transformacion${randomSuffix}`;

            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert or Update
            // Using ON CONFLICT logic if email is unique constraint
            const query = `
                INSERT INTO users (email, password_hash, role)
                VALUES ($1, $2, $3)
                ON CONFLICT (email) 
                DO UPDATE SET password_hash = $2, role = $3
                RETURNING id, email, role;
            `;

            await pool.query(query, [email, hashedPassword, user.role]);

            credentials.push({
                Nombre: user.name,
                Email: email,
                Password: password,
                Role: user.role
            });
            console.log(`User ${user.name} processed.`);
        }

        console.log('\n--- CREDENTIALS GENERATED ---');
        console.table(credentials);

        // Output for easy copy-paste to markdown tool
        console.log('\nJSON for Markdown:');
        console.log(JSON.stringify(credentials, null, 2));

    } catch (err) {
        console.error('Error creating users:', err);
    } finally {
        await pool.end();
    }
}

createUsers();

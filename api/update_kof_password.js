const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv/config');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function updatePassword() {
    try {
        const email = 'kof';
        const newPassword = 'kof';

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, role',
            [hashedPassword, email]
        );

        if (result.rows.length > 0) {
            console.log('✅ Password updated successfully for user:', result.rows[0]);
            console.log('   Email:', email);
            console.log('   New Password:', newPassword);
        } else {
            console.log('❌ User not found:', email);
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error updating password:', error);
        process.exit(1);
    }
}

updatePassword();

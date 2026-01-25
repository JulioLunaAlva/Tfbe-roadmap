
import dotenv from 'dotenv';
dotenv.config();
import { query } from '../src/db';
import bcrypt from 'bcryptjs';

const seedUsers = async () => {
    const password = 'BusinessExcellence2026$'; // Corrected spelling
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Precise usernames as requested
    const users = [
        { email: 'miguel', name: 'Miguel', role: 'admin' },
        { email: 'Cesar', name: 'Cesar', role: 'admin' },
        { email: 'Zaira', name: 'Zaira', role: 'admin' },
        { email: 'Vanesa', name: 'Vanesa', role: 'admin' },
        { email: 'cluna4887@gmail.com', name: 'Cesar Luna', role: 'admin' },
        { email: 'kof', name: 'Visualizador KOF', role: 'viewer' }
    ];

    console.log('Seeding users (Usernames)...');

    for (const u of users) {
        // Upsert user
        // Note: 'email' column is used for username/email identifier
        await query(
            `INSERT INTO users (email, role, password_hash) 
             VALUES ($1, $2, $3)
             ON CONFLICT (email) 
             DO UPDATE SET role = $2, password_hash = $3`,
            [u.email, u.role, hash]
        );
        console.log(`User '${u.email}' seeded.`);
    }

    console.log('Seeding complete.');
    process.exit(0);
};

seedUsers().catch(err => {
    console.error(err);
    process.exit(1);
});

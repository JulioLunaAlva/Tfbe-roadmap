
import { query } from '../src/db';

const runMigration = async () => {
    try {
        console.log('Running migration to add developer_owner column...');
        await query(`
            ALTER TABLE initiatives 
            ADD COLUMN IF NOT EXISTS developer_owner VARCHAR(255);
        `);
        console.log('Migration successful.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();

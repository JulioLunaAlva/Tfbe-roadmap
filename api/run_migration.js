const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Explicitly load .env from api/ directory
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // Fallback if running from root
    dotenv.config({ path: path.resolve(__dirname, 'api/.env') });
}


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
    try {
        const sqlPath = process.argv[2];
        if (!sqlPath) {
            console.error('Usage: node run_migration.js <path_to_sql>');
            process.exit(1);
        }
        const fullPath = path.resolve(process.cwd(), sqlPath);
        console.log(`Running migration from ${fullPath}...`);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${fullPath}`);
        }

        const sql = fs.readFileSync(fullPath, 'utf8');
        await pool.query(sql);
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

runMigration();

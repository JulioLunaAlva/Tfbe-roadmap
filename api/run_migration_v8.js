
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/tfbe_roadmap",
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon.tech") ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, 'migrations_v8.sql'), 'utf8');
        await client.query(sql);
        console.log('Migration v8 executed successfully');
    } catch (err) {
        console.error('Error executing migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();

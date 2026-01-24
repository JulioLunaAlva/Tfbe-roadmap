
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/tfbe_roadmap",
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon.tech") ? { rejectUnauthorized: false } : false
});

async function debugDB() {
    try {
        await client.connect();

        console.log("--- Checking 'initiatives' columns ---");
        const resCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'initiatives';
    `);
        resCols.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        console.log("\n--- Checking 'technologies' table content (first 5) ---");
        const resTechs = await client.query('SELECT * FROM technologies LIMIT 5');
        console.log(resTechs.rows);

        console.log("\n--- Checking 'initiative_technologies' count ---");
        const resInitTechs = await client.query('SELECT count(*) FROM initiative_technologies');
        console.log(resInitTechs.rows[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

debugDB();

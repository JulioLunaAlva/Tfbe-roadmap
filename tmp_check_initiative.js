require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkInitiative() {
  try {
    const res = await pool.query("SELECT id, name, is_top_priority, is_key_initiative, year FROM initiatives WHERE name ILIKE '%RAMSA%'");
    console.log('Results for RAMSA:');
    console.log(JSON.stringify(res.rows, null, 2));
    
    const allPriority = await pool.query("SELECT name FROM initiatives WHERE is_top_priority = true AND year = 2026");
    console.log('All Priority Initiatives for 2026:');
    console.log(JSON.stringify(allPriority.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkInitiative();


const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/tfbe_roadmap",
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon.tech") ? { rejectUnauthorized: false } : false
});

async function testLogic() {
    try {
        await client.connect();
        console.log('Connected to DB.');

        // Simulate POST logic
        const body = {
            name: "Logic Test " + Date.now(),
            area: "Finanzas",
            champion: "Logic Champ",
            transformation_lead: "LOGIC_TRANSF_LEAD",
            complexity: "Media",
            is_top_priority: true,
            year: 2026,
            notes: "Notes...",
            technologies: ["NodeJs", "Postgres"],
            status: "En espera",
            progress: 10
        };

        console.log('Testing INSERT logic...');
        await client.query('BEGIN');

        // 1. Insert Attributes
        const resInit = await client.query(
            `INSERT INTO initiatives (name, area, champion, transformation_lead, complexity, is_top_priority, year, notes, status, progress) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [body.name, body.area, body.champion, body.transformation_lead, body.complexity, body.is_top_priority, body.year, body.notes, body.status, body.progress]
        );
        const initiative = resInit.rows[0];
        console.log('Inserted ID:', initiative.id);
        console.log('Inserted Transformation Lead:', initiative.transformation_lead);

        // 2. Insert Technologies
        if (body.technologies) {
            for (const techName of body.technologies) {
                let tId;
                const techRes = await client.query('SELECT id FROM technologies WHERE name = $1', [techName]);
                if (techRes.rows.length > 0) {
                    tId = techRes.rows[0].id;
                } else {
                    const newTech = await client.query('INSERT INTO technologies (name) VALUES ($1) RETURNING id', [techName]);
                    tId = newTech.rows[0].id;
                }
                await client.query(
                    'INSERT INTO initiative_technologies (initiative_id, technology_id) VALUES ($1, $2)',
                    [initiative.id, tId]
                );
            }
        }

        await client.query('COMMIT');
        console.log('Transaction Committed.');

        // 3. Verify Persistence
        const ver = await client.query(`
        SELECT i.*, 
        (SELECT json_agg(t.name) FROM initiative_technologies it JOIN technologies t ON it.technology_id = t.id WHERE it.initiative_id = i.id) as technologies
        FROM initiatives i WHERE id = $1
    `, [initiative.id]);

        const found = ver.rows[0];
        console.log('--- Verification ---');
        console.log('Transformation Lead:', found.transformation_lead);
        console.log('Technologies:', found.technologies);

        if (found.transformation_lead === 'LOGIC_TRANSF_LEAD' && found.technologies.includes('NodeJs')) {
            console.log('SUCCESS: Logic is correct.');
        } else {
            console.log('FAILURE: Data mismatch.');
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

testLogic();


const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'secretodeaplicacionlocal';
const API_URL = 'http://localhost:5000/api/initiatives';

async function testPersistence() {
    // 1. Generate Token
    const token = jwt.sign({ id: 'test-user', role: 'editor', email: 'test@test.com' }, SECRET, { expiresIn: '1h' });
    console.log('Token generated.');

    // 2. Create Initiative
    const payload = {
        name: "Test Persistence " + Date.now(),
        area: "Finanzas",
        champion: "Test Champion",
        transformation_lead: "TEST_TRANSF_LEAD",
        complexity: "Baja",
        is_top_priority: false,
        year: 2026,
        notes: "Testing fields",
        technologies: ["TechOne", "TechTwo"],
        status: "En espera",
        start_date: null,
        end_date: null,
        progress: 0
    };

    console.log('POST Payload:', JSON.stringify(payload, null, 2));

    try {
        const resStats = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!resStats.ok) {
            const txt = await resStats.text();
            console.error('POST Failed:', resStats.status, txt);
            return;
        }

        const created = await resStats.json();
        console.log('Created ID:', created.id);

        // 3. Verify Response
        console.log('Response transformation_lead:', created.transformation_lead);
        // Note: Response might not include technologies in the root object depending on implementation, 
        // usually Create logic returns the INSERTED initiative row. 
        // Technologies are inserted separately. 

        // 4. Fetch to verify full object including joined technologies
        const resGet = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const list = await resGet.json();
        const found = list.find(i => i.id === created.id);

        if (found) {
            console.log('GLobal Fetch Found Item:');
            console.log('Found transformation_lead:', found.transformation_lead);
            console.log('Found technologies:', found.technologies);

            if (found.transformation_lead === 'TEST_TRANSF_LEAD' &&
                found.technologies && found.technologies.includes('TechOne')) {
                console.log('SUCCESS: Fields persist correctly via API.');
            } else {
                console.log('FAILURE: Fields missing or incorrect.');
            }
        } else {
            console.error('Item not found in list!');
        }

    } catch (err) {
        console.error('Test Error:', err);
    }
}

testPersistence();

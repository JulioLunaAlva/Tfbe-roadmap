const bcrypt = require('bcryptjs');

async function generateHashes() {
    const champion = await bcrypt.hash('champion', 10);
    const usuariokof = await bcrypt.hash('usuariokof', 10);

    console.log('\n=== SQL to add new users ===\n');
    console.log(`-- User: champion / champion`);
    console.log(`INSERT INTO users (email, role, password_hash) VALUES ('champion', 'viewer', '${champion}');\n`);

    console.log(`-- User: usuariokof / usuariokof`);
    console.log(`INSERT INTO users (email, role, password_hash) VALUES ('usuariokof', 'viewer', '${usuariokof}');\n`);
}

generateHashes();

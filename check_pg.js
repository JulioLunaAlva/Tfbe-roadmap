try {
    const pg = require('pg');
    console.log('✅ pg module found');
    require('dotenv').config();
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined');
} catch (e) {
    console.error('❌ Error:', e.message);
}

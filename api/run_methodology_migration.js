const { Pool } = require('pg');
require('dotenv').config();

// Use production database URL
const DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('🚀 Running Methodology Migration on PRODUCTION...');
        console.log('📍 Database:', DATABASE_URL?.substring(0, 40) + '...');

        await pool.query('BEGIN');

        // 1. Add columns and modify constraints
        console.log('1️⃣ Adding columns and modifying constraints...');
        await pool.query("ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS methodology_type VARCHAR(50) DEFAULT 'Hibrida'");
        await pool.query("ALTER TABLE phases ADD COLUMN IF NOT EXISTS methodology VARCHAR(50) DEFAULT 'Hibrida'");

        // Update existing phases
        await pool.query("UPDATE phases SET methodology = 'Hibrida' WHERE methodology IS NULL OR methodology = ''");

        // Drop old unique constraint on name if it exists
        try {
            await pool.query("ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_name_unique");
        } catch (e) {
            console.log('   Note: phases_name_unique might not exist or already dropped');
        }

        // Add new composite unique constraint
        try {
            await pool.query("ALTER TABLE phases ADD CONSTRAINT phases_name_methodology_unique UNIQUE (name, methodology)");
        } catch (e) {
            console.log('   Note: phases_name_methodology_unique constraint might already exist');
        }

        // 2. Insert Analiticos Phases
        console.log('2️⃣ Inserting Analiticos phases...');
        const analiticosPhases = [
            'Conocimiento del negocio',
            'Comprensión Datos del negocio',
            'Preparación de Datos',
            'Modelación',
            'Evaluación de Modelos',
            'Implantación de la Solución',
            'Seguimiento'
        ];

        for (let i = 0; i < analiticosPhases.length; i++) {
            await pool.query(
                `INSERT INTO phases (name, default_order, methodology) 
                 SELECT $1::VARCHAR, $2, 'Analiticos'
                 WHERE NOT EXISTS (
                     SELECT 1 FROM phases WHERE name = $1 AND methodology = 'Analiticos'
                 )`,
                [analiticosPhases[i], i + 1]
            );
        }

        // 3. Insert Reporting Phases
        console.log('3️⃣ Inserting Reporting phases...');
        const reportingPhases = [
            'Diseño',
            'Elaboración HU',
            'Base Datos',
            'Modelación Datos',
            'Visuales',
            'Liberación',
            'Seguimiento'
        ];

        for (let i = 0; i < reportingPhases.length; i++) {
            await pool.query(
                `INSERT INTO phases (name, default_order, methodology) 
                 SELECT $1::VARCHAR, $2, 'Reporting'
                 WHERE NOT EXISTS (
                     SELECT 1 FROM phases WHERE name = $1 AND methodology = 'Reporting'
                 )`,
                [reportingPhases[i], i + 1]
            );
        }

        await pool.query('COMMIT');
        console.log('✅ Migration successful!');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();

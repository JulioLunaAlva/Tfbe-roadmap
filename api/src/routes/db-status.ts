import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// Check database status
router.get('/db-status', async (req: Request, res: Response) => {
    try {
        // Check if tables exist
        const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        const tables = tablesResult.rows.map(r => r.table_name);

        // Count records in each table
        const counts: any = {};
        for (const table of tables) {
            try {
                const countResult = await query(`SELECT COUNT(*) FROM ${table}`);
                counts[table] = parseInt(countResult.rows[0].count);
            } catch (e) {
                counts[table] = 'error';
            }
        }

        res.json({
            success: true,
            tables,
            counts,
            totalTables: tables.length
        });
    } catch (error: any) {
        res.status(500).json({
            error: 'Failed to check database status',
            message: error.message
        });
    }
});

export default router;

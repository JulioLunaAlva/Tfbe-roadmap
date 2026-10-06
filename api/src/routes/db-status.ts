import { Router, Request, Response } from 'express';
import { query } from '../db';

// Mounted in server.ts behind authenticateToken + requireRole('admin').
const router = Router();

// Quote an identifier coming from the catalog (never from user input) as defence in depth.
const quoteIdent = (name: string) => `"${String(name).replace(/"/g, '""')}"`;

// Check database status
router.get('/db-status', async (_req: Request, res: Response) => {
    try {
        const tablesResult = await query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        const tables: string[] = tablesResult.rows.map((r) => r.table_name);

        const counts: Record<string, number | string> = {};
        for (const table of tables) {
            try {
                const countResult = await query(`SELECT COUNT(*)::int AS c FROM public.${quoteIdent(table)}`);
                counts[table] = countResult.rows[0].c;
            } catch {
                counts[table] = 'error';
            }
        }

        res.json({ success: true, tables, counts, totalTables: tables.length });
    } catch (error) {
        console.error('[db-status] failed:', (error as Error).message);
        res.status(500).json({ error: 'Failed to check database status' });
    }
});

export default router;

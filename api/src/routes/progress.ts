import { Router, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware';

const router = Router();

// GET /api/progress/:initiativeId
router.get('/:initiativeId', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { initiativeId } = req.params;
    try {
        const result = await query(
            'SELECT * FROM weekly_progress WHERE initiative_id = $1 ORDER BY year, week_number',
            [initiativeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching progress' });
    }
});

// POST /api/progress - Upsert progress
router.post('/', authenticateToken, requireRole('editor'), async (req: AuthRequest, res: Response) => {
    const { initiative_id, phase_id, year, week_number, progress_value, comment } = req.body;

    // validation
    if (!initiative_id || !week_number || !year) return res.status(400).json({ error: 'Missing fields' });

    try {
        // Determine conflict target based on phase_id presence (V7 migration added partial index for null phase)
        // Standard ON CONFLICT (initiative, phase, year, week) works for non-null phases.
        // For NULL phases, we rely on the partial unique index, but UPSERT syntax in PG requires specifying the CONSTRAINT name or the index predicate.

        let queryStr = "";
        let queryParams = [];

        if (phase_id) {
            queryStr = `INSERT INTO weekly_progress (initiative_id, phase_id, year, week_number, progress_value, comment, created_by)
               VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM users WHERE email = $7))
               ON CONFLICT (initiative_id, phase_id, year, week_number)
               DO UPDATE SET progress_value = EXCLUDED.progress_value, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
               RETURNING *`;
            queryParams = [initiative_id, phase_id, year, week_number, progress_value, comment, req.user?.email];
        } else {
            // Main Row Upsert (Phase ID is NULL)
            // We use the partial index name if possible or just try insert/update. 
            // Better to use ON CONFLICT with partial index predicate since PG 15? Or rely on CONSTRAINT name if known.
            // Let's assume we can use the partial index definition in ON CONFLICT.
            // ON CONFLICT (initiative_id, year, week_number) WHERE phase_id IS NULL

            queryStr = `INSERT INTO weekly_progress (initiative_id, phase_id, year, week_number, progress_value, comment, created_by)
               VALUES ($1, NULL, $2, $3, $4, $5, (SELECT id FROM users WHERE email = $6))
               ON CONFLICT (initiative_id, year, week_number) WHERE phase_id IS NULL
               DO UPDATE SET progress_value = EXCLUDED.progress_value, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
               RETURNING *`;
            queryParams = [initiative_id, year, week_number, progress_value, comment, req.user?.email];
        }

        const result = await query(queryStr, queryParams);

        // NOTE: My generateToken logic put email/role in token. 
        // I should probably fetch the User ID in middleware or just query it here.
        // For MVP efficiency: I'll fetch user ID from email here or update middleware.
        // Let's assume for now I put ID in token or fetch it. 
        // Actually, I can sub-query in SQL? 
        // VALUES (..., (SELECT id FROM users WHERE email = $7)) 

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

export default router;

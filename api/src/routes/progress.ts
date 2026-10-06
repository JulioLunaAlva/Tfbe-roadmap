import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware';
import { checkInitiativeAccess, requireInitiativeAccess } from '../access';
import { uuid } from '../validation';
import { logActivity } from '../utils/activityLogger';

const router = Router();

const progressSchema = z.object({
    initiative_id: uuid,
    phase_id: uuid.nullish().or(z.literal('').transform(() => null)),
    year: z.coerce.number().int().min(2000).max(2100),
    week_number: z.coerce.number().int().min(1).max(53),
    progress_value: z.coerce.number().min(0).max(100),
    comment: z.string().max(5000).nullish(),
});

// GET /api/progress/:initiativeId
router.get('/:initiativeId', authenticateToken, requireInitiativeAccess('initiativeId'), async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            'SELECT * FROM weekly_progress WHERE initiative_id = $1 ORDER BY year, week_number',
            [req.params.initiativeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[progress] fetch failed:', (err as Error).message);
        res.status(500).json({ error: 'Error fetching progress' });
    }
});

// POST /api/progress - Upsert progress
router.post('/', authenticateToken, requireRole('editor'), async (req: AuthRequest, res: Response) => {
    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Missing or invalid fields' });
    const { initiative_id, phase_id, year, week_number, progress_value, comment } = parsed.data;
    const userId = req.user!.id;

    try {
        if ((await checkInitiativeAccess(req.user, initiative_id)) !== 'allowed') {
            return res.status(404).json({ error: 'Not found' });
        }

        // Conflict target depends on phase_id presence (V7 migration added a partial index for the NULL phase).
        let result;
        if (phase_id) {
            result = await query(
                `INSERT INTO weekly_progress (initiative_id, phase_id, year, week_number, progress_value, comment, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (initiative_id, phase_id, year, week_number)
                 DO UPDATE SET progress_value = EXCLUDED.progress_value, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
                 RETURNING *`,
                [initiative_id, phase_id, year, week_number, progress_value, comment ?? null, userId]
            );
        } else {
            // Main row upsert (phase_id is NULL)
            result = await query(
                `INSERT INTO weekly_progress (initiative_id, phase_id, year, week_number, progress_value, comment, created_by)
                 VALUES ($1, NULL, $2, $3, $4, $5, $6)
                 ON CONFLICT (initiative_id, year, week_number) WHERE phase_id IS NULL
                 DO UPDATE SET progress_value = EXCLUDED.progress_value, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
                 RETURNING *`,
                [initiative_id, year, week_number, progress_value, comment ?? null, userId]
            );
        }

        await logActivity(userId, 'Actualizó Avance Semanal', initiative_id, {
            entity_type: 'Iniciativa',
            week_number,
            progress_value,
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[progress] save failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

export default router;

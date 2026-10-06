import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';
import { checkChildAccess, checkInitiativeAccess, requireInitiativeAccess } from '../access';
import { requireUuidParams, uuid } from '../validation';

const router = Router();

const milestoneSchema = z.object({
    initiative_id: uuid,
    type: z.enum(['flag', 'star', 'check', 'start', 'end']),
    year: z.coerce.number().int().min(2000).max(2100),
    week_number: z.coerce.number().int().min(1).max(53),
    description: z.string().max(2000).nullish(),
});

// GET /api/milestones/:initiativeId
router.get('/:initiativeId', authenticateToken, requireInitiativeAccess('initiativeId'), async (req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT * FROM initiative_milestones WHERE initiative_id = $1 ORDER BY date, week_number',
            [req.params.initiativeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[milestones] fetch failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to fetch milestones' });
    }
});

// POST /api/milestones
router.post('/', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const parsed = milestoneSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid milestone data' });
        return;
    }
    const { initiative_id, type, year, week_number, description } = parsed.data;

    try {
        if ((await checkInitiativeAccess((req as any).user, initiative_id)) !== 'allowed') {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const result = await query(
            `INSERT INTO initiative_milestones (initiative_id, type, year, week_number, description, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [initiative_id, type, year, week_number, description ?? null, (req as any).user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[milestones] create failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to create milestone' });
    }
});

// DELETE /api/milestones/:id
router.delete('/:id', authenticateToken, requireRole('editor'), requireUuidParams('id'), async (req: Request, res: Response) => {
    try {
        if ((await checkChildAccess((req as any).user, 'milestone', req.params.id)) !== 'allowed') {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        await query('DELETE FROM initiative_milestones WHERE id = $1', [req.params.id]);
        res.json({ message: 'Milestone deleted' });
    } catch (err) {
        console.error('[milestones] delete failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to delete milestone' });
    }
});

export default router;

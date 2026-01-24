import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';

const router = Router();

// GET /api/milestones/:initiativeId
router.get('/:initiativeId', authenticateToken, async (req: Request, res: Response) => {
    const { initiativeId } = req.params;
    try {
        const result = await query(
            'SELECT * FROM initiative_milestones WHERE initiative_id = $1 ORDER BY date, week_number',
            [initiativeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch milestones' });
    }
});

// POST /api/milestones
router.post('/', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const { initiative_id, type, year, week_number, description } = req.body;

    // Type validation
    const validTypes = ['flag', 'star', 'check', 'start', 'end'];
    if (!validTypes.includes(type)) {
        res.status(400).json({ error: 'Invalid milestone type' });
        return;
    }

    try {
        const result = await query(
            `INSERT INTO initiative_milestones (initiative_id, type, year, week_number, description, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [initiative_id, type, year, week_number, description, (req as any).user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create milestone' });
    }
});

// DELETE /api/milestones/:id
router.delete('/:id', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM initiative_milestones WHERE id = $1', [id]);
        res.json({ message: 'Milestone deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete milestone' });
    }
});

export default router;

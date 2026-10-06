import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticateToken } from '../middleware';
import { checkChildAccess, checkInitiativeAccess, requireInitiativeAccess } from '../access';
import { requireUuidParams, uuid } from '../validation';

const router = Router();

const createSchema = z.object({
    initiative_id: uuid,
    content: z.string().trim().min(1).max(5000),
});

// GET /api/comments/:initiative_id - Get comments for an initiative
router.get('/:initiative_id', authenticateToken, requireInitiativeAccess('initiative_id'), async (req: Request, res: Response) => {
    try {
        const result = await query(
            `SELECT c.*, u.email as user_email
             FROM initiative_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.initiative_id = $1
             ORDER BY c.created_at DESC`,
            [req.params.initiative_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[comments] fetch failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /api/comments - Create a comment
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'initiative_id and content are required' });
    const { initiative_id, content } = parsed.data;
    const userId = (req as any).user.id;

    try {
        if ((await checkInitiativeAccess((req as any).user, initiative_id)) !== 'allowed') {
            return res.status(404).json({ error: 'Not found' });
        }
        const result = await query(
            `INSERT INTO initiative_comments (initiative_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [initiative_id, userId, content]
        );

        const comment = await query(
            `SELECT c.*, u.email as user_email
             FROM initiative_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
            [result.rows[0].id]
        );
        res.status(201).json(comment.rows[0]);
    } catch (err) {
        console.error('[comments] create failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// DELETE /api/comments/:id - Delete a comment (own comments or admin)
router.delete('/:id', authenticateToken, requireUuidParams('id'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    try {
        const existing = await query('SELECT user_id FROM initiative_comments WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });

        // Area access first (404 hides existence), then ownership
        if ((await checkChildAccess((req as any).user, 'comment', id)) !== 'allowed') {
            return res.status(404).json({ error: 'Comment not found' });
        }
        if (existing.rows[0].user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Can only delete your own comments' });
        }

        await query('DELETE FROM initiative_comments WHERE id = $1', [id]);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('[comments] delete failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// GET /api/comments/count/:initiative_id - Get comment count
router.get('/count/:initiative_id', authenticateToken, requireInitiativeAccess('initiative_id'), async (req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT COUNT(*) as count FROM initiative_comments WHERE initiative_id = $1',
            [req.params.initiative_id]
        );
        res.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error('[comments] count failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to count comments' });
    }
});

export default router;

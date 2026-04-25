import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware';

const router = Router();

// GET /api/comments/:initiative_id - Get comments for an initiative
router.get('/:initiative_id', authenticateToken, async (req: Request, res: Response) => {
    const { initiative_id } = req.params;

    try {
        const result = await query(
            `SELECT c.*, u.email as user_email
             FROM initiative_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.initiative_id = $1
             ORDER BY c.created_at DESC`,
            [initiative_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /api/comments - Create a comment
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const { initiative_id, content } = req.body;
    const userId = (req as any).user?.id;

    if (!initiative_id || !content?.trim()) {
        return res.status(400).json({ error: 'initiative_id and content are required' });
    }

    try {
        const result = await query(
            `INSERT INTO initiative_comments (initiative_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [initiative_id, userId, content.trim()]
        );

        // Fetch with user email
        const comment = await query(
            `SELECT c.*, u.email as user_email
             FROM initiative_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json(comment.rows[0]);
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// DELETE /api/comments/:id - Delete a comment (own comments or admin)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    try {
        // Check ownership or admin
        const existing = await query('SELECT user_id FROM initiative_comments WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (existing.rows[0].user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Can only delete your own comments' });
        }

        await query('DELETE FROM initiative_comments WHERE id = $1', [id]);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// GET /api/comments/count/:initiative_id - Get comment count
router.get('/count/:initiative_id', authenticateToken, async (req: Request, res: Response) => {
    const { initiative_id } = req.params;

    try {
        const result = await query(
            'SELECT COUNT(*) as count FROM initiative_comments WHERE initiative_id = $1',
            [initiative_id]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Error counting comments:', err);
        res.status(500).json({ error: 'Failed to count comments' });
    }
});

export default router;

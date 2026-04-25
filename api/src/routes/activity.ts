import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware';

const router = Router();

// GET /api/activity - Recent activity from audit_logs
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 30;

    try {
        const result = await query(
            `SELECT al.*, u.email as user_email
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             ORDER BY al.created_at DESC
             LIMIT $1`,
            [limit]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching activity:', err);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// GET /api/activity/recent-count - Count of recent activity (last 24h)
router.get('/recent-count', authenticateToken, async (_req: Request, res: Response) => {
    try {
        const result = await query(
            `SELECT COUNT(*) as count FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours'`
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Error counting activity:', err);
        res.status(500).json({ error: 'Failed to count activity' });
    }
});

export default router;

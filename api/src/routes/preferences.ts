import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware';
import { query } from '../db';

const router = Router();

// GET /api/preferences/:key - Get a specific preference for the authenticated user
router.get('/:key', authenticateToken, async (req: Request, res: Response) => {
    const { key } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const result = await query(
            'SELECT preference_value FROM user_preferences WHERE user_id = $1 AND preference_key = $2',
            [userId, key]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Preference not found' });
        }

        res.json(result.rows[0].preference_value);
    } catch (error) {
        console.error('Error fetching preference:', error);
        res.status(500).json({ error: 'Failed to fetch preference' });
    }
});

// PUT /api/preferences/:key - Save/update a preference for the authenticated user
router.put('/:key', authenticateToken, async (req: Request, res: Response) => {
    const { key } = req.params;
    const userId = (req as any).user?.id;
    const preferenceValue = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!preferenceValue || typeof preferenceValue !== 'object') {
        return res.status(400).json({ error: 'Invalid preference value' });
    }

    try {
        // Upsert: Insert or update if exists
        const result = await query(
            `INSERT INTO user_preferences (user_id, preference_key, preference_value, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, preference_key)
             DO UPDATE SET preference_value = $3, updated_at = NOW()
             RETURNING preference_value`,
            [userId, key, JSON.stringify(preferenceValue)]
        );

        res.json(result.rows[0].preference_value);
    } catch (error) {
        console.error('Error saving preference:', error);
        res.status(500).json({ error: 'Failed to save preference' });
    }
});

// DELETE /api/preferences/:key - Delete a preference for the authenticated user
router.delete('/:key', authenticateToken, async (req: Request, res: Response) => {
    const { key } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await query(
            'DELETE FROM user_preferences WHERE user_id = $1 AND preference_key = $2',
            [userId, key]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting preference:', error);
        res.status(500).json({ error: 'Failed to delete preference' });
    }
});

export default router;


import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Get One Pager Report by Initiative, Year, Week
router.get('/', async (req, res) => {
    const { initiative_id, year, week_number } = req.query;

    if (!initiative_id || !year || !week_number) {
        return res.status(400).json({ error: 'Missing required parameters: initiative_id, year, week_number' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM one_pagers 
       WHERE initiative_id = $1 AND year = $2 AND week_number = $3`,
            [initiative_id, year, week_number]
        );

        if (result.rows.length === 0) {
            return res.json(null); // No report found for this week
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching One Pager:', error);
        res.status(500).json({ error: 'Failed to fetch One Pager' });
    }
});

// Create or Update One Pager (Upsert)
router.post('/', async (req, res) => {
    const { initiative_id, year, week_number, main_progress, next_steps, stoppers_risks } = req.body;
    // @ts-ignore
    const userId = req.user?.userId;

    if (!initiative_id || !year || !week_number) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Upsert logic using ON CONFLICT since we have a unique constraint
        const result = await pool.query(
            `INSERT INTO one_pagers (
         initiative_id, year, week_number, 
         main_progress, next_steps, stoppers_risks,
         created_by, updated_by, updated_at
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, NOW())
       ON CONFLICT (initiative_id, year, week_number) 
       DO UPDATE SET
         main_progress = EXCLUDED.main_progress,
         next_steps = EXCLUDED.next_steps,
         stoppers_risks = EXCLUDED.stoppers_risks,
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()
       RETURNING *`,
            [initiative_id, year, week_number, main_progress, next_steps, stoppers_risks, userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving One Pager:', error);
        res.status(500).json({ error: 'Failed to save One Pager' });
    }
});

export default router;

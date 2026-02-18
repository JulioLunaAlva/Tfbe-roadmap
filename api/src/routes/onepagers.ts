
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Get One Pager Report by Initiative, Year, Week
router.get('/', async (req, res) => {
    const { initiative_id, year, week_number } = req.query;

    console.log(`[GET OnePager] Request for: initiative=${initiative_id}, year=${year}, week=${week_number}`);

    if (!initiative_id || !year || !week_number) {
        console.error('[GET OnePager] Missing parameters');
        return res.status(400).json({ error: 'Missing required parameters: initiative_id, year, week_number' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM one_pagers 
       WHERE initiative_id = $1 AND year = $2 AND week_number = $3`,
            [initiative_id, year, week_number]
        );

        if (result.rows.length === 0) {
            console.log('[GET OnePager] No report found');
            return res.json(null); // No report found for this week
        }

        console.log('[GET OnePager] Report found');
        res.json(result.rows[0]);
    } catch (error) {
        console.error('[GET OnePager] Error fetching One Pager:', error);
        res.status(500).json({ error: 'Failed to fetch One Pager' });
    }
});

// Create or Update One Pager (Upsert)
router.post('/', async (req, res) => {
    const { initiative_id, year, week_number, main_progress, next_steps, stoppers_risks } = req.body;
    // @ts-ignore
    const userId = req.user?.userId;

    console.log(`[POST OnePager] Saving: init=${initiative_id}, year=${year}, week=${week_number}, user=${userId}`);
    // console.log('Body:', req.body); 

    if (!initiative_id || !year || !week_number) {
        console.error('[POST OnePager] Missing parameters');
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

        console.log('[POST OnePager] Save successful:', result.rows[0].id);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('[POST OnePager] Error saving One Pager:', error);
        res.status(500).json({ error: 'Failed to save One Pager', details: String(error) });
    }
});

export default router;

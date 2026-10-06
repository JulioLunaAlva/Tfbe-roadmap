import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireRole } from '../middleware';
import { checkInitiativeAccess } from '../access';
import { uuid } from '../validation';
import { sanitizeRichText } from '../utils/sanitize';

// Mounted with authenticateToken in server.ts
const router = Router();

const getSchema = z.object({
    initiative_id: uuid,
    year: z.coerce.number().int().min(2000).max(2100),
    week_number: z.coerce.number().int().min(1).max(53),
});

const saveSchema = z.object({
    initiative_id: uuid,
    year: z.coerce.number().int().min(2000).max(2100),
    week_number: z.coerce.number().int().min(1).max(53),
    main_progress: z.string().max(50_000).optional().default(''),
    next_steps: z.string().max(50_000).optional().default(''),
    stoppers_risks: z.string().max(50_000).optional().default(''),
});

// Get One Pager Report by Initiative, Year, Week
router.get('/', async (req: any, res: Response) => {
    const parsed = getSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Missing or invalid parameters: initiative_id, year, week_number' });
    }
    const { initiative_id, year, week_number } = parsed.data;

    try {
        // BOLA: the user must have access to the initiative's business area
        if ((await checkInitiativeAccess(req.user, initiative_id)) !== 'allowed') {
            return res.status(404).json({ error: 'Not found' });
        }

        const result = await query(
            `SELECT * FROM one_pagers
              WHERE initiative_id = $1 AND year = $2 AND week_number = $3`,
            [initiative_id, year, week_number]
        );
        res.json(result.rows[0] ?? null); // No report found for this week => null
    } catch (error) {
        console.error('[GET OnePager] failed:', (error as Error).message);
        res.status(500).json({ error: 'Failed to fetch One Pager' });
    }
});

// Create or Update One Pager (Upsert) - editors and admins only
router.post('/', requireRole('editor'), async (req: any, res: Response) => {
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Missing or invalid parameters' });
    const { initiative_id, year, week_number } = parsed.data;

    try {
        if ((await checkInitiativeAccess(req.user, initiative_id)) !== 'allowed') {
            return res.status(404).json({ error: 'Not found' });
        }

        const userId: string = req.user.id;
        const result = await query(
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
            [
                initiative_id,
                year,
                week_number,
                sanitizeRichText(parsed.data.main_progress),
                sanitizeRichText(parsed.data.next_steps),
                sanitizeRichText(parsed.data.stoppers_risks),
                userId,
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('[POST OnePager] failed:', (error as Error).message);
        res.status(500).json({ error: 'Failed to save One Pager' });
    }
});

export default router;

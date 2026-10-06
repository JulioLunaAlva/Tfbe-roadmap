import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticateToken } from '../middleware';
import { checkChildAccess, checkInitiativeAccess, getAccessibleAreaIds } from '../access';
import { requireUuidParams, uuid } from '../validation';

const router = Router();

const dependencySchema = z.object({
    source_id: uuid,
    target_id: uuid,
    dependency_type: z.string().trim().max(50).nullish(),
});

// GET /api/dependencies - List dependencies visible to the user (optionally filtered by year)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const { year } = req.query;
    if (year !== undefined && !/^\d{4}$/.test(String(year))) return res.status(400).json({ error: 'Invalid year' });

    try {
        const params: any[] = [];
        const conditions: string[] = [];

        if (year) {
            params.push(Number(year));
            conditions.push(`(s.year = $${params.length} OR t.year = $${params.length})`);
        }
        const allowedAreas = await getAccessibleAreaIds((req as any).user); // null => every area
        if (allowedAreas !== null) {
            // both ends of the edge must be visible to the user
            params.push(allowedAreas);
            const p = params.length;
            conditions.push(
                `((s.business_area_id IS NULL OR s.business_area_id = ANY($${p}::uuid[])) AND (t.business_area_id IS NULL OR t.business_area_id = ANY($${p}::uuid[])))`
            );
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await query(
            `SELECT d.*,
                    s.name as source_name, s.area as source_area, s.status as source_status, s.progress as source_progress,
                    t.name as target_name, t.area as target_area, t.status as target_status, t.progress as target_progress
             FROM initiative_dependencies d
             LEFT JOIN initiatives s ON d.source_id = s.id
             LEFT JOIN initiatives t ON d.target_id = t.id
             ${where}
             ORDER BY d.created_at DESC`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[dependencies] fetch failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to fetch dependencies' });
    }
});

// POST /api/dependencies - Create a dependency
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const parsed = dependencySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'source_id and target_id are required' });
    const { source_id, target_id, dependency_type } = parsed.data;
    if (source_id === target_id) return res.status(400).json({ error: 'Cannot depend on itself' });

    try {
        const user = (req as any).user;
        const [a, b] = await Promise.all([checkInitiativeAccess(user, source_id), checkInitiativeAccess(user, target_id)]);
        if (a !== 'allowed' || b !== 'allowed') return res.status(404).json({ error: 'Not found' });

        const existing = await query(
            'SELECT id FROM initiative_dependencies WHERE source_id = $1 AND target_id = $2',
            [source_id, target_id]
        );
        if (existing.rows.length > 0) return res.status(409).json({ error: 'Dependency already exists' });

        const result = await query(
            `INSERT INTO initiative_dependencies (source_id, target_id, dependency_type)
             VALUES ($1, $2, $3) RETURNING *`,
            [source_id, target_id, dependency_type || 'blocks']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[dependencies] create failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to create dependency' });
    }
});

// DELETE /api/dependencies/:id - Delete a dependency
router.delete('/:id', authenticateToken, requireUuidParams('id'), async (req: Request, res: Response) => {
    try {
        if ((await checkChildAccess((req as any).user, 'dependency', req.params.id)) !== 'allowed') {
            return res.status(404).json({ error: 'Not found' });
        }
        await query('DELETE FROM initiative_dependencies WHERE id = $1', [req.params.id]);
        res.json({ message: 'Dependency deleted' });
    } catch (err) {
        console.error('[dependencies] delete failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to delete dependency' });
    }
});

export default router;

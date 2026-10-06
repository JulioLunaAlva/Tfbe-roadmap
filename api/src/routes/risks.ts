import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticateToken } from '../middleware';
import { areaScope, checkChildAccess, checkInitiativeAccess } from '../access';
import { isUuid, requireUuidParams, uuid } from '../validation';

const router = Router();

const riskFields = {
    title: z.string().trim().min(1).max(255),
    description: z.string().max(5000).nullish(),
    severity: z.string().trim().max(50).nullish(),
    status: z.string().trim().max(50).nullish(),
    mitigation: z.string().max(5000).nullish(),
};
const createSchema = z.object({ initiative_id: uuid, ...riskFields });
const updateSchema = z.object(riskFields);

// GET /api/risks - List risks visible to the user
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const { year, initiative_id } = req.query;
    if (initiative_id !== undefined && !isUuid(initiative_id)) return res.status(400).json({ error: 'Invalid initiative_id' });
    if (year !== undefined && !/^\d{4}$/.test(String(year))) return res.status(400).json({ error: 'Invalid year' });

    try {
        const whereConditions: string[] = [];
        const params: any[] = [];

        if (initiative_id) {
            params.push(initiative_id);
            whereConditions.push(`r.initiative_id = $${params.length}`);
        }
        if (year) {
            params.push(Number(year));
            whereConditions.push(`i.year = $${params.length}`);
        }
        const scope = await areaScope((req as any).user, 'i.business_area_id', params);
        if (scope) whereConditions.push(scope);

        const where = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const result = await query(
            `SELECT r.*, i.name as initiative_name, i.area as initiative_area,
                    u.email as created_by_email
             FROM initiative_risks r
             LEFT JOIN initiatives i ON r.initiative_id = i.id
             LEFT JOIN users u ON r.created_by = u.id
             ${where}
             ORDER BY
                CASE r.severity WHEN 'Crítico' THEN 1 WHEN 'Alto' THEN 2 WHEN 'Medio' THEN 3 ELSE 4 END,
                r.created_at DESC`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[risks] fetch failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to fetch risks' });
    }
});

// POST /api/risks - Create a risk
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'initiative_id and title are required' });
    const { initiative_id, title, description, severity, status, mitigation } = parsed.data;
    const userId = (req as any).user.id;

    try {
        if ((await checkInitiativeAccess((req as any).user, initiative_id)) !== 'allowed') {
            return res.status(404).json({ error: 'Not found' });
        }
        const result = await query(
            `INSERT INTO initiative_risks (initiative_id, title, description, severity, status, mitigation, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [initiative_id, title, description || '', severity || 'Medio', status || 'Abierto', mitigation || '', userId]
        );

        const risk = await query(
            `SELECT r.*, i.name as initiative_name, u.email as created_by_email
             FROM initiative_risks r
             LEFT JOIN initiatives i ON r.initiative_id = i.id
             LEFT JOIN users u ON r.created_by = u.id
             WHERE r.id = $1`,
            [result.rows[0].id]
        );
        res.status(201).json(risk.rows[0]);
    } catch (err) {
        console.error('[risks] create failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to create risk' });
    }
});

// PUT /api/risks/:id - Update a risk
router.put('/:id', authenticateToken, requireUuidParams('id'), async (req: Request, res: Response) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid risk data' });
    const { title, description, severity, status, mitigation } = parsed.data;

    try {
        if ((await checkChildAccess((req as any).user, 'risk', req.params.id)) !== 'allowed') {
            return res.status(404).json({ error: 'Risk not found' });
        }
        const result = await query(
            `UPDATE initiative_risks SET title = $1, description = $2, severity = $3, status = $4, mitigation = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [title, description || '', severity, status, mitigation || '', req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Risk not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[risks] update failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to update risk' });
    }
});

// DELETE /api/risks/:id - Delete a risk
router.delete('/:id', authenticateToken, requireUuidParams('id'), async (req: Request, res: Response) => {
    try {
        if ((await checkChildAccess((req as any).user, 'risk', req.params.id)) !== 'allowed') {
            return res.status(404).json({ error: 'Risk not found' });
        }
        await query('DELETE FROM initiative_risks WHERE id = $1', [req.params.id]);
        res.json({ message: 'Risk deleted' });
    } catch (err) {
        console.error('[risks] delete failed:', (err as Error).message);
        res.status(500).json({ error: 'Failed to delete risk' });
    }
});

export default router;

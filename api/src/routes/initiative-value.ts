import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';
import { logActivity } from '../utils/activityLogger';
import { sanitizeRichText } from '../utils/sanitize';
import { checkInitiativeAccess, getAccessibleAreaIds } from '../access';
import { isUuid, uuid } from '../validation';

const router = Router();

const upsertSchema = z.object({
    initiative_id: uuid,
    business_value: z.string().max(50_000).optional().default(''),
    operational_efficiency: z.string().max(50_000).optional().default(''),
    fte_detail: z.string().max(50_000).optional().default(''),
    qualitative_benefit: z.string().max(50_000).optional().default(''),
    users_reached_detail: z.string().max(50_000).optional().default(''),
    estimated_savings_detail: z.string().max(50_000).optional().default(''),
});

// GET /api/initiative-value/summary — Returns pillar completion count per initiative
router.get('/summary', authenticateToken, async (req: any, res) => {
    try {
        const allowedAreas = await getAccessibleAreaIds(req.user);
        const params: any[] = [];
        let whereClause = '';

        if (allowedAreas !== null) {
            params.push(allowedAreas);
            whereClause = `WHERE (i.business_area_id IS NULL OR i.business_area_id = ANY($1::uuid[]))`;
        }

        const result = await query(
            `SELECT
                iv.initiative_id,
                (
                    CASE WHEN iv.business_value IS NOT NULL AND iv.business_value != '' AND iv.business_value != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN iv.operational_efficiency IS NOT NULL AND iv.operational_efficiency != '' AND iv.operational_efficiency != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN iv.fte_detail IS NOT NULL AND iv.fte_detail != '' AND iv.fte_detail != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN iv.qualitative_benefit IS NOT NULL AND iv.qualitative_benefit != '' AND iv.qualitative_benefit != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN iv.users_reached_detail IS NOT NULL AND iv.users_reached_detail != '' AND iv.users_reached_detail != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN iv.estimated_savings_detail IS NOT NULL AND iv.estimated_savings_detail != '' AND iv.estimated_savings_detail != '<p></p>' THEN 1 ELSE 0 END
                ) AS filled_pillars
            FROM initiative_value iv
            JOIN initiatives i ON iv.initiative_id = i.id
            ${whereClause}`,
            params
        );

        // Return as a map { initiative_id: filledCount }
        const summary: Record<string, number> = {};
        for (const row of result.rows) {
            summary[row.initiative_id] = Number(row.filled_pillars);
        }
        res.json(summary);
    } catch (error) {
        console.error('[GET initiative-value/summary] Error:', (error as Error).message);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// GET /api/initiative-value/all — Returns all initiative values for consolidated dashboard (scoped by user's area)
router.get('/all', authenticateToken, async (req: any, res) => {
    try {
        const allowedAreas = await getAccessibleAreaIds(req.user);
        const params: any[] = [];
        let whereClause = '';

        if (allowedAreas !== null) {
            params.push(allowedAreas);
            whereClause = `WHERE (i.business_area_id IS NULL OR i.business_area_id = ANY($1::uuid[]))`;
        }

        const result = await query(
            `SELECT iv.* 
             FROM initiative_value iv
             JOIN initiatives i ON iv.initiative_id = i.id
             ${whereClause}`,
            params
        );
        res.json(result.rows);
    } catch (error) {
        console.error('[GET initiative-value/all] Error:', (error as Error).message);
        res.status(500).json({ error: 'Failed to fetch all initiative values' });
    }
});

// GET /api/initiative-value?initiative_id=X (or all if not provided)
router.get('/', authenticateToken, async (req: any, res) => {
    const { initiative_id } = req.query;

    if (!initiative_id) {
        try {
            const allowedAreas = await getAccessibleAreaIds(req.user);
            const params: any[] = [];
            let whereClause = '';

            if (allowedAreas !== null) {
                params.push(allowedAreas);
                whereClause = `WHERE (i.business_area_id IS NULL OR i.business_area_id = ANY($1::uuid[]))`;
            }

            const result = await query(
                `SELECT iv.* 
                 FROM initiative_value iv
                 JOIN initiatives i ON iv.initiative_id = i.id
                 ${whereClause}`,
                params
            );
            return res.json(result.rows);
        } catch (error) {
            console.error('[GET initiative-value all] Error:', (error as Error).message);
            return res.status(500).json({ error: 'Failed to fetch initiative values' });
        }
    }

    if (!isUuid(initiative_id)) {
        return res.status(400).json({ error: 'Invalid initiative_id' });
    }

    try {
        if ((await checkInitiativeAccess(req.user, initiative_id)) !== 'allowed') {
            return res.status(404).json({ error: 'Not found' });
        }

        const result = await query(
            `SELECT * FROM initiative_value WHERE initiative_id = $1`,
            [initiative_id]
        );

        if (result.rows.length === 0) {
            return res.json(null);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('[GET initiative-value] Error:', (error as Error).message);
        res.status(500).json({ error: 'Failed to fetch initiative value' });
    }
});

// POST /api/initiative-value — Upsert (admin/editor only)
router.post('/', authenticateToken, requireRole('editor'), async (req: any, res) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid or missing fields in request' });
    }

    const {
        initiative_id,
        business_value,
        operational_efficiency,
        fte_detail,
        qualitative_benefit,
        users_reached_detail,
        estimated_savings_detail
    } = parsed.data;

    try {
        if ((await checkInitiativeAccess(req.user, initiative_id)) !== 'allowed') {
            return res.status(404).json({ error: 'Not found' });
        }

        const userId = req.user.id;

        const result = await query(
            `INSERT INTO initiative_value (
                initiative_id,
                business_value,
                operational_efficiency,
                fte_detail,
                qualitative_benefit,
                users_reached_detail,
                estimated_savings_detail,
                created_by, updated_by, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, NOW())
            ON CONFLICT (initiative_id)
            DO UPDATE SET
                business_value = EXCLUDED.business_value,
                operational_efficiency = EXCLUDED.operational_efficiency,
                fte_detail = EXCLUDED.fte_detail,
                qualitative_benefit = EXCLUDED.qualitative_benefit,
                users_reached_detail = EXCLUDED.users_reached_detail,
                estimated_savings_detail = EXCLUDED.estimated_savings_detail,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING *`,
            [
                initiative_id,
                sanitizeRichText(business_value),
                sanitizeRichText(operational_efficiency),
                sanitizeRichText(fte_detail),
                sanitizeRichText(qualitative_benefit),
                sanitizeRichText(users_reached_detail),
                sanitizeRichText(estimated_savings_detail),
                userId
            ]
        );

        await logActivity(userId, 'Actualizó Impacto y Valor', initiative_id, {
            entity_type: 'Iniciativa'
        });

        res.json(result.rows[0]);
    } catch (error) {
        console.error('[POST initiative-value] Error:', (error as Error).message);
        res.status(500).json({ error: 'Failed to save initiative value' });
    }
});

export default router;

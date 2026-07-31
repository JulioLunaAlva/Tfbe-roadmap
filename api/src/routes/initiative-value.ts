import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// GET /api/initiative-value/summary — Returns pillar completion count per initiative
router.get('/summary', authenticateToken, async (_req, res) => {
    try {
        const result = await query(
            `SELECT
                initiative_id,
                (
                    CASE WHEN business_value IS NOT NULL AND business_value != '' AND business_value != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN operational_efficiency IS NOT NULL AND operational_efficiency != '' AND operational_efficiency != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN fte_detail IS NOT NULL AND fte_detail != '' AND fte_detail != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN qualitative_benefit IS NOT NULL AND qualitative_benefit != '' AND qualitative_benefit != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN users_reached_detail IS NOT NULL AND users_reached_detail != '' AND users_reached_detail != '<p></p>' THEN 1 ELSE 0 END +
                    CASE WHEN estimated_savings_detail IS NOT NULL AND estimated_savings_detail != '' AND estimated_savings_detail != '<p></p>' THEN 1 ELSE 0 END
                ) AS filled_pillars
            FROM initiative_value`,
            []
        );

        // Return as a map { initiative_id: filledCount }
        const summary: Record<string, number> = {};
        for (const row of result.rows) {
            summary[row.initiative_id] = Number(row.filled_pillars);
        }
        res.json(summary);
    } catch (error) {
        console.error('[GET initiative-value/summary] Error:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// GET /api/initiative-value?initiative_id=X
router.get('/', authenticateToken, async (req, res) => {
    const { initiative_id } = req.query;

    if (!initiative_id) {
        return res.status(400).json({ error: 'Missing required parameter: initiative_id' });
    }

    try {
        const result = await query(
            `SELECT * FROM initiative_value WHERE initiative_id = $1`,
            [initiative_id]
        );

        if (result.rows.length === 0) {
            return res.json(null);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('[GET initiative-value] Error:', error);
        res.status(500).json({ error: 'Failed to fetch initiative value' });
    }
});

// POST /api/initiative-value — Upsert (admin/editor only)
router.post('/', authenticateToken, requireRole('editor'), async (req, res) => {
    const {
        initiative_id,
        business_value,
        operational_efficiency,
        fte_detail,
        qualitative_benefit,
        users_reached_detail,
        estimated_savings_detail
    } = req.body;

    const userId = (req as any).user?.userId || null;

    if (!initiative_id) {
        return res.status(400).json({ error: 'Missing required parameter: initiative_id' });
    }

    try {
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
                business_value || '',
                operational_efficiency || '',
                fte_detail || '',
                qualitative_benefit || '',
                users_reached_detail || '',
                estimated_savings_detail || '',
                userId
            ]
        );

        // Retrieve user id correctly if the middleware puts id in req.user, or fetch it based on email
        const userRes = await query('SELECT id FROM users WHERE email = $1', [(req as any).user?.email]);
        const dbUserId = userRes.rows[0]?.id || null;

        await logActivity(dbUserId, 'Actualizó Impacto y Valor', initiative_id, {
            entity_type: 'Iniciativa'
        });

        res.json(result.rows[0]);
    } catch (error) {
        console.error('[POST initiative-value] Error:', error);
        res.status(500).json({ error: 'Failed to save initiative value', details: String(error) });
    }
});

export default router;

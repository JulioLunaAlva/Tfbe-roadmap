import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';

const router = Router();

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

        res.json(result.rows[0]);
    } catch (error) {
        console.error('[POST initiative-value] Error:', error);
        res.status(500).json({ error: 'Failed to save initiative value', details: String(error) });
    }
});

export default router;

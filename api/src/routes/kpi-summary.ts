import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware';

const router = Router();

// GET /api/kpi-summary?year=XXXX&business_area_id=UUID
// Returns aggregated KPIs scoped to the active portfolio (business area).
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const { year, business_area_id } = req.query;

    try {
        const params: any[] = [];
        const conditions: string[] = [];

        if (year) {
            params.push(year);
            conditions.push(`i.year = $${params.length}`);
        }

        // ✅ FIX: Filter by business_area_id so KPIs scope to the active workspace
        if (business_area_id) {
            params.push(business_area_id);
            conditions.push(`i.business_area_id = $${params.length}`);
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // Helper to build a WHERE clause that AND-appends an extra condition
        const withExtra = (extra: string) => {
            return conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')} AND ${extra}`
                : `WHERE ${extra}`;
        };

        // Total initiatives
        const totalRes = await query(
            `SELECT COUNT(*) as total FROM initiatives i ${whereClause}`,
            params
        );

        // Delivered count
        const deliveredRes = await query(
            `SELECT COUNT(*) as delivered FROM initiatives i ${withExtra("i.status IN ('Entregado', 'Entregado con redefinición', 'Entregado con atraso')")}`,
            params
        );

        // In progress count
        const inProgressRes = await query(
            `SELECT COUNT(*) as in_progress FROM initiatives i ${withExtra("(i.status IN ('En curso', 'Avance conforme plan', 'En redefinición'))")}`,
            params
        );

        // Delayed count
        const delayedRes = await query(
            `SELECT COUNT(*) as delayed FROM initiatives i ${withExtra("(i.status IN ('Retrasado', 'Atraso', 'En riesgo'))")}`,
            params
        );

        // Average progress
        const avgRes = await query(
            `SELECT COALESCE(ROUND(AVG(i.progress)), 0) as avg_progress FROM initiatives i ${whereClause}`,
            params
        );

        // Count of initiatives with documented value
        const valueDocRes = await query(
            `SELECT COUNT(DISTINCT iv.initiative_id) as documented
             FROM initiative_value iv
             JOIN initiatives i ON i.id = iv.initiative_id
             ${whereClause}
             ${conditions.length > 0 ? 'AND' : 'WHERE'} (iv.business_value != '' OR iv.operational_efficiency != '' OR iv.fte_detail != '' OR iv.qualitative_benefit != '' OR iv.users_reached_detail != '' OR iv.estimated_savings_detail != '')`,
            params
        );

        // Unique areas count
        const areasRes = await query(
            `SELECT COUNT(DISTINCT i.area) as area_count FROM initiatives i ${whereClause}`,
            params
        );

        res.json({
            total: parseInt(totalRes.rows[0].total),
            delivered: parseInt(deliveredRes.rows[0].delivered),
            in_progress: parseInt(inProgressRes.rows[0].in_progress),
            delayed: parseInt(delayedRes.rows[0].delayed),
            avg_progress: parseInt(avgRes.rows[0].avg_progress),
            value_documented: parseInt(valueDocRes.rows[0].documented),
            areas: parseInt(areasRes.rows[0].area_count),
        });
    } catch (err) {
        console.error('Error fetching KPI summary:', err);
        res.status(500).json({ error: 'Failed to fetch KPI summary' });
    }
});

export default router;

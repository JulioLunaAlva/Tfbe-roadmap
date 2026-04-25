import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware';

const router = Router();

// GET /api/kpi-summary - Aggregated KPIs for the portfolio
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const { year } = req.query;

    try {
        let whereClause = '';
        const params: any[] = [];

        if (year) {
            whereClause = 'WHERE i.year = $1';
            params.push(year);
        }

        // Total initiatives
        const totalRes = await query(
            `SELECT COUNT(*) as total FROM initiatives i ${whereClause}`,
            params
        );

        // Delivered count
        const deliveredRes = await query(
            `SELECT COUNT(*) as delivered FROM initiatives i ${whereClause ? whereClause + " AND" : "WHERE"} i.status = 'Entregado'`,
            params
        );

        // In progress count
        const inProgressRes = await query(
            `SELECT COUNT(*) as in_progress FROM initiatives i ${whereClause ? whereClause + " AND" : "WHERE"} (i.status = 'En curso' OR i.status = 'Avance conforme plan')`,
            params
        );

        // Delayed count
        const delayedRes = await query(
            `SELECT COUNT(*) as delayed FROM initiatives i ${whereClause ? whereClause + " AND" : "WHERE"} (i.status = 'Retrasado' OR i.status = 'Atraso')`,
            params
        );

        // Average progress
        const avgRes = await query(
            `SELECT COALESCE(ROUND(AVG(i.progress)), 0) as avg_progress FROM initiatives i ${whereClause}`,
            params
        );

        // Count of initiatives with documented value (have data in initiative_value)
        const valueDocRes = await query(
            `SELECT COUNT(DISTINCT iv.initiative_id) as documented
             FROM initiative_value iv
             JOIN initiatives i ON i.id = iv.initiative_id
             ${whereClause}
             AND (iv.business_value != '' OR iv.operational_efficiency != '' OR iv.fte_detail != '' OR iv.qualitative_benefit != '' OR iv.users_reached_detail != '' OR iv.estimated_savings_detail != '')`,
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

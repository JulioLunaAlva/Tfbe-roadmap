import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware';

const router = Router();

// GET /api/risks - List all risks
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const { year, initiative_id } = req.query;

    try {
        let whereConditions: string[] = [];
        const params: any[] = [];

        if (initiative_id) {
            params.push(initiative_id);
            whereConditions.push(`r.initiative_id = $${params.length}`);
        }

        if (year) {
            params.push(year);
            whereConditions.push(`i.year = $${params.length}`);
        }

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
        console.error('Error fetching risks:', err);
        res.status(500).json({ error: 'Failed to fetch risks' });
    }
});

// POST /api/risks - Create a risk
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const { initiative_id, title, description, severity, status, mitigation } = req.body;
    const userId = (req as any).user?.id;

    if (!initiative_id || !title?.trim()) {
        return res.status(400).json({ error: 'initiative_id and title are required' });
    }

    try {
        const result = await query(
            `INSERT INTO initiative_risks (initiative_id, title, description, severity, status, mitigation, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [initiative_id, title.trim(), description || '', severity || 'Medio', status || 'Abierto', mitigation || '', userId]
        );

        // Fetch with joins
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
        console.error('Error creating risk:', err);
        res.status(500).json({ error: 'Failed to create risk' });
    }
});

// PUT /api/risks/:id - Update a risk
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, severity, status, mitigation } = req.body;

    try {
        const result = await query(
            `UPDATE initiative_risks SET title = $1, description = $2, severity = $3, status = $4, mitigation = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [title, description || '', severity, status, mitigation || '', id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Risk not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating risk:', err);
        res.status(500).json({ error: 'Failed to update risk' });
    }
});

// DELETE /api/risks/:id - Delete a risk
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await query('DELETE FROM initiative_risks WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Risk not found' });
        }
        res.json({ message: 'Risk deleted' });
    } catch (err) {
        console.error('Error deleting risk:', err);
        res.status(500).json({ error: 'Failed to delete risk' });
    }
});

export default router;

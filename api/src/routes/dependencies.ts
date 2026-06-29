import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware';

const router = Router();

// GET /api/dependencies - List all dependencies (optionally filtered by year)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const { year } = req.query;

    try {
        let sql = `
            SELECT d.*,
                   s.name as source_name, s.area as source_area, s.status as source_status, s.progress as source_progress,
                   t.name as target_name, t.area as target_area, t.status as target_status, t.progress as target_progress
            FROM initiative_dependencies d
            LEFT JOIN initiatives s ON d.source_id = s.id
            LEFT JOIN initiatives t ON d.target_id = t.id
        `;
        const params: any[] = [];
        if (year) {
            params.push(year);
            sql += ` WHERE s.year = $1 OR t.year = $1`;
        }
        sql += ` ORDER BY d.created_at DESC`;

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching dependencies:', err);
        res.status(500).json({ error: 'Failed to fetch dependencies' });
    }
});

// POST /api/dependencies - Create a dependency
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const { source_id, target_id, dependency_type } = req.body;

    if (!source_id || !target_id) {
        return res.status(400).json({ error: 'source_id and target_id are required' });
    }
    if (source_id === target_id) {
        return res.status(400).json({ error: 'Cannot depend on itself' });
    }

    try {
        // Check if already exists
        const existing = await query(
            'SELECT id FROM initiative_dependencies WHERE source_id = $1 AND target_id = $2',
            [source_id, target_id]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Dependency already exists' });
        }

        const result = await query(
            `INSERT INTO initiative_dependencies (source_id, target_id, dependency_type)
             VALUES ($1, $2, $3) RETURNING *`,
            [source_id, target_id, dependency_type || 'blocks']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating dependency:', err);
        res.status(500).json({ error: 'Failed to create dependency' });
    }
});

// DELETE /api/dependencies/:id - Delete a dependency
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM initiative_dependencies WHERE id = $1', [id]);
        res.json({ message: 'Dependency deleted' });
    } catch (err) {
        console.error('Error deleting dependency:', err);
        res.status(500).json({ error: 'Failed to delete dependency' });
    }
});

export default router;

import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// GET /api/okrs
router.get('/', authenticateToken, async (req: any, res) => {
    const { year } = req.query;
    try {
        let sql = `SELECT * FROM okrs`;
        const params: any[] = [];
        if (year) {
            sql += ` WHERE year = $1`;
            params.push(year);
        }
        sql += ` ORDER BY created_at ASC`;
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch okrs' });
    }
});

// POST /api/okrs
router.post('/', authenticateToken, requireRole('editor'), async (req: any, res) => {
    const { title, description, year } = req.body;
    if (!title || !year) return res.status(400).json({ error: 'Title and year required' });
    try {
        const result = await query(
            `INSERT INTO okrs (title, description, year) VALUES ($1, $2, $3) RETURNING *`,
            [title, description || '', year]
        );
        const okr = result.rows[0];

        const userRes = await query('SELECT id FROM users WHERE email = $1', [req.user?.email]);
        const userId = userRes.rows[0]?.id;
        
        await logActivity(userId, 'Creó OKR', okr.id, {
            entity_type: 'OKR',
            title: okr.title
        });

        res.status(201).json(okr);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create okr' });
    }
});

// PUT /api/okrs/:id
router.put('/:id', authenticateToken, requireRole('editor'), async (req: any, res) => {
    const { id } = req.params;
    const { title, description, year } = req.body;
    try {
        const result = await query(
            `UPDATE okrs SET title = $1, description = $2, year = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
            [title, description, year, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'OKR not found' });

        const userRes = await query('SELECT id FROM users WHERE email = $1', [req.user?.email]);
        const userId = userRes.rows[0]?.id;

        await logActivity(userId, 'Actualizó OKR', id, {
            entity_type: 'OKR',
            title: title
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update okr' });
    }
});

// DELETE /api/okrs/:id
router.delete('/:id', authenticateToken, requireRole('editor'), async (req: any, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM okrs WHERE id = $1', [id]);

        const userRes = await query('SELECT id FROM users WHERE email = $1', [req.user?.email]);
        const userId = userRes.rows[0]?.id;

        await logActivity(userId, 'Eliminó OKR', id, {
            entity_type: 'OKR'
        });

        res.json({ message: 'OKR deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete okr' });
    }
});

export default router;

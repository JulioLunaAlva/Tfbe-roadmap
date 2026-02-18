
import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';

const router = Router();

// GET /api/support - List all support items
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT * FROM support_items ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch support items' });
    }
});

// POST /api/support - Create new item
router.post('/', authenticateToken, requireRole('editor'), async (req, res) => {
    const { name, area, technology, champion, responsible, description, status } = req.body;

    if (!name || !area || !responsible) {
        return res.status(400).json({ error: 'Name, Area, and Responsible are required' });
    }

    try {
        const result = await query(
            `INSERT INTO support_items (name, area, technology, champion, responsible, description, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, area, technology, champion, responsible, description, status || 'Active']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create support item' });
    }
});

// PUT /api/support/:id - Update item
router.put('/:id', authenticateToken, requireRole('editor'), async (req, res) => {
    const { id } = req.params;
    const { name, area, technology, champion, responsible, description, status } = req.body;

    try {
        const result = await query(
            `UPDATE support_items 
             SET name = $1, area = $2, technology = $3, champion = $4, responsible = $5, description = $6, status = $7, updated_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [name, area, technology, champion, responsible, description, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update support item' });
    }
});

// DELETE /api/support/:id - Delete item
router.delete('/:id', authenticateToken, requireRole('editor'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query('DELETE FROM support_items WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ message: 'Item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

export default router;

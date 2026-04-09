import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware';
import { query } from '../db';

const router = Router();

// Middleware to check if user is Cesar or Admin
const requireAdmin = (req: any, res: any, next: any) => {
    const email = (req.user?.email || '').toLowerCase();
    const role = (req.user?.role || '').toLowerCase();
    
    if (email === 'cesar@kof.com' || email === 'cesar' || role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Solo Cesar o Administradores pueden gestionar layouts globales.' });
    }
};

// GET /api/dashboard/layout - Get the active global layout
router.get('/layout', authenticateToken, async (req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT * FROM dashboard_layouts WHERE is_active = true LIMIT 1'
        );
        
        if (result.rows.length === 0) {
            return res.json({ layout_data: null });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching dashboard layout:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard layout' });
    }
});

// GET /api/dashboard/layouts - List all saved layouts (Admin only)
router.get('/layouts', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT id, name, is_active, created_at FROM dashboard_layouts ORDER BY updated_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching dashboard layouts list:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard layouts' });
    }
});

// POST /api/dashboard/layouts - Save or Update a layout
router.post('/layouts', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const { name, layout_data, activate } = req.body;

    if (!name || !layout_data) {
        return res.status(400).json({ error: 'Nombre y datos del layout son requeridos' });
    }

    try {
        // If activating, deactivate others first
        if (activate) {
            await query('UPDATE dashboard_layouts SET is_active = false');
        }

        const result = await query(
            `INSERT INTO dashboard_layouts (name, layout_data, is_active, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (name)
             DO UPDATE SET layout_data = $2, is_active = $3, updated_at = NOW()
             RETURNING *`,
            [name, JSON.stringify(layout_data), activate || false]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving dashboard layout:', error);
        res.status(500).json({ error: 'Failed to save dashboard layout' });
    }
});

// POST /api/dashboard/layouts/:id/activate - Toggle activation
router.post('/layouts/:id/activate', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { active } = req.body;

    try {
        if (active) {
            await query('UPDATE dashboard_layouts SET is_active = false');
        }
        
        const result = await query(
            'UPDATE dashboard_layouts SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Layout not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error activating dashboard layout:', error);
        res.status(500).json({ error: 'Failed to activate dashboard layout' });
    }
});

// DELETE /api/dashboard/layouts/:id - Delete a layout
router.delete('/layouts/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await query('DELETE FROM dashboard_layouts WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting dashboard layout:', error);
        res.status(500).json({ error: 'Failed to delete dashboard layout' });
    }
});

export default router;

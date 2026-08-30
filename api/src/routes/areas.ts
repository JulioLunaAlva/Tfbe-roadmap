import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Middleware: only César (super_admin) can manage areas
const requireSuperAdmin = (req: any, res: any, next: any) => {
    const email = (req.user?.email || '').toLowerCase();
    if (email.includes('cesar@kof.com') || email === 'cesar' || req.user?.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Only admin can manage areas.' });
    }
};

// GET /api/areas — Returns areas accessible to the current user
// Admin/César sees ALL areas. Others see only their assigned areas.
router.get('/', async (req: any, res) => {
    try {
        const email = (req.user?.email || '').toLowerCase();
        const isSuperAdmin = email.includes('cesar@kof.com') || email === 'cesar' || req.user?.role === 'admin';

        let result;
        if (isSuperAdmin) {
            result = await pool.query(
                'SELECT * FROM business_areas WHERE is_active = TRUE ORDER BY display_order ASC, name ASC'
            );
        } else {
            result = await pool.query(
                `SELECT ba.*, uaa.can_edit
                 FROM business_areas ba
                 JOIN user_area_access uaa ON ba.id = uaa.area_id
                 JOIN users u ON uaa.user_id = u.id
                 WHERE u.email = $1 AND ba.is_active = TRUE
                 ORDER BY ba.display_order ASC, ba.name ASC`,
                [req.user.email]
            );
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching areas:', err);
        res.status(500).json({ error: 'Failed to fetch areas' });
    }
});

// GET /api/areas/all — All areas including inactive (admin only)
router.get('/all', requireSuperAdmin, async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT ba.*, 
             (SELECT COUNT(*) FROM initiatives i WHERE i.business_area_id = ba.id) as initiative_count
             FROM business_areas ba
             ORDER BY ba.display_order ASC, ba.name ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all areas:', err);
        res.status(500).json({ error: 'Failed to fetch areas' });
    }
});

// POST /api/areas — Create new area (admin only)
router.post('/', requireSuperAdmin, async (req, res) => {
    const { slug, name, description, color, icon, display_order } = req.body;

    if (!slug || !name) {
        return res.status(400).json({ error: 'slug and name are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO business_areas (slug, name, description, color, icon, display_order)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [slug, name, description || '', color || '#6366f1', icon || 'Building2', display_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'An area with this slug already exists' });
        }
        console.error('Error creating area:', err);
        res.status(500).json({ error: 'Failed to create area' });
    }
});

// PUT /api/areas/:id — Update area (admin only)
router.put('/:id', requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, color, icon, is_active, display_order } = req.body;

    try {
        const result = await pool.query(
            `UPDATE business_areas
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 color = COALESCE($3, color),
                 icon = COALESCE($4, icon),
                 is_active = COALESCE($5, is_active),
                 display_order = COALESCE($6, display_order)
             WHERE id = $7
             RETURNING *`,
            [name, description, color, icon, is_active, display_order, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Area not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating area:', err);
        res.status(500).json({ error: 'Failed to update area' });
    }
});

// GET /api/areas/:id/users — List users with access to this area (admin only)
router.get('/:id/users', requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT u.id, u.email, u.role, uaa.can_edit, uaa.id as access_id
             FROM user_area_access uaa
             JOIN users u ON uaa.user_id = u.id
             WHERE uaa.area_id = $1
             ORDER BY u.email ASC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching area users:', err);
        res.status(500).json({ error: 'Failed to fetch area users' });
    }
});

// POST /api/areas/:id/users — Grant user access to area (admin only)
router.post('/:id/users', requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { user_id, can_edit } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO user_area_access (user_id, area_id, can_edit)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, area_id) DO UPDATE SET can_edit = $3
             RETURNING *`,
            [user_id, id, can_edit || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error('Error granting area access:', err);
        res.status(500).json({ error: 'Failed to grant area access' });
    }
});

// DELETE /api/areas/:id/users/:userId — Revoke user access (admin only)
router.delete('/:id/users/:userId', requireSuperAdmin, async (req, res) => {
    const { id, userId } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM user_area_access WHERE area_id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Access record not found' });
        }

        res.json({ message: 'Access revoked' });
    } catch (err) {
        console.error('Error revoking area access:', err);
        res.status(500).json({ error: 'Failed to revoke area access' });
    }
});

export default router;

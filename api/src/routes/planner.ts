import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// GET /api/planner
// Retrieves tasks for the logged in user (owned or assigned to them) and any non-private tasks if editor/admin
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const userRes = await query('SELECT id, role FROM users WHERE email = $1', [req.user?.email]);
        const dbUser = userRes.rows[0];
        if (!dbUser) return res.status(401).json({ error: 'User not found' });

        const userId = dbUser.id;
        const role = dbUser.role;

        let sql = `
            SELECT p.*, 
                   o.email as owner_email,
                   a.email as assigned_to_email,
                   i.name as initiative_name
            FROM planner_tasks p
            LEFT JOIN users o ON p.owner_id = o.id
            LEFT JOIN users a ON p.assigned_to_id = a.id
            LEFT JOIN initiatives i ON p.initiative_id = i.id
            WHERE p.owner_id = $1 OR p.assigned_to_id = $1
        `;
        const params: any[] = [userId];

        if (role === 'admin' || role === 'editor') {
            // Also fetch public (team) tasks
            sql += ` OR (p.is_private = false)`;
        }

        sql += ` ORDER BY p.created_at DESC`;

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch planner tasks' });
    }
});

// POST /api/planner
router.post('/', authenticateToken, async (req: any, res) => {
    const { title, description, status, due_date, assigned_to_email, initiative_id, is_private } = req.body;
    
    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
        const userRes = await query('SELECT id FROM users WHERE email = $1', [req.user?.email]);
        const ownerId = userRes.rows[0]?.id;
        if (!ownerId) return res.status(401).json({ error: 'User not found' });

        let assignedToId = null;
        if (assigned_to_email) {
            const assignRes = await query('SELECT id FROM users WHERE email = $1', [assigned_to_email]);
            if (assignRes.rows.length > 0) {
                assignedToId = assignRes.rows[0].id;
            }
        }

        const result = await query(
            `INSERT INTO planner_tasks (title, description, status, due_date, owner_id, assigned_to_id, initiative_id, is_private)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, description || '', status || 'pending', due_date || null, ownerId, assignedToId, initiative_id || null, is_private ?? true]
        );

        const task = result.rows[0];

        await logActivity(ownerId, 'Creó Tarea en Planner', task.id, {
            entity_type: 'PlannerTask',
            title: task.title
        });

        res.status(201).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create planner task' });
    }
});

// PUT /api/planner/:id
router.put('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { title, description, status, due_date, assigned_to_email, initiative_id, is_private } = req.body;

    try {
        const userRes = await query('SELECT id FROM users WHERE email = $1', [req.user?.email]);
        const userId = userRes.rows[0]?.id;

        // Ensure user has permission to edit (owner or admin)
        const checkRes = await query('SELECT owner_id FROM planner_tasks WHERE id = $1', [id]);
        if (checkRes.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        
        if (checkRes.rows[0].owner_id !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to edit this task' });
        }

        let assignedToId = null;
        if (assigned_to_email) {
            const assignRes = await query('SELECT id FROM users WHERE email = $1', [assigned_to_email]);
            if (assignRes.rows.length > 0) {
                assignedToId = assignRes.rows[0].id;
            }
        }

        const result = await query(
            `UPDATE planner_tasks SET 
                title = $1, description = $2, status = $3, due_date = $4, assigned_to_id = $5, initiative_id = $6, is_private = $7, updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [title, description, status, due_date, assignedToId, initiative_id || null, is_private, id]
        );

        await logActivity(userId, 'Actualizó Tarea en Planner', id, {
            entity_type: 'PlannerTask',
            title: title
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// PATCH /api/planner/:id/status
router.patch('/:id/status', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await query(
            'UPDATE planner_tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );

        const userRes = await query('SELECT id FROM users WHERE email = $1', [req.user?.email]);
        const userId = userRes.rows[0]?.id;

        await logActivity(userId, 'Cambió Estatus Tarea Planner', id, {
            entity_type: 'PlannerTask',
            status: status
        });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

// DELETE /api/planner/:id
router.delete('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;

    try {
        const userRes = await query('SELECT id FROM users WHERE email = $1', [req.user?.email]);
        const userId = userRes.rows[0]?.id;

        const checkRes = await query('SELECT owner_id FROM planner_tasks WHERE id = $1', [id]);
        if (checkRes.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        
        if (checkRes.rows[0].owner_id !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this task' });
        }

        await query('DELETE FROM planner_tasks WHERE id = $1', [id]);

        await logActivity(userId, 'Eliminó Tarea de Planner', id, {
            entity_type: 'PlannerTask'
        });

        res.json({ message: 'Task deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;

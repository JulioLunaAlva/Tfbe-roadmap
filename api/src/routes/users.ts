import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db';
import { authenticateToken, requireSuperAdmin, isSuperAdmin } from '../middleware';
import { BCRYPT_ROUNDS, SUPERADMIN_EMAILS } from '../config';
import { emailSchema, passwordSchema, roleSchema, requireUuidParams, validate } from '../validation';

const router = Router();

const DEFAULT_PAGES = [
    '/',
    '/dashboard',
    '/initiative-value',
    '/one-pager',
    '/kanban',
    '/planner',
    '/capacity',
    '/timeline',
    '/calendar',
    '/comparative',
    '/risks',
    '/presentations',
    '/support'
];
const pagesSchema = z.array(z.string().max(100).regex(/^\/[A-Za-z0-9\-_/]*$/)).max(50);

const createSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
    allowed_pages: pagesSchema.optional(),
});

const updateSchema = z.object({
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: roleSchema,
    allowed_pages: pagesSchema.optional(),
    must_change_password: z.boolean().optional(),
});

// GET /users/list - list of users (e-mails only) for dropdowns. Any authenticated user.
router.get('/list', authenticateToken, async (_req, res) => {
    try {
        const result = await pool.query('SELECT email FROM users ORDER BY email ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users list:', (err as Error).message);
        res.status(500).json({ error: 'Failed to fetch users list' });
    }
});

// Credential management: super admins only (exact match against SUPERADMIN_EMAILS, or role "admin")
router.use(authenticateToken, requireSuperAdmin);

// GET /users - List all users
router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, role, allowed_pages, must_change_password, created_at FROM users ORDER BY email ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', (err as Error).message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /users - Create new user
router.post('/', validate(createSchema), async (req, res) => {
    const { email, password, role, allowed_pages } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role, allowed_pages) VALUES ($1, $2, $3, $4) RETURNING id, email, role, allowed_pages',
            [email, hashedPassword, role, allowed_pages || DEFAULT_PAGES]
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        console.error('Error creating user:', err.message);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /users/:id - Update user
router.put('/:id', requireUuidParams('id'), validate(updateSchema), async (req, res) => {
    const { id } = req.params;
    const { password, role, allowed_pages, email, must_change_password } = req.body;

    try {
        const sets: string[] = ['role = $1', 'allowed_pages = $2'];
        const values: any[] = [role, allowed_pages || DEFAULT_PAGES];

        if (email) {
            values.push(email);
            sets.push(`email = $${values.length}`);
        }
        if (password) {
            values.push(await bcrypt.hash(password, BCRYPT_ROUNDS));
            sets.push(`password_hash = $${values.length}`);
        }
        if (must_change_password !== undefined) {
            values.push(must_change_password);
            sets.push(`must_change_password = $${values.length}`);
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING id, email, role, allowed_pages, must_change_password`,
            values
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') return res.status(409).json({ error: 'User with this email already exists' });
        console.error('Error updating user:', err.message);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /users/:id - Delete user
router.delete('/:id', requireUuidParams('id'), async (req: any, res) => {
    const { id } = req.params;

    try {
        // Guards FIRST (previously references were nulled before the checks ran)
        if (id === req.user.id) {
            return res.status(403).json({ error: 'You cannot delete your own account.' });
        }
        const userCheck = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const target = userCheck.rows[0];
        if (SUPERADMIN_EMAILS.includes(String(target.email).toLowerCase())) {
            return res.status(403).json({ error: 'Cannot delete a super admin account.' });
        }

        // Preserve history but release FK references
        await pool.query('UPDATE weekly_progress SET created_by = NULL WHERE created_by = $1', [id]);
        await pool.query('UPDATE initiative_milestones SET created_by = NULL WHERE created_by = $1', [id]);
        await pool.query('UPDATE audit_logs SET user_id = NULL WHERE user_id = $1', [id]);

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
        console.error('Error deleting user:', err.code, err.message);
        if (err.code === '23503') {
            res.status(409).json({ error: 'Cannot delete user because they are still referenced in other records.' });
        } else {
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }
});

export default router;

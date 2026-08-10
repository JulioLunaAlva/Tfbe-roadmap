import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware';
import bcrypt from 'bcryptjs';

const router = Router();

// Middleware to check if user is Cesar
const requireCesar = (req: any, res: any, next: any) => {
    // Debug log
    console.log('[requireCesar] User:', req.user);

    // Check various possible locations/casings
    const email = (req.user?.email || req.user?.user?.email || '').toLowerCase();

    // Explicitly allow both 'cesar@kof.com' and 'cesar' (as username/email)
    // Also checking for potential 'Cesar' if lowercasing failed for some reason (though it shouldn't)
    if (email.includes('cesar@kof.com') || email === 'cesar') {
        next();
    } else {
        console.warn(`[requireCesar] Access denied for email: ${email}`);
        res.status(403).json({ error: 'Access denied. Only Cesar can manage credentials.' });
    }
};

// GET /users/list - Public list of users for dropdowns
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT email FROM users ORDER BY email ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users list:', err);
        res.status(500).json({ error: 'Failed to fetch users list' });
    }
});

// Apply auth and Cesar check to ALL OTHER routes
router.use(authenticateToken, requireCesar);

// GET /users - List all users
router.get('/', async (req, res) => {
    try {
        // Exclude password_hash for security
        const result = await pool.query(
            'SELECT id, email, role, allowed_pages, must_change_password, created_at FROM users ORDER BY email ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /users - Create new user
router.post('/', async (req, res) => {
    const { email, password, role, allowed_pages } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const pages = allowed_pages || ['/', '/dashboard', '/one-pager'];

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role, allowed_pages) VALUES ($1, $2, $3, $4) RETURNING id, email, role, allowed_pages',
            [email, hashedPassword, role, pages]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /users/:id - Update user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { password, role, allowed_pages, email, must_change_password } = req.body;

    try {
        let query = 'UPDATE users SET role = $1, allowed_pages = $2';
        const pages = allowed_pages || ['/', '/dashboard', '/one-pager'];
        let values: any[] = [role, pages];
        let paramIndex = 3;

        if (email) {
            query += `, email = $${paramIndex}`;
            values.push(email);
            paramIndex++;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password_hash = $${paramIndex}`;
            values.push(hashedPassword);
            paramIndex++;
        }

        if (must_change_password !== undefined) {
            query += `, must_change_password = $${paramIndex}`;
            values.push(must_change_password);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, email, role, allowed_pages, must_change_password`;
        values.push(id);

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /users/:id - Delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Prevent deleting self
    // Although checking by email is safer, ID check requires DB lookup first.
    // For simplicity, allowed, but UI should warn. 
    // Ideally backend should block deleting specifically the 'Cesar' account to prevent lockout.

    try {
        // Step 1: Manual cleanup of references (Integrity Protection)
        // Since database constraints might block deletion, we manually set references to NULL
        // to preserve historical data but allow the user to be removed.
        await pool.query('UPDATE weekly_progress SET created_by = NULL WHERE created_by = $1', [id]);
        await pool.query('UPDATE initiative_milestones SET created_by = NULL WHERE created_by = $1', [id]);
        await pool.query('UPDATE audit_logs SET user_id = NULL WHERE user_id = $1', [id]);

        // Step 2: Protect Cesar account from accidental deletion
        const userCheck = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length > 0) {
            const email = userCheck.rows[0].email.toLowerCase();
            if (email === 'cesar@kof.com' || email === 'cesar') {
                return res.status(403).json({ error: 'Cannot delete the main admin account.' });
            }
        }

        // Step 3: Perform the actual deletion
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
        console.error('Error deleting user:', err);
        // Provice a more descriptive error if it's still a constraint issue
        if (err.code === '23503') {
            res.status(500).json({ error: 'Cannot delete user because they are still referenced in other tables. Manual cleanup required.' });
        } else {
            res.status(500).json({ error: `Failed to delete user: ${err.message}` });
        }
    }
});

export default router;

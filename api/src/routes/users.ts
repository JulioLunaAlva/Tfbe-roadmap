import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware';
import bcrypt from 'bcryptjs';

const router = Router();

// Middleware to check if user is Cesar
const requireCesar = (req: any, res: any, next: any) => {
    const email = req.user?.email?.toLowerCase();
    if (email === 'cesar@kof.com' || email === 'cesar') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Only Cesar can manage credentials.' });
    }
};

// Apply auth and Cesar check to all routes
router.use(authenticateToken, requireCesar);

// GET /users - List all users
router.get('/', async (req, res) => {
    try {
        // Exclude password_hash for security
        const result = await pool.query(
            'SELECT id, email, role, created_at FROM users ORDER BY email ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /users - Create new user
router.post('/', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, hashedPassword, role]
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
    const { password, role } = req.body;

    try {
        let query = 'UPDATE users SET role = $1';
        let values = [role];
        let paramIndex = 2;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password_hash = $${paramIndex}`;
            values.push(hashedPassword);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, email, role`;
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
        // Protect Cesar account from deletion
        const userCheck = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length > 0) {
            const email = userCheck.rows[0].email.toLowerCase();
            if (email === 'cesar@kof.com' || email === 'cesar') {
                return res.status(403).json({ error: 'Cannot delete the main admin account.' });
            }
        }

        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;

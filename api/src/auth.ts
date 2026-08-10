import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Full session token (7 days)
const generateToken = (email: string, role: string, id: string, allowed_pages?: string[]) => {
    return jwt.sign({ email, role, id, allowed_pages }, JWT_SECRET, { expiresIn: '7d' });
};

// Short-lived token only valid for changing password (15 minutes)
const generateTempToken = (id: string, email: string) => {
    return jwt.sign({ id, email, purpose: 'change_password' }, JWT_SECRET, { expiresIn: '15m' });
};

import bcrypt from 'bcryptjs';

export const loginCall = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        // Check if user exists
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify Password
        if (!user.password_hash) {
            return res.status(401).json({ error: 'User has no password set. Please contact admin.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If user must change password, return a temp token instead of a full session
        if (user.must_change_password) {
            const tempToken = generateTempToken(user.id, user.email);
            return res.json({
                must_change_password: true,
                temp_token: tempToken,
                user: { email: user.email }
            });
        }

        // Generate full session token
        const token = generateToken(user.email, user.role || 'viewer', user.id, user.allowed_pages);

        // Respond success
        res.json({ message: 'Login successful', token, user: { email: user.email, role: user.role, allowed_pages: user.allowed_pages } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/auth/change-password
// Works for both:
//   - Forced change (uses temp_token from must_change_password flow, no current password needed)
//   - Self-service change (uses normal session token, requires current password)
export const changePassword = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
        decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { newPassword, currentPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    try {
        const userResult = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isForced = decoded.purpose === 'change_password';

        if (!isForced) {
            // Self-service: validate current password
            if (!currentPassword) {
                return res.status(400).json({ error: 'La contraseña actual es requerida' });
            }
            const validCurrent = await bcrypt.compare(currentPassword, user.password_hash);
            if (!validCurrent) {
                return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query(
            'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
            [hashedPassword, decoded.id]
        );

        // Issue full session token so user is logged in after changing password
        const freshUser = await query(
            'SELECT id, email, role, allowed_pages FROM users WHERE id = $1',
            [decoded.id]
        );
        const u = freshUser.rows[0];
        const fullToken = generateToken(u.email, u.role || 'viewer', u.id, u.allowed_pages);

        res.json({
            message: 'Contraseña actualizada exitosamente',
            token: fullToken,
            user: { email: u.email, role: u.role, allowed_pages: u.allowed_pages }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyToken = async (req: Request, res: Response) => {
    // Client should send token in header Authorization: Bearer <token>
    // This endpoint might be 'me' to check validity
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Fetch fresh user data from DB to include allowed_pages
        const userResult = await query('SELECT id, email, role, allowed_pages FROM users WHERE email = $1', [decoded.email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'User not found in database' });
        }

        res.json({ user });
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

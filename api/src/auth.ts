import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Helper to generate simple random code for "Magic Link" simulation
// In prod, this would be a signed token in a URL.
const generateToken = (email: string, role: string, id: string) => {
    return jwt.sign({ email, role, id }, JWT_SECRET, { expiresIn: '7d' });
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

        // Generate Token
        // Ensure user.role is valid
        const token = generateToken(user.email, user.role || 'viewer', user.id);

        // Respond success
        res.json({ message: 'Login successful', token, user: { email: user.email, role: user.role } });
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
        res.json({ user: decoded });
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

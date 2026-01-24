import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Helper to generate simple random code for "Magic Link" simulation
// In prod, this would be a signed token in a URL.
const generateToken = (email: string, role: string, id: string) => {
    return jwt.sign({ email, role, id }, JWT_SECRET, { expiresIn: '7d' });
};

export const loginCall = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        // Check if user exists
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userResult.rows[0];

        // MVP: Auto-create user if not differs. OR restrict. 
        // Requirement says "Editor -> TFBE Team", "Viewer -> Others".
        // For MVP, if it's the first user, make admin? 
        // Or just allow login and default to 'viewer'.

        if (!user) {
            // Auto-register as viewer for now
            const result = await query(
                'INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *',
                [email, 'viewer']
            );
            user = result.rows[0];
        }

        // Generate Token
        const token = generateToken(user.email, user.role, user.id);

        // "Send" email. For MVP development:
        console.log(`[MAGIC LINK] Login link for ${email}: /auth/callback?token=${token}`);

        // Respond success
        res.json({ message: 'Magic link sent (check console)', token }); // Returning token in body for convenient testing
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

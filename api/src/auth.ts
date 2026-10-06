import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from './db';
import { JWT_SECRET, BCRYPT_ROUNDS } from './config';
import { extractBearer, verifyJwt } from './middleware';
import { emailSchema, passwordSchema } from './validation';

// Full session token (reduced from 7 days; the user is re-validated against the DB on every request)
const SESSION_TTL = '12h';

const generateToken = (email: string, role: string, id: string, allowed_pages?: string[]) => {
    return jwt.sign({ email, role, id, allowed_pages }, JWT_SECRET, { expiresIn: SESSION_TTL, algorithm: 'HS256' });
};

// Short-lived token only valid for changing password (15 minutes)
const generateTempToken = (id: string, email: string) => {
    return jwt.sign({ id, email, purpose: 'change_password' }, JWT_SECRET, { expiresIn: '15m', algorithm: 'HS256' });
};

// Compared against when the user does not exist, so response time does not reveal valid e-mails.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-not-a-real-password', BCRYPT_ROUNDS);

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().min(1).max(254),
    password: z.string().min(1).max(72),
});

const publicUser = (u: any) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    allowed_pages: u.allowed_pages,
    avatar_url: u.avatar_url || '',
    name: u.name || '',
});

export const loginCall = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Email and password required' });
    const { email, password } = parsed.data;

    try {
        const userResult = await query(
            `SELECT id, email, role, allowed_pages, avatar_url, name, password_hash, must_change_password
               FROM users WHERE LOWER(email) = $1`,
            [email]
        );
        const user = userResult.rows[0];

        // Same response and comparable timing for "unknown user", "no password" and "wrong password"
        const validPassword = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
        if (!user || !user.password_hash || !validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If user must change password, return a temp token instead of a full session
        if (user.must_change_password) {
            return res.json({
                must_change_password: true,
                temp_token: generateTempToken(user.id, user.email),
                user: { email: user.email },
            });
        }

        const token = generateToken(user.email, user.role || 'viewer', user.id, user.allowed_pages);
        res.json({ message: 'Login successful', token, user: publicUser(user) });
    } catch (error) {
        console.error('[auth] login failed:', (error as Error).message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const changePasswordSchema = z.object({
    newPassword: passwordSchema,
    currentPassword: z.string().max(72).optional(),
});

// POST /api/auth/change-password
// Works for both:
//   - Forced change (uses temp_token from must_change_password flow, no current password needed)
//   - Self-service change (uses normal session token, requires current password)
export const changePassword = async (req: Request, res: Response) => {
    const token = extractBearer(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = verifyJwt(token);
    if (!decoded || typeof decoded.id !== 'string') {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.issues[0]?.message || 'La nueva contraseña no cumple los requisitos',
        });
    }
    const { newPassword, currentPassword } = parsed.data;

    try {
        const userResult = await query('SELECT id, password_hash FROM users WHERE id = $1', [decoded.id]);
        const user = userResult.rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid or expired token' });

        const isForced = decoded.purpose === 'change_password';

        if (!isForced) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'La contraseña actual es requerida' });
            }
            const validCurrent = await bcrypt.compare(currentPassword, user.password_hash || DUMMY_HASH);
            if (!validCurrent) {
                return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await query(
            'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
            [hashedPassword, decoded.id]
        );

        // Issue full session token so user is logged in after changing password
        const freshUser = await query(
            'SELECT id, email, role, allowed_pages, avatar_url, name FROM users WHERE id = $1',
            [decoded.id]
        );
        const u = freshUser.rows[0];
        const fullToken = generateToken(u.email, u.role || 'viewer', u.id, u.allowed_pages);

        res.json({
            message: 'Contraseña actualizada exitosamente',
            token: fullToken,
            user: publicUser(u),
        });
    } catch (error) {
        console.error('[auth] change-password failed:', (error as Error).message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyToken = async (req: Request, res: Response) => {
    const token = extractBearer(req);
    if (!token) return res.status(401).json({ error: 'No token' });

    const decoded = verifyJwt(token);
    // Temp (change_password) tokens are not valid sessions
    if (!decoded || decoded.purpose || typeof decoded.id !== 'string') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    try {
        const userResult = await query(
            'SELECT id, email, role, allowed_pages, avatar_url, name FROM users WHERE id = $1',
            [decoded.id]
        );
        const user = userResult.rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid token' });
        res.json({ user });
    } catch (error) {
        console.error('[auth] verify failed:', (error as Error).message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Only https:// image URLs (no javascript:, data:, http:) and a sane length
const profileSchema = z
    .object({
        avatar_url: z
            .union([z.literal(''), z.string().trim().max(500).url().refine((v) => v.startsWith('https://'), 'avatar_url must use https')])
            .optional(),
        name: z.string().trim().max(120).optional(),
    })
    .strict();

export const updateProfile = async (req: Request, res: Response) => {
    const token = extractBearer(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = verifyJwt(token);
    if (!decoded || decoded.purpose || typeof decoded.id !== 'string') {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid profile data' });
    const { avatar_url, name } = parsed.data;

    try {
        const updateFields: string[] = [];
        const values: any[] = [];

        if (avatar_url !== undefined) {
            values.push(avatar_url);
            updateFields.push(`avatar_url = $${values.length}`);
        }
        if (name !== undefined) {
            values.push(name);
            updateFields.push(`name = $${values.length}`);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(decoded.id);
        const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${values.length} RETURNING id, email, role, allowed_pages, avatar_url, name`;
        const result = await query(queryText, values);

        if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'Perfil actualizado exitosamente', user: result.rows[0] });
    } catch (error) {
        console.error('[auth] update profile failed:', (error as Error).message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

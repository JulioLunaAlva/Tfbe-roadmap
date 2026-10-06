import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, SUPERADMIN_EMAILS } from './config';
import { query } from './db';

export type Role = 'admin' | 'editor' | 'viewer';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: Role;
        allowed_pages?: string[];
    };
}

const ROLES: Role[] = ['admin', 'editor', 'viewer'];

export const extractBearer = (req: Request): string | null => {
    const header = req.headers['authorization'];
    if (!header || typeof header !== 'string') return null;
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
};

/** Verifies signature (HS256 only) and expiry. Returns null on any failure. */
export const verifyJwt = (token: string): jwt.JwtPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        return typeof decoded === 'object' ? decoded : null;
    } catch {
        return null;
    }
};

/**
 * Authenticates the request. The user's role / existence is ALWAYS re-read from the database,
 * so deleted or demoted users lose access immediately (the JWT is only proof of identity).
 * Short-lived "change_password" tokens are rejected here.
 */
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = extractBearer(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const payload = verifyJwt(token);
    if (!payload || payload.purpose || typeof payload.id !== 'string') {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    try {
        const result = await query(
            'SELECT id, email, role, allowed_pages FROM users WHERE id = $1',
            [payload.id]
        );
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid or expired token' });

        req.user = {
            id: user.id,
            email: user.email,
            role: ROLES.includes(user.role) ? user.role : 'viewer',
            allowed_pages: user.allowed_pages,
        };
        next();
    } catch (err) {
        console.error('[auth] user lookup failed:', (err as Error).message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requireRole = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const current = req.user?.role;
        if (current === role) return next();
        // Hierarchy: admin > editor > viewer
        if (role === 'editor' && current === 'admin') return next();
        if (role === 'viewer' && (current === 'admin' || current === 'editor')) return next();
        return res.status(403).json({ error: 'Forbidden' });
    };
};

/** Credential / area management. Exact e-mail match from SUPERADMIN_EMAILS, otherwise role "admin". */
export const isSuperAdmin = (user?: { email?: string; role?: string }): boolean => {
    if (!user) return false;
    if (SUPERADMIN_EMAILS.length > 0) {
        return SUPERADMIN_EMAILS.includes((user.email || '').toLowerCase());
    }
    return user.role === 'admin';
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (isSuperAdmin(req.user)) return next();
    return res.status(403).json({ error: 'Forbidden' });
};

/** Area management: any admin, or a configured super admin. */
export const requireAreaAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'admin' || isSuperAdmin(req.user)) return next();
    return res.status(403).json({ error: 'Forbidden' });
};

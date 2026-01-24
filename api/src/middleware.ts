import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthRequest extends Request {
    user?: {
        email: string;
        role: 'admin' | 'editor' | 'viewer';
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

export const requireRole = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || req.user.role !== role) {
            // Simple check, implies strict equality. 
            // Editors might want Admin access? Generally explicit roles.
            // If we want hierarchy: Admin > Editor > Viewer
            if (role === 'editor' && req.user?.role === 'admin') return next();
            return res.sendStatus(403);
        }
        next();
    };
};

import { Router } from 'express';
import { authenticateToken } from '../middleware';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);

// Admin routes are handled through proper authenticated endpoints:
// - Password changes: POST /api/auth/change-password
// - User management: /api/users (Cesar-only routes)

export default router;

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';

const router = Router();

// TEMPORARY ENDPOINT - Remove after use
router.post('/update-password', async (req: Request, res: Response) => {
    const { email, newPassword, adminSecret } = req.body;

    // Simple security check
    if (adminSecret !== 'temp-update-2026') {
        return res.status(403).json({ error: 'Invalid admin secret' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, role',
            [hashedPassword, email]
        );

        if (result.rows.length > 0) {
            res.json({
                success: true,
                message: 'Password updated successfully',
                user: result.rows[0]
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

export default router;

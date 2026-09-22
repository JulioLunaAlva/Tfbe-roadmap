import { Router } from 'express';
import { loginCall, verifyToken, changePassword, updateProfile } from '../auth';

const router = Router();

router.post('/login', loginCall);
router.get('/verify', verifyToken);
router.get('/me', verifyToken);
router.post('/change-password', changePassword);
router.put('/profile', updateProfile);

export default router;

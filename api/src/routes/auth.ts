import { Router } from 'express';
import { loginCall, verifyToken, changePassword } from '../auth';

const router = Router();

router.post('/login', loginCall);
router.get('/verify', verifyToken);
router.get('/me', verifyToken);
router.post('/change-password', changePassword);

export default router;

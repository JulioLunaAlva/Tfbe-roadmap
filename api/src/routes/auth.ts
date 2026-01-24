import { Router } from 'express';
import { loginCall, verifyToken } from '../auth';

const router = Router();

router.post('/login', loginCall);
router.get('/verify', verifyToken);
router.get('/me', verifyToken);

export default router;

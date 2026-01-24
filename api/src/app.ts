import express from 'express';
import cors from 'cors';
import { loginCall, verifyToken } from './auth';
import { authenticateToken } from './middleware';
import initiativesRouter from './routes/initiatives';
import progressRouter from './routes/progress';
import importRouter from './routes/import';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Auth
app.post('/api/auth/login', loginCall);
app.get('/api/auth/me', verifyToken); // Logic simplified in auth.ts to look for header

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// We will add more routes here dynamically or import them
// app.use('/api/initiatives', initiativesRouter);
app.use('/api/initiatives', initiativesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/import', importRouter);

export default app;

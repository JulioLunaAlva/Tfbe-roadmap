import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { loginCall, verifyToken } from './src/auth';
import initiativesRouter from './src/routes/initiatives';
import progressRouter from './src/routes/progress';
import importRouter from './src/routes/import';

const app = express();

app.use(cors());
app.use(express.json());

// Auth routes (without /api prefix - Vercel adds it)
app.post('/auth/login', loginCall);
app.get('/auth/me', verifyToken);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Test route
app.get('/test', (req, res) => {
    res.send('API is working');
});

// Feature routes
app.use('/initiatives', initiativesRouter);
app.use('/progress', progressRouter);
app.use('/import', importRouter);

// Debug logging
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.path}`);
    next();
});

// 404 handler
app.use('*', (req, res) => {
    console.log(`[404] Route not found: ${req.originalUrl}`);
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        url: req.originalUrl
    });
});

// Vercel serverless function handler
export default async (req: VercelRequest, res: VercelResponse) => {
    return app(req, res);
};

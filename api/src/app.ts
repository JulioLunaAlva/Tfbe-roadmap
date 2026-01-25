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
// Routes - Auth (Handle both with and without /api prefix for Vercel compatibility)
app.post('/api/auth/login', loginCall);
app.post('/auth/login', loginCall);

app.get('/api/auth/me', verifyToken);
app.get('/auth/me', verifyToken);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Simple Test Route
app.get('/api/test', (req, res) => {
    res.send('API is working');
});

// We will add more routes here dynamically or import them
// app.use('/api/initiatives', initiativesRouter);
app.use('/api/initiatives', initiativesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/import', importRouter);

// Debug: Log all requests
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.path}`);
    next();
});

// Catch-all for ANY 404 to ensure JSON response and debug info
app.use('*', (req, res) => {
    console.log(`[404] Route not found: ${req.originalUrl}`);
    res.status(404).json({
        error: `Route not found`,
        path: req.path,
        url: req.originalUrl,
        method: req.method
    });
});

export default app;

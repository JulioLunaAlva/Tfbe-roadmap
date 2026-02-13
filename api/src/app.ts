import express from 'express';
import cors from 'cors';
import { loginCall, verifyToken } from './auth';
import { authenticateToken } from './middleware';
import initiativesRouter from './routes/initiatives';
import progressRouter from './routes/progress';
import importRouter from './routes/import';
import preferencesRouter from './routes/preferences';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Auth
app.post('/auth/login', loginCall);
app.get('/auth/me', verifyToken);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Simple Test Route
app.get('/test', (req, res) => {
    res.send('API is working');
});

// Feature routes
app.use('/initiatives', initiativesRouter);
app.use('/progress', progressRouter);
app.use('/import', importRouter);
app.use('/preferences', preferencesRouter);

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

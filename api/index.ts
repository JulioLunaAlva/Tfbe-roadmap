import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.send('API is working');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
    });
});

// Vercel serverless function handler
export default async (req: VercelRequest, res: VercelResponse) => {
    return app(req, res);
};


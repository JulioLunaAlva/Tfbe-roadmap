import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());


import authRoutes from './src/routes/auth';
import initiativeRoutes from './src/routes/initiatives';
import milestoneRoutes from './src/routes/milestones';
import progressRoutes from './src/routes/progress';
import preferenceRoutes from './src/routes/preferences';
import importRoutes from './src/routes/import';
import onePagerRoutes from './src/routes/onepagers';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/initiatives', initiativeRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/import', importRoutes);
app.use('/api/one-pagers', onePagerRoutes);

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


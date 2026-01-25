import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './src/app';

// Vercel serverless function handler
export default async (req: VercelRequest, res: VercelResponse) => {
    return app(req, res);
};


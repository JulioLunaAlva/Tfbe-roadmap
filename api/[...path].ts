import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../api/src/app';

// Vercel serverless function that handles ALL /api/* routes
export default async (req: VercelRequest, res: VercelResponse) => {
    // Let Express handle the request
    return app(req, res);
};

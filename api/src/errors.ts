import { Request, Response, NextFunction } from 'express';

// Central error handling: the client only ever receives a generic message.
// Stack traces, SQL, file paths and driver messages stay in the server logs.

export const notFoundHandler = (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;

    // Malformed JSON / payload too large are client errors
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Payload too large' });
    }
    if (err?.code === 'LIMIT_UNEXPECTED_FILE' || err?.name === 'MulterError') {
        return res.status(400).json({ error: 'Invalid upload' });
    }

    console.error('[error]', err?.code || err?.name || 'Error', err?.message);
    res.status(500).json({ error: 'Internal server error' });
};

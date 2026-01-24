import app from './src/app';

// For Vercel Serverless Functions, we usually just export the app
// if using the express wrapper or just the handler.
// Vercel supports Express apps directly as a serverless function entry point
// if configured in vercel.json or just exporting default.

export default app;

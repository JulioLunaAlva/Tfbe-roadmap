import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import initiativesRouter from './routes/initiatives';
import progressRouter from './routes/progress';
import importRouter from './routes/import';
import milestonesRouter from './routes/milestones';
import adminRouter from './routes/admin';
import dbStatusRouter from './routes/db-status';
import onePagerRouter from './routes/onepagers';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
// Routes
app.use('/api/auth', authRouter);
app.use('/api/initiatives', initiativesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/import', importRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/db', dbStatusRouter);
app.use('/api/one-pagers', onePagerRouter);

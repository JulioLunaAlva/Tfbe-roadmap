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
import supportRouter from './routes/support';
import usersRouter from './routes/users';
import dashboardRouter from './routes/dashboard';
import { query } from './db';

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
app.use('/api/one-pagers', onePagerRouter);
app.use('/api/support', supportRouter);
app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);

// Database Initialization: Create dashboard_layouts table if not exists
const initDb = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS dashboard_layouts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        layout_data JSONB NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_active ON dashboard_layouts(is_active) WHERE (is_active = true);
    `);
    console.log('✅ Dashboard layouts table ready');
  } catch (err) {
    console.error('❌ Failed to initialize dashboard layout table:', err);
  }
};
initDb();

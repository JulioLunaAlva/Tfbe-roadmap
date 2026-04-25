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
import initiativeValueRouter from './routes/initiative-value';
import usersRouter from './routes/users';
import dashboardRouter from './routes/dashboard';
import kpiSummaryRouter from './routes/kpi-summary';
import commentsRouter from './routes/comments';
import activityRouter from './routes/activity';
import risksRouter from './routes/risks';
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
app.use('/api/initiative-value', initiativeValueRouter);
app.use('/api/kpi-summary', kpiSummaryRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/activity', activityRouter);
app.use('/api/risks', risksRouter);

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
    await query(`
      CREATE TABLE IF NOT EXISTS initiative_value (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
        business_value TEXT DEFAULT '',
        operational_efficiency TEXT DEFAULT '',
        fte_detail TEXT DEFAULT '',
        qualitative_benefit TEXT DEFAULT '',
        users_reached_detail TEXT DEFAULT '',
        estimated_savings_detail TEXT DEFAULT '',
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(initiative_id)
      );
      CREATE INDEX IF NOT EXISTS idx_initiative_value_initiative ON initiative_value(initiative_id);
    `);
    // Add tags column to initiatives (if not exists)
    await query(`
      ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    `);
    // Create initiative_comments table
    await query(`
      CREATE TABLE IF NOT EXISTS initiative_comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_comments_initiative ON initiative_comments(initiative_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created ON initiative_comments(created_at DESC);
    `);
    // Create initiative_risks table
    await query(`
      CREATE TABLE IF NOT EXISTS initiative_risks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        severity VARCHAR(50) DEFAULT 'Medio',
        status VARCHAR(50) DEFAULT 'Abierto',
        mitigation TEXT DEFAULT '',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_risks_initiative ON initiative_risks(initiative_id);
    `);
    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ Failed to initialize dashboard layout table:', err);
  }
};
initDb();

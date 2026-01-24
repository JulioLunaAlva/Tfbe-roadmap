-- Create Milestones Table
CREATE TABLE IF NOT EXISTS initiative_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('flag', 'star', 'check', 'start', 'end')), 
  date DATE, -- Optional specific date
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by initiative
-- Index for fast lookup by initiative
CREATE INDEX IF NOT EXISTS idx_milestones_initiative ON initiative_milestones(initiative_id);

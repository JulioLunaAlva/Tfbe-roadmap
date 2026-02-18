-- One Pagers Table
CREATE TABLE IF NOT EXISTS one_pagers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  
  -- Content Fields
  main_progress TEXT,
  next_steps TEXT,
  stoppers_risks TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one report per initiative per week
  UNIQUE(initiative_id, year, week_number)
);

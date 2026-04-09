-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  layout_data JSONB NOT NULL, -- { order: string[], sizes: Record<string, number> }
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one layout is active at a time (optional, but good for logic)
-- Actually, multiple could be saved, but we'll manage "active" via application logic or a toggle.

-- Index for performance on active check
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_active ON dashboard_layouts(is_active) WHERE (is_active = true);

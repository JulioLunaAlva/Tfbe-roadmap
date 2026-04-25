-- Migration V9: Initiative Value / Impacto & Valor
-- One record per initiative storing 6 value pillars (all rich text)

CREATE TABLE IF NOT EXISTS initiative_value (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  -- 6 Pillar Rich Text Fields
  business_value TEXT DEFAULT '',
  operational_efficiency TEXT DEFAULT '',
  fte_detail TEXT DEFAULT '',
  qualitative_benefit TEXT DEFAULT '',
  users_reached_detail TEXT DEFAULT '',
  estimated_savings_detail TEXT DEFAULT '',
  -- Metadata
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(initiative_id)
);

CREATE INDEX IF NOT EXISTS idx_initiative_value_initiative ON initiative_value(initiative_id);

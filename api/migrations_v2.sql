-- Create initiative_phases table
CREATE TABLE IF NOT EXISTS initiative_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  phase_id INTEGER REFERENCES phases(id),
  custom_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(initiative_id, phase_id)
);

-- Seed existing initiatives with default phases (Backfill)
DO $$
DECLARE
  r_initiative RECORD;
  r_phase RECORD;
BEGIN
  FOR r_initiative IN SELECT id FROM initiatives LOOP
    FOR r_phase IN SELECT id, default_order FROM phases LOOP
      INSERT INTO initiative_phases (initiative_id, phase_id, custom_order)
      VALUES (r_initiative.id, r_phase.id, r_phase.default_order)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

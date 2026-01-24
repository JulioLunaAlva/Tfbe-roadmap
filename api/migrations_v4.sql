-- Add notes column to initiative_phases
ALTER TABLE initiative_phases ADD COLUMN IF NOT EXISTS notes TEXT;

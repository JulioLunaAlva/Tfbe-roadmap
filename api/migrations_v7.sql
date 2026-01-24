-- Create unique index for NULL phase_id (Main Row Progress)
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_progress_main_row 
ON weekly_progress (initiative_id, year, week_number) 
WHERE phase_id IS NULL;

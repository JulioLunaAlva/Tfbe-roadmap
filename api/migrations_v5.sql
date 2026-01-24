-- Drop Check Constraint on progress_value in weekly_progress
ALTER TABLE weekly_progress DROP CONSTRAINT IF EXISTS weekly_progress_progress_value_check;

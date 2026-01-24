-- Add custom_order column to initiatives
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS custom_order SERIAL;

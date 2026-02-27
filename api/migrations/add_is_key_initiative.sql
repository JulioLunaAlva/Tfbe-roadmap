-- Migration to add is_key_initiative to initiatives table

ALTER TABLE initiatives
ADD COLUMN IF NOT EXISTS is_key_initiative BOOLEAN DEFAULT false;

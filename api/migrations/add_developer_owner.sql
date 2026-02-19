
ALTER TABLE initiatives 
ADD COLUMN IF NOT EXISTS developer_owner VARCHAR(255);

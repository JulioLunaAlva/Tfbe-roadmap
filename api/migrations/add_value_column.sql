-- Migration: Add value column to initiatives table
-- Date: 2026-02-12

ALTER TABLE initiatives 
ADD COLUMN value VARCHAR(50);

-- Add comment
COMMENT ON COLUMN initiatives.value IS 'Strategic value classification: Estrategico Alto Valor, Operational Value, Mandatorio/Compliance, Deferred/Not prioritized';

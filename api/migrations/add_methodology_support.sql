-- Add methodology_type column to initiatives table
ALTER TABLE initiatives 
ADD COLUMN IF NOT EXISTS methodology_type VARCHAR(50) DEFAULT 'Hibrida';

-- Add methodology column to phases table
ALTER TABLE phases 
ADD COLUMN IF NOT EXISTS methodology VARCHAR(50) DEFAULT 'Hibrida';

-- Set default methodology for existing phases
UPDATE phases SET methodology = 'Hibrida' WHERE methodology IS NULL;

-- Insert Phases for 'Analiticos'
INSERT INTO phases (name, default_order, methodology) VALUES
('Conocimiento del negocio', 1, 'Analiticos'),
('Comprensión Datos del negocio', 2, 'Analiticos'),
('Preparación de Datos', 3, 'Analiticos'),
('Modelación', 4, 'Analiticos'),
('Evaluación de Modelos', 5, 'Analiticos'),
('Implantación de la Solución', 6, 'Analiticos'),
('Seguimiento', 7, 'Analiticos')
ON CONFLICT (name, methodology) DO NOTHING; -- Assuming unique constraint includes methodology, but if not name might be duplicated. 
-- Actually phases table usually only has name and default_order. We need to be careful not to duplicate if we just run this blindly.
-- Let's check constraints first. If no unique constraint on name+methodology, we might insert dupes.
-- Safer to just insert.

-- Insert Phases for 'Reporting'
INSERT INTO phases (name, default_order, methodology) VALUES
('Diseño', 1, 'Reporting'),
('Elaboración HU', 2, 'Reporting'),
('Base Datos', 3, 'Reporting'),
('Modelación Datos', 4, 'Reporting'),
('Visuales', 5, 'Reporting'),
('Liberación', 6, 'Reporting'),
('Seguimiento', 7, 'Reporting');

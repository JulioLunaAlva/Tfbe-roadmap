-- Migration V11: Multi-Area Support
-- Adds business_areas catalog, user_area_access permissions, and area linkage for initiatives

-- Catálogo de áreas de negocio
CREATE TABLE IF NOT EXISTS business_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT '',
  color VARCHAR(20) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'Building2',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed: Área inicial TFBE
INSERT INTO business_areas (slug, name, description, color, icon, display_order)
VALUES 
  ('tfbe', 'Transformación Finanzas', 'Portafolio de iniciativas de Transformación Finanzas BE', '#6366f1', 'TrendingUp', 0),
  ('grc', 'Gestión Riesgos & Controles', 'Portafolio de iniciativas de Gestión de Riesgos y Controles', '#f59e0b', 'ShieldCheck', 1)
ON CONFLICT (slug) DO NOTHING;

-- Acceso de usuarios a áreas
CREATE TABLE IF NOT EXISTS user_area_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES business_areas(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, area_id)
);

-- Vincular iniciativas a área de negocio
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS business_area_id UUID REFERENCES business_areas(id);

-- Migrar iniciativas existentes al área TFBE
UPDATE initiatives
SET business_area_id = (SELECT id FROM business_areas WHERE slug = 'tfbe')
WHERE business_area_id IS NULL;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_initiatives_business_area ON initiatives(business_area_id);
CREATE INDEX IF NOT EXISTS idx_user_area_access_user ON user_area_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_area_access_area ON user_area_access(area_id);

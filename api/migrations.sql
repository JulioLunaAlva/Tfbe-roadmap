-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initiatives Table
CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  area VARCHAR(100) NOT NULL,
  champion VARCHAR(100),
  complexity VARCHAR(20) CHECK (complexity IN ('Alta', 'Media', 'Baja')),
  is_top_priority BOOLEAN DEFAULT FALSE,
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Technologies (Many-to-Many)
CREATE TABLE IF NOT EXISTS technologies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS initiative_technologies (
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  technology_id INTEGER REFERENCES technologies(id) ON DELETE CASCADE,
  PRIMARY KEY (initiative_id, technology_id)
);

-- Phases Table (Configurable Master)
CREATE TABLE IF NOT EXISTS phases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  default_order INTEGER NOT NULL
);

-- Seed Default Phases
INSERT INTO phases (name, default_order) VALUES
('Entendimiento', 1),
('Requerimientos', 2),
('Desarrollo', 3),
('Pruebas', 4),
('Ajustes', 5),
('Implementación', 6)
ON CONFLICT DO NOTHING;

-- Weekly Progress
CREATE TABLE IF NOT EXISTS weekly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  phase_id INTEGER REFERENCES phases(id),
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  progress_value INTEGER CHECK (progress_value IN (0, 25, 50, 75, 100)),
  comment TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(initiative_id, phase_id, year, week_number)
);

-- Audit Log (Simple)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

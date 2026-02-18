
CREATE TABLE IF NOT EXISTS support_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  area VARCHAR(100) NOT NULL,
  technology VARCHAR(255),
  champion VARCHAR(100),
  description TEXT,
  responsible VARCHAR(50) NOT NULL CHECK (responsible IN ('BE', 'D&A', 'BE & D&A', 'BE & TERCEROS')),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'On Hold', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

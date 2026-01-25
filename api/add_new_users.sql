-- SQL to add new viewer users to the database
-- Run this in Neon SQL Editor

-- User: champion / champion (viewer role)
INSERT INTO users (email, role, password_hash) 
VALUES ('champion', 'viewer', '$2b$10$uDAmd6LC.9m37d3hHEfHuOu8XlaanzRNzU/tcH18o0yQoxuiu4izi');

-- User: usuariokof / usuariokof (viewer role)
INSERT INTO users (email, role, password_hash) 
VALUES ('usuariokof', 'viewer', '$2b$10$aVcrimLBMztz7YBLp61gP.HWtLOGoNVc/NKgPghDQ6BNnbDrN6cky');

-- Verify the users were created
SELECT email, role, created_at FROM users WHERE email IN ('champion', 'usuariokof');

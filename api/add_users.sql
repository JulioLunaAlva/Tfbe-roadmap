-- Add new viewer users
-- Run this in Neon SQL Editor or via Render Shell

-- User: champion / champion
INSERT INTO users (email, role, password_hash)
VALUES (
    'champion',
    'viewer',
    '$2a$10$YourHashedPasswordHere'  -- This will be replaced with actual hash
);

-- User: usuariokof / usuariokof
INSERT INTO users (email, role, password_hash)
VALUES (
    'usuariokof',
    'viewer',
    '$2a$10$YourHashedPasswordHere'  -- This will be replaced with actual hash
);

-- To generate the hashed passwords, run this in Node.js:
-- const bcrypt = require('bcryptjs');
-- bcrypt.hash('champion', 10).then(hash => console.log('champion:', hash));
-- bcrypt.hash('usuariokof', 10).then(hash => console.log('usuariokof:', hash));

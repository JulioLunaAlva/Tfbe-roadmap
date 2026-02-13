-- Diagnostic query to check for duplicate phases in the database
-- Run this query in your Neon database console

-- 1. Check if there are duplicate phase names in the phases table
SELECT name, COUNT(*) as count
FROM phases
GROUP BY name
HAVING COUNT(*) > 1;

-- 2. Check all phases in the phases table
SELECT * FROM phases ORDER BY default_order;

-- 3. Check initiative_phases for a specific initiative to see duplicates
-- Replace 'INITIATIVE_ID' with an actual initiative ID that has duplicates
SELECT ip.*, p.name as phase_name
FROM initiative_phases ip
JOIN phases p ON ip.phase_id = p.id
WHERE ip.initiative_id = 'INITIATIVE_ID'
ORDER BY ip.custom_order;

-- 4. Find initiatives with duplicate phases
SELECT 
    ip.initiative_id,
    p.name as phase_name,
    COUNT(*) as duplicate_count
FROM initiative_phases ip
JOIN phases p ON ip.phase_id = p.id
GROUP BY ip.initiative_id, p.name
HAVING COUNT(*) > 1;

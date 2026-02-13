-- Script to fix duplicate phases in the database
-- This will:
-- 1. Delete duplicate initiative_phases records
-- 2. Delete duplicate phases from the phases table
-- 3. Add a unique constraint to prevent future duplicates

BEGIN;

-- Step 1: Delete duplicate initiative_phases
-- Keep only the phase with the lower ID for each (initiative_id, phase_name) combination
DELETE FROM initiative_phases ip
WHERE ip.id IN (
    SELECT ip2.id
    FROM initiative_phases ip2
    JOIN phases p ON ip2.phase_id = p.id
    WHERE ip2.id NOT IN (
        SELECT MIN(ip3.id)
        FROM initiative_phases ip3
        JOIN phases p2 ON ip3.phase_id = p2.id
        WHERE ip3.initiative_id = ip2.initiative_id
        AND p2.name = p.name
        GROUP BY ip3.initiative_id, p2.name
    )
);

-- Step 2: Delete duplicate phases from phases table
-- Keep only the phase with the lower ID for each name
DELETE FROM phases
WHERE id NOT IN (
    SELECT MIN(id)
    FROM phases
    GROUP BY name
);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE phases ADD CONSTRAINT phases_name_unique UNIQUE (name);

COMMIT;

-- Verify the fix
SELECT 'Phases after cleanup:' as message;
SELECT * FROM phases ORDER BY default_order;

SELECT 'Checking for remaining duplicates:' as message;
SELECT name, COUNT(*) as count
FROM phases
GROUP BY name
HAVING COUNT(*) > 1;

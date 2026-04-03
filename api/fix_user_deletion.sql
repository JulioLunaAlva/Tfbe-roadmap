-- 1. Drop existing constraints (if they exist) to avoid errors
DO $$ 
BEGIN 
    -- weekly_progress
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'weekly_progress_created_by_fkey') THEN
        ALTER TABLE weekly_progress DROP CONSTRAINT weekly_progress_created_by_fkey;
    END IF;

    -- audit_logs
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_user_id_fkey') THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
    END IF;

    -- initiative_milestones
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'initiative_milestones_created_by_fkey') THEN
        ALTER TABLE initiative_milestones DROP CONSTRAINT initiative_milestones_created_by_fkey;
    END IF;
END $$;

-- 2. Add new constraints with ON DELETE SET NULL
-- This ensures that if a user is deleted, the records they created remain in the system 
-- but their "created_by" or "user_id" field becomes NULL.

-- weekly_progress
ALTER TABLE weekly_progress 
ADD CONSTRAINT weekly_progress_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- audit_logs
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- initiative_milestones
ALTER TABLE initiative_milestones 
ADD CONSTRAINT initiative_milestones_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

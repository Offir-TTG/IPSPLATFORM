-- Fix duplicate user_progress records and update constraints
-- This script will:
-- 1. Show all duplicates
-- 2. Delete duplicates (keeping most recent)
-- 3. Update the unique constraint to prevent future duplicates

-- STEP 1: Find and display duplicates
SELECT
  user_id,
  lesson_id,
  enrollment_id,
  COUNT(*) as duplicate_count
FROM user_progress
GROUP BY user_id, lesson_id, enrollment_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- STEP 2: Delete duplicates, keeping only the most recent record
-- for each (user_id, lesson_id, enrollment_id) combination
WITH ranked_progress AS (
  SELECT
    id,
    user_id,
    lesson_id,
    enrollment_id,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, lesson_id, enrollment_id
      ORDER BY
        -- Prioritize completed status, then most recent
        CASE WHEN status = 'completed' THEN 1
             WHEN status = 'in_progress' THEN 2
             ELSE 3
        END,
        created_at DESC,
        updated_at DESC
    ) as rn
  FROM user_progress
)
DELETE FROM user_progress
WHERE id IN (
  SELECT id
  FROM ranked_progress
  WHERE rn > 1
);

-- STEP 3: Update the UNIQUE constraint
-- Drop the old constraint that only has (user_id, lesson_id)
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_user_id_lesson_id_key;

-- Add new constraint with enrollment_id included
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_user_lesson_enrollment_key
UNIQUE (user_id, lesson_id, enrollment_id);

-- STEP 4: Verify - this should return 0 rows
SELECT
  user_id,
  lesson_id,
  enrollment_id,
  COUNT(*) as count
FROM user_progress
GROUP BY user_id, lesson_id, enrollment_id
HAVING COUNT(*) > 1;

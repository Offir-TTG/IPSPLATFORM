-- ============================================================================
-- Create Proper Unique Constraint for Translations
-- ============================================================================
-- This replaces partial indexes with a single unique constraint that Supabase
-- can use for upsert operations
-- Date: 2025-12-12

-- Step 1: Drop the partial indexes (they don't work with Supabase upsert)
DROP INDEX IF EXISTS translations_unique_with_tenant;
DROP INDEX IF EXISTS translations_unique_global;

-- Step 2: Drop any old constraints
ALTER TABLE translations DROP CONSTRAINT IF EXISTS translations_tenant_language_key_unique;
ALTER TABLE translations DROP CONSTRAINT IF EXISTS translations_language_code_translation_key_key;

-- Step 3: Create a proper unique constraint that includes all 4 columns
-- Note: This will fail if there are any duplicate rows
-- If it fails, you'll need to clean up duplicates first
ALTER TABLE translations
ADD CONSTRAINT translations_unique_key_lang_context_tenant
UNIQUE (translation_key, language_code, context, tenant_id);

-- Step 4: Verify the constraint was created
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'translations'::regclass
  AND contype = 'u';

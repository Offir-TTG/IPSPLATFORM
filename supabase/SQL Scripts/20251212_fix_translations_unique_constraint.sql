-- ============================================================================
-- Fix Translations Table Unique Constraint
-- ============================================================================
-- Description: Replace the old 3-column constraint with proper context-aware constraints
-- This fixes the issue where upserts fail because the constraint doesn't include context
-- Date: 2025-12-12

-- Step 1: Drop the old constraint that doesn't include context
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'translations_tenant_language_key_unique'
    ) THEN
        ALTER TABLE translations DROP CONSTRAINT translations_tenant_language_key_unique;
        RAISE NOTICE 'Dropped old constraint: translations_tenant_language_key_unique';
    END IF;
END $$;

-- Step 2: Drop the old language_code + translation_key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'translations_language_code_translation_key_key'
    ) THEN
        ALTER TABLE translations DROP CONSTRAINT translations_language_code_translation_key_key;
        RAISE NOTICE 'Dropped old constraint: translations_language_code_translation_key_key';
    END IF;
END $$;

-- Step 3: Create the correct unique indexes with context
-- For tenant-specific translations (tenant_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_with_tenant
ON translations (translation_key, language_code, context, tenant_id)
WHERE tenant_id IS NOT NULL;

-- For global translations (tenant_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_global
ON translations (translation_key, language_code, context)
WHERE tenant_id IS NULL;

-- Step 4: Verify the indexes were created
DO $$
DECLARE
    idx_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE tablename = 'translations'
      AND indexname IN ('translations_unique_with_tenant', 'translations_unique_global');

    IF idx_count = 2 THEN
        RAISE NOTICE 'SUCCESS: Both unique indexes created successfully';
    ELSE
        RAISE WARNING 'Only % of 2 expected indexes were created', idx_count;
    END IF;
END $$;

-- Step 5: Add helpful comments
COMMENT ON INDEX translations_unique_with_tenant IS 'Ensures uniqueness for tenant-specific translations based on key, language, context, and tenant_id';
COMMENT ON INDEX translations_unique_global IS 'Ensures uniqueness for global translations (NULL tenant_id) based on key, language, and context';

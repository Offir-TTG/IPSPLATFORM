-- FIX: Update translations table unique constraint to support multi-tenancy
-- This is why payment translations weren't inserting!

-- Step 1: Drop the OLD incorrect constraint
ALTER TABLE translations
DROP CONSTRAINT IF EXISTS translations_language_code_translation_key_key;

-- Step 2: Add the CORRECT multi-tenant constraint
ALTER TABLE translations
ADD CONSTRAINT translations_tenant_language_key_unique
UNIQUE (tenant_id, language_code, translation_key);

-- Step 3: Verify the new constraint
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'translations'::regclass
AND contype = 'u';

-- ============================================================================
-- Allow NULL tenant_id for Global Translations
-- ============================================================================
-- Description: Modify translations table to allow NULL tenant_id for global translations
-- This enables translations that work across all tenants
-- Author: Claude Code Assistant
-- Date: 2025-11-27

-- Step 1: Make tenant_id nullable
ALTER TABLE translations
ALTER COLUMN tenant_id DROP NOT NULL;

-- Step 2: Update the unique constraint to include NULL values properly
-- First, drop existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'translations_key_lang_context_tenant_unique'
    ) THEN
        ALTER TABLE translations DROP CONSTRAINT translations_key_lang_context_tenant_unique;
    END IF;
END $$;

-- Add a unique constraint that properly handles NULL tenant_id
-- This allows multiple translations with the same key/language/context but different tenants
-- AND allows global translations (NULL tenant_id) to coexist
CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_with_tenant
ON translations (translation_key, language_code, context, tenant_id)
WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_global
ON translations (translation_key, language_code, context)
WHERE tenant_id IS NULL;

COMMENT ON COLUMN translations.tenant_id IS 'Tenant ID for tenant-specific translations, or NULL for global translations';

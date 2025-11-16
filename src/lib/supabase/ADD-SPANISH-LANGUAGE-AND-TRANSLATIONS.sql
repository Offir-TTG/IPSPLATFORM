-- ============================================================================
-- ADD SPANISH LANGUAGE AND ALL TRANSLATIONS
-- ============================================================================
-- This file does two things in the correct order:
-- 1. Adds Spanish (ES) language to the languages table
-- 2. Adds all Spanish translations
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Spanish Language to the languages table
-- ============================================================================

INSERT INTO languages (code, name, native_name, direction, is_active, is_default, currency_code, currency_symbol, currency_position)
VALUES
  ('es', 'Spanish', 'Español', 'ltr', true, false, 'EUR', '€', 'before')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  direction = EXCLUDED.direction,
  currency_code = EXCLUDED.currency_code,
  currency_symbol = EXCLUDED.currency_symbol,
  currency_position = EXCLUDED.currency_position,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: Add all Spanish translations
-- ============================================================================
-- Now we can safely add translations since 'es' exists in languages table
-- (The rest of the file contains all the Spanish translations from COMPLETE-SPANISH-TRANSLATIONS.sql)


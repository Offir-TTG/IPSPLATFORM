-- ============================================================================
-- Debug Script: Check Keap Translations and Tenant Configuration
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose the translation issue
-- ============================================================================

-- 1. Check if Keap translations exist in database
SELECT
  'Keap Translations Count' as check_name,
  tenant_id,
  language_code,
  COUNT(*) as translation_count
FROM translations
WHERE translation_key LIKE '%keap%'
GROUP BY tenant_id, language_code
ORDER BY tenant_id, language_code;

-- 2. Show sample Keap translations
SELECT
  'Sample Keap Translations' as check_name,
  tenant_id,
  language_code,
  translation_key,
  LEFT(translation_value, 50) as translation_value_preview,
  context
FROM translations
WHERE translation_key LIKE '%keap%'
ORDER BY language_code, translation_key
LIMIT 10;

-- 3. Check all tenant_ids in translations table
SELECT
  'All Tenant IDs in Translations' as check_name,
  tenant_id,
  COUNT(*) as translation_count
FROM translations
GROUP BY tenant_id
ORDER BY translation_count DESC;

-- 4. Check if there's a default tenant
SELECT
  'Tenants Table' as check_name,
  id as tenant_id,
  name as tenant_name,
  slug as tenant_slug
FROM tenants
ORDER BY created_at
LIMIT 5;

-- 5. Check users table for tenant_id
SELECT
  'Users Tenant Assignment' as check_name,
  tenant_id,
  COUNT(*) as user_count
FROM users
GROUP BY tenant_id
ORDER BY user_count DESC
LIMIT 5;

-- 6. Check what context Keap translations have
SELECT
  'Keap Translation Contexts' as check_name,
  context,
  COUNT(*) as count
FROM translations
WHERE translation_key LIKE '%keap%'
GROUP BY context;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Query 1: Should show tenant_id '70d86807-7e7c-49cd-8601-98235444e2ac' with 51 he + 51 en translations
-- Query 2: Should show sample translations like 'admin.keap.dashboard.title', 'admin.keap.tags.title', etc.
-- Query 3: Should show the distribution of translations across tenants
-- Query 4: Should show available tenants
-- Query 5: Should show which tenant your users belong to
-- Query 6: Should show context='admin' for all Keap translations
-- ============================================================================

-- ============================================================================
-- CLEANUP PLATFORM NAVIGATION TRANSLATIONS
-- ============================================================================
-- This file removes old platform navigation translations that are no longer needed
-- since platform management has been separated to /superadmin
-- ============================================================================

-- Remove platform navigation translation values
DELETE FROM public.translations
WHERE translation_key IN (
  'admin.nav.platform',
  'admin.nav.platformOverview',
  'admin.nav.tenants'
);

-- Remove platform navigation translation keys
DELETE FROM public.translation_keys
WHERE key IN (
  'admin.nav.platform',
  'admin.nav.platformOverview',
  'admin.nav.tenants'
);

-- Remove from wrong tables if they exist
DELETE FROM ui_text_values
WHERE text_key IN ('admin.nav.platform', 'admin.nav.platformOverview', 'admin.nav.tenants');

DELETE FROM ui_text_config
WHERE key IN ('admin.nav.platform', 'admin.nav.platformOverview', 'admin.nav.tenants');

-- ============================================================================
-- DONE! Old platform navigation translations removed.
-- ============================================================================

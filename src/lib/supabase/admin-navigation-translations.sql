-- ============================================================================
-- Admin Navigation Translations
-- ============================================================================
-- This file contains translations for ALL sidebar navigation items
-- to match with their corresponding page titles
--
-- IMPORTANT: Navigation keys (admin.nav.*) should match page titles for consistency
-- ============================================================================

-- First, add the translation keys
INSERT INTO translation_keys (key, context, description, category)
VALUES
  -- Navigation Sections
  ('admin.nav.overview', 'admin', 'Overview section title in navigation', 'admin'),
  ('admin.nav.configuration', 'admin', 'Configuration section title in navigation', 'admin'),
  ('admin.nav.content', 'admin', 'Content section title in navigation', 'admin'),
  ('admin.nav.business', 'admin', 'Business section title in navigation', 'admin'),

  -- Navigation Items
  ('admin.nav.dashboard', 'admin', 'Dashboard navigation link', 'admin'),
  ('admin.nav.languages', 'admin', 'Languages navigation link', 'admin'),
  ('admin.nav.translations', 'admin', 'Translations navigation link', 'admin'),
  ('admin.nav.settings', 'admin', 'Settings navigation link', 'admin'),
  ('admin.nav.theme', 'admin', 'Theme navigation link', 'admin'),
  ('admin.nav.features', 'admin', 'Features navigation link', 'admin'),
  ('admin.nav.integrations', 'admin', 'Integrations navigation link', 'admin'),
  ('admin.nav.navigation', 'admin', 'Navigation navigation link', 'admin'),
  ('admin.nav.programs', 'admin', 'Programs navigation link', 'admin'),
  ('admin.nav.courses', 'admin', 'Courses navigation link', 'admin'),
  ('admin.nav.users', 'admin', 'Users navigation link', 'admin'),
  ('admin.nav.payments', 'admin', 'Payments navigation link', 'admin'),
  ('admin.nav.emails', 'admin', 'Emails navigation link', 'admin')
ON CONFLICT (key) DO NOTHING;

-- Hebrew translations
INSERT INTO translations (language_code, translation_key, translation_value, category)
VALUES
  -- Navigation Sections - Hebrew
  ('he', 'admin.nav.overview', 'סקירה כללית', 'admin'),
  ('he', 'admin.nav.configuration', 'תצורה', 'admin'),
  ('he', 'admin.nav.content', 'תוכן', 'admin'),
  ('he', 'admin.nav.business', 'עסקים', 'admin'),

  -- Navigation Items - Hebrew (matching page titles)
  ('he', 'admin.nav.dashboard', 'לוח בקרה', 'admin'),
  ('he', 'admin.nav.languages', 'שפות', 'admin'),
  ('he', 'admin.nav.translations', 'תרגומים', 'admin'),
  ('he', 'admin.nav.settings', 'הגדרות פלטפורמה', 'admin'),
  ('he', 'admin.nav.theme', 'ערכת נושא ועיצוב', 'admin'),
  ('he', 'admin.nav.features', 'תכונות', 'admin'),
  ('he', 'admin.nav.integrations', 'אינטגרציות', 'admin'),
  ('he', 'admin.nav.navigation', 'ניווט', 'admin'),
  ('he', 'admin.nav.programs', 'תוכניות', 'admin'),
  ('he', 'admin.nav.courses', 'קורסים', 'admin'),
  ('he', 'admin.nav.users', 'משתמשים', 'admin'),
  ('he', 'admin.nav.payments', 'תשלומים', 'admin'),
  ('he', 'admin.nav.emails', 'מיילים', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- English translations
INSERT INTO translations (language_code, translation_key, translation_value, category)
VALUES
  -- Navigation Sections - English
  ('en', 'admin.nav.overview', 'Overview', 'admin'),
  ('en', 'admin.nav.configuration', 'Configuration', 'admin'),
  ('en', 'admin.nav.content', 'Content', 'admin'),
  ('en', 'admin.nav.business', 'Business', 'admin'),

  -- Navigation Items - English (matching page titles)
  ('en', 'admin.nav.dashboard', 'Dashboard', 'admin'),
  ('en', 'admin.nav.languages', 'Languages', 'admin'),
  ('en', 'admin.nav.translations', 'Translations', 'admin'),
  ('en', 'admin.nav.settings', 'Platform Settings', 'admin'),
  ('en', 'admin.nav.theme', 'Theme & Design', 'admin'),
  ('en', 'admin.nav.features', 'Features', 'admin'),
  ('en', 'admin.nav.integrations', 'Integrations', 'admin'),
  ('en', 'admin.nav.navigation', 'Navigation', 'admin'),
  ('en', 'admin.nav.programs', 'Programs', 'admin'),
  ('en', 'admin.nav.courses', 'Courses', 'admin'),
  ('en', 'admin.nav.users', 'Users', 'admin'),
  ('en', 'admin.nav.payments', 'Payments', 'admin'),
  ('en', 'admin.nav.emails', 'Emails', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- Page Title Translations (to ensure they match navigation)
-- ============================================================================

-- Add page title translation keys
INSERT INTO translation_keys (key, context, description, category)
VALUES
  ('admin.settings.title', 'admin', 'Platform Settings page title', 'admin'),
  ('admin.settings.subtitle', 'admin', 'Platform Settings page subtitle', 'admin')
ON CONFLICT (key) DO NOTHING;

-- Hebrew page title translations
INSERT INTO translations (language_code, translation_key, translation_value, category)
VALUES
  ('he', 'admin.settings.title', 'הגדרות פלטפורמה', 'admin'),
  ('he', 'admin.settings.subtitle', 'נהל את הגדרות הפלטפורמה והתצורה', 'admin'),
  ('he', 'admin.theme.title', 'ערכת נושא ועיצוב', 'admin'),
  ('he', 'admin.theme.subtitle', 'התאם אישית צבעים ומראה חזותי', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- English page title translations
INSERT INTO translations (language_code, translation_key, translation_value, category)
VALUES
  ('en', 'admin.settings.title', 'Platform Settings', 'admin'),
  ('en', 'admin.settings.subtitle', 'Manage platform configuration and settings', 'admin'),
  ('en', 'admin.theme.title', 'Theme & Design', 'admin'),
  ('en', 'admin.theme.subtitle', 'Customize colors and visual appearance', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- Verification query - run this to check all navigation translations
-- SELECT
--   tk.key,
--   tk.description,
--   t_en.translation_value as english,
--   t_he.translation_value as hebrew
-- FROM translation_keys tk
-- LEFT JOIN translations t_en ON t_en.translation_key = tk.key AND t_en.language_code = 'en'
-- LEFT JOIN translations t_he ON t_he.translation_key = tk.key AND t_he.language_code = 'he'
-- WHERE tk.key LIKE 'admin.nav.%' OR tk.key LIKE 'admin.%.title'
-- ORDER BY tk.key;

-- ============================================================================
-- AUDIT TRAIL NAVIGATION TRANSLATIONS
-- ============================================================================
-- This file adds the necessary translations for the audit trail navigation
-- in the admin sidebar
-- ============================================================================

-- Add translation keys
INSERT INTO public.translation_keys (key, category, description, context) VALUES
  ('admin.nav.security', 'admin', 'Security & Compliance section title in navigation', 'admin'),
  ('admin.nav.audit', 'admin', 'Audit Trail navigation link', 'admin')
ON CONFLICT (key) DO NOTHING;

-- Add translations
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Hebrew
  ('he', 'admin.nav.security', 'אבטחה ותאימות', 'admin', 'admin'),
  ('he', 'admin.nav.audit', 'מעקב ביקורת', 'admin', 'admin'),

  -- English
  ('en', 'admin.nav.security', 'Security & Compliance', 'admin', 'admin'),
  ('en', 'admin.nav.audit', 'Audit Trail', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO NOTHING;

-- ============================================================================
-- DONE! Audit trail navigation translations added.
-- ============================================================================

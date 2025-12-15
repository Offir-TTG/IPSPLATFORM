-- ============================================================================
-- Admin User Gear Menu Translations
-- ============================================================================
-- This file contains translations for the new user gear menu in the admin panel
-- ============================================================================

-- Clean up existing translations if any
DELETE FROM translations WHERE translation_key IN (
  'admin.nav.profile',
  'admin.nav.manageAccount',
  'admin.nav.organization',
  'admin.nav.organizationSettings',
  'admin.nav.auditLog',
  'admin.nav.viewActivity',
  'nav.logout',
  'nav.signOut'
);

-- Insert translations
INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  -- English translations
  ('admin.nav.profile', 'en', 'Profile & Settings', 'admin', NULL),
  ('admin.nav.manageAccount', 'en', 'Manage your account', 'admin', NULL),
  ('admin.nav.organization', 'en', 'Organization', 'admin', NULL),
  ('admin.nav.organizationSettings', 'en', 'Manage organization', 'admin', NULL),
  ('admin.nav.auditLog', 'en', 'Audit Log', 'admin', NULL),
  ('admin.nav.viewActivity', 'en', 'View activity logs', 'admin', NULL),
  ('nav.logout', 'en', 'Log out', 'admin', NULL),
  ('nav.signOut', 'en', 'Sign out of your account', 'admin', NULL),

  -- Hebrew translations
  ('admin.nav.profile', 'he', 'פרופיל והגדרות', 'admin', NULL),
  ('admin.nav.manageAccount', 'he', 'נהל את החשבון שלך', 'admin', NULL),
  ('admin.nav.organization', 'he', 'ארגון', 'admin', NULL),
  ('admin.nav.organizationSettings', 'he', 'נהל ארגון', 'admin', NULL),
  ('admin.nav.auditLog', 'he', 'יומן ביקורת', 'admin', NULL),
  ('admin.nav.viewActivity', 'he', 'צפה ביומני פעילות', 'admin', NULL),
  ('nav.logout', 'he', 'התנתק', 'admin', NULL),
  ('nav.signOut', 'he', 'התנתק מהחשבון שלך', 'admin', NULL),

  -- Spanish translations
  ('admin.nav.profile', 'es', 'Perfil y Configuración', 'admin', NULL),
  ('admin.nav.manageAccount', 'es', 'Administrar tu cuenta', 'admin', NULL),
  ('admin.nav.organization', 'es', 'Organización', 'admin', NULL),
  ('admin.nav.organizationSettings', 'es', 'Administrar organización', 'admin', NULL),
  ('admin.nav.auditLog', 'es', 'Registro de Auditoría', 'admin', NULL),
  ('admin.nav.viewActivity', 'es', 'Ver registros de actividad', 'admin', NULL),
  ('nav.logout', 'es', 'Cerrar sesión', 'admin', NULL),
  ('nav.signOut', 'es', 'Cerrar sesión de tu cuenta', 'admin', NULL);

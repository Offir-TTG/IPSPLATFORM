-- Complete Admin Translations - All Missing Keys
-- Run this file to add all missing translation keys for admin pages

-- ============================================================================
-- LANGUAGE MANAGEMENT PAGE
-- ============================================================================

INSERT INTO public.translation_keys (key, category, description) VALUES
  ('admin.languages.title', 'admin', 'Language Management page title'),
  ('admin.languages.subtitle', 'admin', 'Language Management page subtitle'),
  ('admin.languages.addLanguage', 'admin', 'Add language button'),
  ('admin.languages.code', 'admin', 'Language code label'),
  ('admin.languages.direction', 'admin', 'Text direction label'),
  ('admin.languages.directionLtr', 'admin', 'LTR direction text'),
  ('admin.languages.directionRtl', 'admin', 'RTL direction text'),
  ('admin.languages.active', 'admin', 'Active status'),
  ('admin.languages.inactive', 'admin', 'Inactive status'),
  ('admin.languages.default', 'admin', 'Default language'),
  ('admin.languages.setDefault', 'admin', 'Set as default button'),
  ('admin.languages.setDefaultTitle', 'admin', 'Set as default tooltip'),
  ('admin.languages.toggleActive', 'admin', 'Toggle active/inactive'),
  ('admin.languages.editTitle', 'admin', 'Edit tooltip'),
  ('admin.languages.deleteTitle', 'admin', 'Delete tooltip'),
  ('admin.languages.deleteConfirm', 'admin', 'Delete confirmation message'),
  ('admin.languages.hide', 'admin', 'Hide/deactivate button'),
  ('admin.languages.show', 'admin', 'Show/activate button'),

  -- Modal
  ('admin.languages.modal.add', 'admin', 'Add language modal title'),
  ('admin.languages.modal.edit', 'admin', 'Edit language modal title'),

  -- Form
  ('admin.languages.form.code', 'admin', 'Language code field'),
  ('admin.languages.form.codeHint', 'admin', 'Code field hint'),
  ('admin.languages.form.name', 'admin', 'English name field'),
  ('admin.languages.form.nativeName', 'admin', 'Native name field'),
  ('admin.languages.form.direction', 'admin', 'Text direction field'),
  ('admin.languages.form.directionLtr', 'admin', 'LTR option'),
  ('admin.languages.form.directionRtl', 'admin', 'RTL option'),
  ('admin.languages.form.active', 'admin', 'Active checkbox'),
  ('admin.languages.form.default', 'admin', 'Default checkbox')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.translations (language_code, translation_key, translation_value, category) VALUES
  -- Hebrew
  ('he', 'admin.languages.title', 'ניהול שפות', 'admin'),
  ('he', 'admin.languages.subtitle', 'נהל שפות זמינות בפלטפורמה', 'admin'),
  ('he', 'admin.languages.addLanguage', 'הוסף שפה', 'admin'),
  ('he', 'admin.languages.code', 'קוד', 'admin'),
  ('he', 'admin.languages.direction', 'כיוון', 'admin'),
  ('he', 'admin.languages.directionLtr', 'שמאל לימין ←', 'admin'),
  ('he', 'admin.languages.directionRtl', 'ימין לשמאל ←', 'admin'),
  ('he', 'admin.languages.active', 'פעיל', 'admin'),
  ('he', 'admin.languages.inactive', 'לא פעיל', 'admin'),
  ('he', 'admin.languages.default', 'ברירת מחדל', 'admin'),
  ('he', 'admin.languages.setDefault', 'ברירת מחדל', 'admin'),
  ('he', 'admin.languages.setDefaultTitle', 'הגדר כברירת מחדל', 'admin'),
  ('he', 'admin.languages.toggleActive', 'שנה סטטוס', 'admin'),
  ('he', 'admin.languages.editTitle', 'ערוך', 'admin'),
  ('he', 'admin.languages.deleteTitle', 'מחק', 'admin'),
  ('he', 'admin.languages.deleteConfirm', 'האם אתה בטוח שברצונך למחוק שפה זו?', 'admin'),
  ('he', 'admin.languages.hide', 'הסתר', 'admin'),
  ('he', 'admin.languages.show', 'הצג', 'admin'),
  ('he', 'admin.languages.modal.add', 'הוסף שפה חדשה', 'admin'),
  ('he', 'admin.languages.modal.edit', 'ערוך שפה', 'admin'),
  ('he', 'admin.languages.form.code', 'קוד שפה', 'admin'),
  ('he', 'admin.languages.form.codeHint', 'קוד ISO 639-1 בן 2 תווים', 'admin'),
  ('he', 'admin.languages.form.name', 'שם באנגלית', 'admin'),
  ('he', 'admin.languages.form.nativeName', 'שם מקורי', 'admin'),
  ('he', 'admin.languages.form.direction', 'כיוון טקסט', 'admin'),
  ('he', 'admin.languages.form.directionLtr', 'שמאל לימין (LTR)', 'admin'),
  ('he', 'admin.languages.form.directionRtl', 'ימין לשמאל (RTL)', 'admin'),
  ('he', 'admin.languages.form.active', 'פעיל', 'admin'),
  ('he', 'admin.languages.form.default', 'שפת ברירת מחדל', 'admin'),

  -- English
  ('en', 'admin.languages.title', 'Language Management', 'admin'),
  ('en', 'admin.languages.subtitle', 'Manage available platform languages', 'admin'),
  ('en', 'admin.languages.addLanguage', 'Add Language', 'admin'),
  ('en', 'admin.languages.code', 'Code', 'admin'),
  ('en', 'admin.languages.direction', 'Direction', 'admin'),
  ('en', 'admin.languages.directionLtr', 'Left to Right →', 'admin'),
  ('en', 'admin.languages.directionRtl', 'Right to Left ←', 'admin'),
  ('en', 'admin.languages.active', 'Active', 'admin'),
  ('en', 'admin.languages.inactive', 'Inactive', 'admin'),
  ('en', 'admin.languages.default', 'Default', 'admin'),
  ('en', 'admin.languages.setDefault', 'Default', 'admin'),
  ('en', 'admin.languages.setDefaultTitle', 'Set as default', 'admin'),
  ('en', 'admin.languages.toggleActive', 'Toggle status', 'admin'),
  ('en', 'admin.languages.editTitle', 'Edit', 'admin'),
  ('en', 'admin.languages.deleteTitle', 'Delete', 'admin'),
  ('en', 'admin.languages.deleteConfirm', 'Are you sure you want to delete this language?', 'admin'),
  ('en', 'admin.languages.hide', 'Hide', 'admin'),
  ('en', 'admin.languages.show', 'Show', 'admin'),
  ('en', 'admin.languages.modal.add', 'Add New Language', 'admin'),
  ('en', 'admin.languages.modal.edit', 'Edit Language', 'admin'),
  ('en', 'admin.languages.form.code', 'Language Code', 'admin'),
  ('en', 'admin.languages.form.codeHint', '2-letter ISO 639-1 code', 'admin'),
  ('en', 'admin.languages.form.name', 'English Name', 'admin'),
  ('en', 'admin.languages.form.nativeName', 'Native Name', 'admin'),
  ('en', 'admin.languages.form.direction', 'Text Direction', 'admin'),
  ('en', 'admin.languages.form.directionLtr', 'Left to Right (LTR)', 'admin'),
  ('en', 'admin.languages.form.directionRtl', 'Right to Left (RTL)', 'admin'),
  ('en', 'admin.languages.form.active', 'Active', 'admin'),
  ('en', 'admin.languages.form.default', 'Default Language', 'admin')
ON CONFLICT (language_code, translation_key) DO NOTHING;

-- ============================================================================
-- COMMON TRANSLATIONS (used across all admin pages)
-- ============================================================================

INSERT INTO public.translation_keys (key, category, description) VALUES
  ('common.saving', 'common', 'Saving state'),
  ('common.noData', 'common', 'No data available'),
  ('common.error', 'common', 'Error message'),
  ('common.success', 'common', 'Success message')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.translations (language_code, translation_key, translation_value, category) VALUES
  ('he', 'common.saving', 'שומר...', 'common'),
  ('he', 'common.noData', 'אין מידע זמין', 'common'),
  ('he', 'common.error', 'שגיאה', 'common'),
  ('he', 'common.success', 'הצלחה', 'common'),

  ('en', 'common.saving', 'Saving...', 'common'),
  ('en', 'common.noData', 'No data available', 'common'),
  ('en', 'common.error', 'Error', 'common'),
  ('en', 'common.success', 'Success', 'common')
ON CONFLICT (language_code, translation_key) DO NOTHING;

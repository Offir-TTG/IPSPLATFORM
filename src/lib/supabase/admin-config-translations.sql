-- ============================================================================
-- Admin Configuration Pages Translations (Settings & Languages)
-- ============================================================================

-- Step 1: Insert translation keys
INSERT INTO translation_keys (key, category, description, context)
VALUES
  -- Platform Settings Page
  ('admin.settings.title', 'admin', 'Platform Settings page title', 'admin'),
  ('admin.settings.subtitle', 'admin', 'Platform Settings page subtitle', 'admin'),
  ('admin.settings.empty', 'admin', 'No settings message', 'admin'),
  ('admin.settings.info.title', 'admin', 'Info note title', 'admin'),
  ('admin.settings.info.message', 'admin', 'Info note message about changes', 'admin'),
  ('admin.settings.category.branding', 'admin', 'Branding category name', 'admin'),
  ('admin.settings.category.branding.description', 'admin', 'Branding category description', 'admin'),
  ('admin.settings.category.theme', 'admin', 'Theme category name', 'admin'),
  ('admin.settings.category.theme.description', 'admin', 'Theme category description', 'admin'),
  ('admin.settings.category.business', 'admin', 'Business category name', 'admin'),
  ('admin.settings.category.business.description', 'admin', 'Business category description', 'admin'),
  ('admin.settings.category.contact', 'admin', 'Contact category name', 'admin'),
  ('admin.settings.category.contact.description', 'admin', 'Contact category description', 'admin'),

  -- Language Management Page
  ('admin.languages.title', 'admin', 'Languages page title', 'admin'),
  ('admin.languages.subtitle', 'admin', 'Languages page subtitle', 'admin'),
  ('admin.languages.add', 'admin', 'Add Language button', 'admin'),
  ('admin.languages.edit', 'admin', 'Edit Language title', 'admin'),
  ('admin.languages.default', 'admin', 'Default language badge', 'admin'),
  ('admin.languages.active', 'admin', 'Active language badge', 'admin'),
  ('admin.languages.inactive', 'admin', 'Inactive language badge', 'admin'),
  ('admin.languages.code', 'admin', 'Language code label', 'admin'),
  ('admin.languages.direction', 'admin', 'Text direction label', 'admin'),
  ('admin.languages.directionRtl', 'admin', 'RTL direction text', 'admin'),
  ('admin.languages.directionLtr', 'admin', 'LTR direction text', 'admin'),
  ('admin.languages.currency', 'admin', 'Currency label', 'admin'),
  ('admin.languages.setDefaultTitle', 'admin', 'Set as default button title', 'admin'),
  ('admin.languages.setDefault', 'admin', 'Set as default button text', 'admin'),
  ('admin.languages.toggleActive', 'admin', 'Toggle active button title', 'admin'),
  ('admin.languages.hide', 'admin', 'Hide language button', 'admin'),
  ('admin.languages.show', 'admin', 'Show language button', 'admin'),
  ('admin.languages.editTitle', 'admin', 'Edit button title', 'admin'),
  ('admin.languages.deleteTitle', 'admin', 'Delete button title', 'admin'),
  ('admin.languages.empty', 'admin', 'No languages message', 'admin'),
  ('admin.languages.emptyDesc', 'admin', 'No languages description', 'admin'),
  ('admin.languages.confirmDelete', 'admin', 'Delete confirmation message', 'admin'),
  ('admin.languages.error.required', 'admin', 'Required fields error', 'admin'),
  ('admin.languages.error.codeLength', 'admin', 'Language code length error', 'admin'),
  ('admin.languages.form.code', 'admin', 'Language code form label', 'admin'),
  ('admin.languages.form.codeHint', 'admin', 'Language code hint', 'admin'),
  ('admin.languages.form.name', 'admin', 'English name form label', 'admin'),
  ('admin.languages.form.nativeName', 'admin', 'Native name form label', 'admin'),
  ('admin.languages.form.direction', 'admin', 'Direction form label', 'admin'),
  ('admin.languages.form.directionLtr', 'admin', 'LTR option text', 'admin'),
  ('admin.languages.form.directionRtl', 'admin', 'RTL option text', 'admin'),
  ('admin.languages.form.currency', 'admin', 'Currency form label', 'admin'),
  ('admin.languages.form.currencyHint', 'admin', 'Currency hint', 'admin'),
  ('admin.languages.form.active', 'admin', 'Active checkbox label', 'admin'),
  ('admin.languages.form.default', 'admin', 'Default checkbox label', 'admin'),

  -- Common buttons (if not already present)
  ('common.save', 'common', 'Save button', 'both'),
  ('common.saveAll', 'common', 'Save all button', 'both'),
  ('common.saving', 'common', 'Saving state', 'both'),
  ('common.cancel', 'common', 'Cancel button', 'both'),
  ('common.edit', 'common', 'Edit button', 'both')
ON CONFLICT (key) DO NOTHING;

-- Step 2: Insert Hebrew translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  -- Platform Settings Page (Hebrew)
  ('admin.settings.title', 'he', 'הגדרות פלטפורמה', 'admin', 'admin'),
  ('admin.settings.subtitle', 'he', 'הגדר את הגדרות הפלטפורמה', 'admin', 'admin'),
  ('admin.settings.empty', 'he', 'אין הגדרות שהוגדרו עדיין', 'admin', 'admin'),
  ('admin.settings.info.title', 'he', 'שים לב', 'admin', 'admin'),
  ('admin.settings.info.message', 'he', 'השינויים נכנסים לתוקף מיד בכל הפלטפורמה.', 'admin', 'admin'),
  ('admin.settings.category.branding', 'he', 'מיתוג', 'admin', 'admin'),
  ('admin.settings.category.branding.description', 'he', 'הגדר הגדרות מיתוג', 'admin', 'admin'),
  ('admin.settings.category.theme', 'he', 'ערכת נושא', 'admin', 'admin'),
  ('admin.settings.category.theme.description', 'he', 'הגדר הגדרות ערכת נושא', 'admin', 'admin'),
  ('admin.settings.category.business', 'he', 'עסק', 'admin', 'admin'),
  ('admin.settings.category.business.description', 'he', 'הגדר הגדרות עסק', 'admin', 'admin'),
  ('admin.settings.category.contact', 'he', 'יצירת קשר', 'admin', 'admin'),
  ('admin.settings.category.contact.description', 'he', 'הגדר הגדרות יצירת קשר', 'admin', 'admin'),

  -- Language Management Page (Hebrew)
  ('admin.languages.title', 'he', 'שפות', 'admin', 'admin'),
  ('admin.languages.subtitle', 'he', 'נהל שפות ותרגומים של הפלטפורמה', 'admin', 'admin'),
  ('admin.languages.add', 'he', 'הוסף שפה', 'admin', 'admin'),
  ('admin.languages.edit', 'he', 'ערוך שפה', 'admin', 'admin'),
  ('admin.languages.default', 'he', 'ברירת מחדל', 'admin', 'admin'),
  ('admin.languages.active', 'he', 'פעיל', 'admin', 'admin'),
  ('admin.languages.inactive', 'he', 'לא פעיל', 'admin', 'admin'),
  ('admin.languages.code', 'he', 'קוד', 'admin', 'admin'),
  ('admin.languages.direction', 'he', 'כיוון', 'admin', 'admin'),
  ('admin.languages.directionRtl', 'he', 'ימין לשמאל ←', 'admin', 'admin'),
  ('admin.languages.directionLtr', 'he', 'שמאל לימין →', 'admin', 'admin'),
  ('admin.languages.currency', 'he', 'מטבע', 'admin', 'admin'),
  ('admin.languages.setDefaultTitle', 'he', 'הגדר כברירת מחדל', 'admin', 'admin'),
  ('admin.languages.setDefault', 'he', 'ברירת מחדל', 'admin', 'admin'),
  ('admin.languages.toggleActive', 'he', 'החלף סטטוס', 'admin', 'admin'),
  ('admin.languages.hide', 'he', 'הסתר', 'admin', 'admin'),
  ('admin.languages.show', 'he', 'הצג', 'admin', 'admin'),
  ('admin.languages.editTitle', 'he', 'ערוך', 'admin', 'admin'),
  ('admin.languages.deleteTitle', 'he', 'מחק', 'admin', 'admin'),
  ('admin.languages.empty', 'he', 'אין שפות עדיין', 'admin', 'admin'),
  ('admin.languages.emptyDesc', 'he', 'הוסף את השפה הראשונה שלך כדי להתחיל', 'admin', 'admin'),
  ('admin.languages.confirmDelete', 'he', 'למחוק את {0}?', 'admin', 'admin'),
  ('admin.languages.error.required', 'he', 'כל השדות נדרשים', 'admin', 'admin'),
  ('admin.languages.error.codeLength', 'he', 'קוד השפה חייב להיות 2 תווים (ISO 639-1)', 'admin', 'admin'),
  ('admin.languages.form.code', 'he', 'קוד שפה', 'admin', 'admin'),
  ('admin.languages.form.codeHint', 'he', 'קוד ISO 639-1 בן 2 אותיות', 'admin', 'admin'),
  ('admin.languages.form.name', 'he', 'שם באנגלית', 'admin', 'admin'),
  ('admin.languages.form.nativeName', 'he', 'שם מקורי', 'admin', 'admin'),
  ('admin.languages.form.direction', 'he', 'כיוון טקסט', 'admin', 'admin'),
  ('admin.languages.form.directionLtr', 'he', 'שמאל לימין (LTR)', 'admin', 'admin'),
  ('admin.languages.form.directionRtl', 'he', 'ימין לשמאל (RTL)', 'admin', 'admin'),
  ('admin.languages.form.currency', 'he', 'מטבע', 'admin', 'admin'),
  ('admin.languages.form.currencyHint', 'he', 'מטבע ברירת המחדל עבור שפה זו', 'admin', 'admin'),
  ('admin.languages.form.active', 'he', 'פעיל', 'admin', 'admin'),
  ('admin.languages.form.default', 'he', 'שפת ברירת מחדל', 'admin', 'admin'),

  -- Common buttons (Hebrew)
  ('common.save', 'he', 'שמור', 'common', 'both'),
  ('common.saveAll', 'he', 'שמור את כל השינויים', 'common', 'both'),
  ('common.saving', 'he', 'שומר...', 'common', 'both'),
  ('common.cancel', 'he', 'ביטול', 'common', 'both'),
  ('common.edit', 'he', 'ערוך', 'common', 'both')
ON CONFLICT (translation_key, language_code)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  context = EXCLUDED.context,
  updated_at = NOW();

-- Step 3: Insert English translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  -- Platform Settings Page (English)
  ('admin.settings.title', 'en', 'Platform Settings', 'admin', 'admin'),
  ('admin.settings.subtitle', 'en', 'Configure platform-wide settings', 'admin', 'admin'),
  ('admin.settings.empty', 'en', 'No settings configured yet', 'admin', 'admin'),
  ('admin.settings.info.title', 'en', 'Note', 'admin', 'admin'),
  ('admin.settings.info.message', 'en', 'Changes take effect immediately across the platform.', 'admin', 'admin'),
  ('admin.settings.category.branding', 'en', 'Branding', 'admin', 'admin'),
  ('admin.settings.category.branding.description', 'en', 'Configure branding settings', 'admin', 'admin'),
  ('admin.settings.category.theme', 'en', 'Theme', 'admin', 'admin'),
  ('admin.settings.category.theme.description', 'en', 'Configure theme settings', 'admin', 'admin'),
  ('admin.settings.category.business', 'en', 'Business', 'admin', 'admin'),
  ('admin.settings.category.business.description', 'en', 'Configure business settings', 'admin', 'admin'),
  ('admin.settings.category.contact', 'en', 'Contact', 'admin', 'admin'),
  ('admin.settings.category.contact.description', 'en', 'Configure contact settings', 'admin', 'admin'),

  -- Language Management Page (English)
  ('admin.languages.title', 'en', 'Languages', 'admin', 'admin'),
  ('admin.languages.subtitle', 'en', 'Manage platform languages and translations', 'admin', 'admin'),
  ('admin.languages.add', 'en', 'Add Language', 'admin', 'admin'),
  ('admin.languages.edit', 'en', 'Edit Language', 'admin', 'admin'),
  ('admin.languages.default', 'en', 'Default', 'admin', 'admin'),
  ('admin.languages.active', 'en', 'Active', 'admin', 'admin'),
  ('admin.languages.inactive', 'en', 'Inactive', 'admin', 'admin'),
  ('admin.languages.code', 'en', 'Code', 'admin', 'admin'),
  ('admin.languages.direction', 'en', 'Direction', 'admin', 'admin'),
  ('admin.languages.directionRtl', 'en', 'RTL ←', 'admin', 'admin'),
  ('admin.languages.directionLtr', 'en', 'LTR →', 'admin', 'admin'),
  ('admin.languages.currency', 'en', 'Currency', 'admin', 'admin'),
  ('admin.languages.setDefaultTitle', 'en', 'Set as default', 'admin', 'admin'),
  ('admin.languages.setDefault', 'en', 'Default', 'admin', 'admin'),
  ('admin.languages.toggleActive', 'en', 'Toggle status', 'admin', 'admin'),
  ('admin.languages.hide', 'en', 'Hide', 'admin', 'admin'),
  ('admin.languages.show', 'en', 'Show', 'admin', 'admin'),
  ('admin.languages.editTitle', 'en', 'Edit', 'admin', 'admin'),
  ('admin.languages.deleteTitle', 'en', 'Delete', 'admin', 'admin'),
  ('admin.languages.empty', 'en', 'No languages yet', 'admin', 'admin'),
  ('admin.languages.emptyDesc', 'en', 'Add your first language to get started', 'admin', 'admin'),
  ('admin.languages.confirmDelete', 'en', 'Delete {0}?', 'admin', 'admin'),
  ('admin.languages.error.required', 'en', 'All fields are required', 'admin', 'admin'),
  ('admin.languages.error.codeLength', 'en', 'Language code must be 2 characters (ISO 639-1)', 'admin', 'admin'),
  ('admin.languages.form.code', 'en', 'Language Code', 'admin', 'admin'),
  ('admin.languages.form.codeHint', 'en', '2-letter ISO 639-1 code', 'admin', 'admin'),
  ('admin.languages.form.name', 'en', 'English Name', 'admin', 'admin'),
  ('admin.languages.form.nativeName', 'en', 'Native Name', 'admin', 'admin'),
  ('admin.languages.form.direction', 'en', 'Text Direction', 'admin', 'admin'),
  ('admin.languages.form.directionLtr', 'en', 'Left to Right (LTR)', 'admin', 'admin'),
  ('admin.languages.form.directionRtl', 'en', 'Right to Left (RTL)', 'admin', 'admin'),
  ('admin.languages.form.currency', 'en', 'Currency', 'admin', 'admin'),
  ('admin.languages.form.currencyHint', 'en', 'Default currency for this language', 'admin', 'admin'),
  ('admin.languages.form.active', 'en', 'Active', 'admin', 'admin'),
  ('admin.languages.form.default', 'en', 'Default Language', 'admin', 'admin'),

  -- Common buttons (English)
  ('common.save', 'en', 'Save', 'common', 'both'),
  ('common.saveAll', 'en', 'Save All Changes', 'common', 'both'),
  ('common.saving', 'en', 'Saving...', 'common', 'both'),
  ('common.cancel', 'en', 'Cancel', 'common', 'both'),
  ('common.edit', 'en', 'Edit', 'common', 'both')
ON CONFLICT (translation_key, language_code)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  context = EXCLUDED.context,
  updated_at = NOW();

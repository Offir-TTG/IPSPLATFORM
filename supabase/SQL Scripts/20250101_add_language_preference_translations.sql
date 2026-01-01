-- Add Hebrew translations for Language Preference Dialog
-- Run this script to add all necessary translations for the language preference feature

-- Language Preference Dialog translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  -- Main dialog labels
  ('user.profile.preferences.language', 'he', 'שפה', 'user', 'user'),
  ('user.profile.preferences.languageAuto', 'he', 'אוטומטי', 'user', 'user'),
  ('user.profile.preferences.selectLanguage', 'he', 'בחר את השפה המועדפת עליך', 'user', 'user'),
  ('user.profile.preferences.languageDescription', 'he', 'בחר את השפה שבה תרצה להשתמש בממשק. זה ידרוס את ברירת המחדל של הארגון.', 'user', 'user'),
  ('user.profile.preferences.languageAutoDescription', 'he', 'השתמש בהגדרת השפה המוגדרת כברירת מחדל של הארגון שלך', 'user', 'user'),
  ('user.profile.preferences.availableLanguages', 'he', 'שפות זמינות', 'user', 'user'),

  -- Success/Error messages
  ('user.profile.preferences.languageUpdated', 'he', 'העדפת השפה עודכנה בהצלחה', 'user', 'user'),
  ('user.profile.preferences.languageUpdateError', 'he', 'נכשל לעדכן את העדפת השפה', 'user', 'user'),

  -- Regional settings
  ('user.profile.preferences.regional_settings', 'he', 'הגדרות אזוריות', 'user', 'user'),
  ('user.profile.preferences.change', 'he', 'שנה', 'user', 'user'),
  ('user.profile.preferences.timezone', 'he', 'אזור זמן', 'user', 'user'),

  -- Language-specific descriptions
  ('user.profile.preferences.languageDescription.en', 'he', 'הצג את הממשק באנגלית', 'user', 'user'),
  ('user.profile.preferences.languageDescription.he', 'he', 'הצג את הממשק בעברית', 'user', 'user'),
  ('user.profile.preferences.languageDescription.es', 'he', 'הצג את הממשק בספרדית', 'user', 'user'),
  ('user.profile.preferences.languageDescription.fr', 'he', 'הצג את הממשק בצרפתית', 'user', 'user'),

  -- Common buttons (if not already exist)
  ('common.cancel', 'he', 'ביטול', 'common', 'user'),
  ('common.save', 'he', 'שמור שינויים', 'common', 'user'),
  ('common.saving', 'he', 'שומר...', 'common', 'user')
ON CONFLICT (translation_key, language_code)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  updated_at = NOW();

-- Also add English translations as fallback (if not already exist)
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('user.profile.preferences.language', 'en', 'Language', 'user', 'user'),
  ('user.profile.preferences.languageAuto', 'en', 'Auto', 'user', 'user'),
  ('user.profile.preferences.selectLanguage', 'en', 'Select Your Preferred Language', 'user', 'user'),
  ('user.profile.preferences.languageDescription', 'en', 'Choose the language you want to use for the interface. This will override the organization default.', 'user', 'user'),
  ('user.profile.preferences.languageAutoDescription', 'en', 'Use your organization''s default language setting', 'user', 'user'),
  ('user.profile.preferences.availableLanguages', 'en', 'Available Languages', 'user', 'user'),
  ('user.profile.preferences.languageUpdated', 'en', 'Language preference updated successfully', 'user', 'user'),
  ('user.profile.preferences.languageUpdateError', 'en', 'Failed to update language preference', 'user', 'user'),
  ('user.profile.preferences.regional_settings', 'en', 'Regional Settings', 'user', 'user'),
  ('user.profile.preferences.change', 'en', 'Change', 'user', 'user'),
  ('user.profile.preferences.timezone', 'en', 'Timezone', 'user', 'user'),
  ('user.profile.preferences.languageDescription.en', 'en', 'Display interface in English', 'user', 'user'),
  ('user.profile.preferences.languageDescription.he', 'en', 'Display interface in Hebrew', 'user', 'user'),
  ('user.profile.preferences.languageDescription.es', 'en', 'Display interface in Spanish', 'user', 'user'),
  ('user.profile.preferences.languageDescription.fr', 'en', 'Display interface in French', 'user', 'user'),
  ('common.cancel', 'en', 'Cancel', 'common', 'user'),
  ('common.save', 'en', 'Save Changes', 'common', 'user'),
  ('common.saving', 'en', 'Saving...', 'common', 'user')
ON CONFLICT (translation_key, language_code)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  updated_at = NOW();

-- Verify the translations were added
SELECT
  translation_key,
  language_code,
  translation_value
FROM translations
WHERE translation_key LIKE 'user.profile.preferences.language%'
   OR translation_key IN ('common.cancel', 'common.save', 'common.saving')
ORDER BY translation_key, language_code;

-- Translations for Language Selector Dropdown
-- Add translations for the new dropdown selector with auto-fill functionality

-- Insert translation keys
INSERT INTO translation_keys (key, category, description, context)
VALUES
  ('admin.languages.form.selectLanguage', 'admin', 'Placeholder for language dropdown', 'admin'),
  ('admin.languages.form.popularLanguages', 'admin', 'Label for popular languages optgroup', 'admin'),
  ('admin.languages.form.otherLanguages', 'admin', 'Label for other languages optgroup', 'admin'),
  ('admin.languages.form.selectHint', 'admin', 'Hint text for language selector', 'admin')
ON CONFLICT (key) DO NOTHING;

-- English translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.form.selectLanguage', 'en', 'Select a language...', 'admin', 'admin'),
  ('admin.languages.form.popularLanguages', 'en', 'Popular Languages', 'admin', 'admin'),
  ('admin.languages.form.otherLanguages', 'en', 'Other Languages', 'admin', 'admin'),
  ('admin.languages.form.selectHint', 'en', 'Selecting a language will auto-fill the form', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- Hebrew translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.form.selectLanguage', 'he', 'בחר שפה...', 'admin', 'admin'),
  ('admin.languages.form.popularLanguages', 'he', 'שפות פופולריות', 'admin', 'admin'),
  ('admin.languages.form.otherLanguages', 'he', 'שפות נוספות', 'admin', 'admin'),
  ('admin.languages.form.selectHint', 'he', 'בחירת שפה תמלא אוטומטית את הטופס', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

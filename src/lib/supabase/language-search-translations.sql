-- Translations for Language Search Dropdown
-- Add translations for the searchable dropdown in the language selector

-- Insert translation keys
INSERT INTO translation_keys (key, category, description, context)
VALUES
  ('admin.languages.form.noResults', 'admin', 'Message when no languages match search', 'admin')
ON CONFLICT (key) DO NOTHING;

-- English translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.form.noResults', 'en', 'No languages found', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- Hebrew translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.form.noResults', 'he', 'לא נמצאו שפות', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

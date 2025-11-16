-- Translations for Auto-Fill Hints
-- Add translations for the hint messages shown before language selection

-- Insert translation keys
INSERT INTO translation_keys (key, category, description, context)
VALUES
  ('admin.languages.form.directionHint', 'admin', 'Hint that direction will be auto-filled', 'admin'),
  ('admin.languages.form.currencyAutoFill', 'admin', 'Hint that currency will be auto-filled', 'admin')
ON CONFLICT (key) DO NOTHING;

-- English translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.form.directionHint', 'en', 'Will be auto-filled when you select a language', 'admin', 'admin'),
  ('admin.languages.form.currencyAutoFill', 'en', 'Will be auto-filled when you select a language', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- Hebrew translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.form.directionHint', 'he', 'יתמלא אוטומטית כאשר תבחר שפה', 'admin', 'admin'),
  ('admin.languages.form.currencyAutoFill', 'he', 'יתמלא אוטומטית כאשר תבחר שפה', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- Translations for Delete Confirmation Modal
-- Add translations for the language delete confirmation dialog

-- Insert translation keys
INSERT INTO translation_keys (key, category, description, context)
VALUES
  ('admin.languages.confirmDelete.title', 'admin', 'Delete confirmation modal title', 'admin'),
  ('admin.languages.confirmDelete.message', 'admin', 'Delete confirmation message', 'admin'),
  ('admin.languages.confirmDelete.warning', 'admin', 'Delete confirmation warning', 'admin'),
  ('admin.languages.confirmDelete.confirm', 'admin', 'Delete confirmation button', 'admin')
ON CONFLICT (key) DO NOTHING;

-- English translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.confirmDelete.title', 'en', 'Delete Language', 'admin', 'admin'),
  ('admin.languages.confirmDelete.message', 'en', 'Are you sure you want to delete', 'admin', 'admin'),
  ('admin.languages.confirmDelete.warning', 'en', 'This action cannot be undone. All translations for this language will be deleted.', 'admin', 'admin'),
  ('admin.languages.confirmDelete.confirm', 'en', 'Delete', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- Hebrew translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.confirmDelete.title', 'he', 'מחיקת שפה', 'admin', 'admin'),
  ('admin.languages.confirmDelete.message', 'he', 'האם אתה בטוח שברצונך למחוק את', 'admin', 'admin'),
  ('admin.languages.confirmDelete.warning', 'he', 'פעולה זו אינה הפיכה. כל התרגומים בשפה זו יימחקו.', 'admin', 'admin'),
  ('admin.languages.confirmDelete.confirm', 'he', 'מחק', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

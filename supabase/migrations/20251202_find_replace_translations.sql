-- Find & Replace Feature Translations
-- Translations for the template editor find & replace functionality

DO $$
BEGIN
  -- Delete existing find & replace translations
  DELETE FROM translations WHERE tenant_id IS NULL AND translation_key LIKE 'emails.editor.find%';
  DELETE FROM translations WHERE tenant_id IS NULL AND translation_key LIKE 'emails.editor.replace%';

  -- Insert find & replace translations
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES

  -- Find & Replace Header
  (NULL, 'emails.editor.find_replace', 'en', 'Find & Replace', 'admin'),
  (NULL, 'emails.editor.find_replace', 'he', 'חיפוש והחלפה', 'admin'),
  (NULL, 'emails.editor.find_replace_desc', 'en', 'Search and replace text in the current language', 'admin'),
  (NULL, 'emails.editor.find_replace_desc', 'he', 'חפש והחלף טקסט בשפה הנוכחית', 'admin'),

  -- Find & Replace Fields
  (NULL, 'emails.editor.find_text', 'en', 'Find', 'admin'),
  (NULL, 'emails.editor.find_text', 'he', 'חפש', 'admin'),
  (NULL, 'emails.editor.find_placeholder', 'en', 'Text to find', 'admin'),
  (NULL, 'emails.editor.find_placeholder', 'he', 'טקסט לחיפוש', 'admin'),

  (NULL, 'emails.editor.replace_text', 'en', 'Replace with', 'admin'),
  (NULL, 'emails.editor.replace_text', 'he', 'החלף עם', 'admin'),
  (NULL, 'emails.editor.replace_placeholder', 'en', 'Replacement text', 'admin'),
  (NULL, 'emails.editor.replace_placeholder', 'he', 'טקסט להחלפה', 'admin'),

  -- Find & Replace Actions
  (NULL, 'emails.editor.replace_next', 'en', 'Replace Next', 'admin'),
  (NULL, 'emails.editor.replace_next', 'he', 'החלף הבא', 'admin'),
  (NULL, 'emails.editor.replace_all', 'en', 'Replace All', 'admin'),
  (NULL, 'emails.editor.replace_all', 'he', 'החלף הכל', 'admin'),

  -- Find & Replace Messages
  (NULL, 'emails.editor.replaced_one', 'en', 'Replaced 1 occurrence', 'admin'),
  (NULL, 'emails.editor.replaced_one', 'he', 'מופע אחד הוחלף', 'admin'),
  (NULL, 'emails.editor.replaced_all', 'en', 'Replaced occurrences', 'admin'),
  (NULL, 'emails.editor.replaced_all', 'he', 'מופעים הוחלפו', 'admin'),

  -- Find & Replace Note
  (NULL, 'emails.editor.find_replace_note', 'en', 'Searching in current language version only', 'admin'),
  (NULL, 'emails.editor.find_replace_note', 'he', 'מחפש בגרסת השפה הנוכחית בלבד', 'admin');

END $$;

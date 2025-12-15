-- Email Template Category Editor Translations
-- Translations for selecting email template categories in the editor

DO $$
BEGIN
  -- Delete existing category editor translations
  DELETE FROM translations WHERE tenant_id IS NULL AND translation_key LIKE 'emails.editor.category%';

  -- Insert category editor translations
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES

  -- Category Editor
  (NULL, 'emails.editor.category', 'en', 'Template Category', 'admin'),
  (NULL, 'emails.editor.category', 'he', 'קטגוריית תבנית', 'admin'),
  (NULL, 'emails.editor.category_desc', 'en', 'Organize your email template by selecting a category', 'admin'),
  (NULL, 'emails.editor.category_desc', 'he', 'ארגן את תבנית האימייל שלך על ידי בחירת קטגוריה', 'admin'),
  (NULL, 'emails.editor.select_category', 'en', 'Category', 'admin'),
  (NULL, 'emails.editor.select_category', 'he', 'קטגוריה', 'admin'),
  (NULL, 'emails.editor.category_changed', 'en', 'Category will be updated when you save', 'admin'),
  (NULL, 'emails.editor.category_changed', 'he', 'הקטגוריה תתעדכן כשתשמור', 'admin'),

  -- Preview Dialog
  (NULL, 'emails.editor.preview_title', 'en', 'Email Preview', 'admin'),
  (NULL, 'emails.editor.preview_title', 'he', 'תצוגה מקדימה של אימייל', 'admin'),
  (NULL, 'emails.editor.preview_desc', 'en', 'Preview how your email will appear', 'admin'),
  (NULL, 'emails.editor.preview_desc', 'he', 'תצוגה מקדימה כיצד האימייל שלך יופיע', 'admin'),
  (NULL, 'emails.editor.html_preview', 'en', 'HTML Preview', 'admin'),
  (NULL, 'emails.editor.html_preview', 'he', 'תצוגה מקדימה HTML', 'admin'),
  (NULL, 'emails.editor.text_preview', 'en', 'Plain Text Preview', 'admin'),
  (NULL, 'emails.editor.text_preview', 'he', 'תצוגה מקדימה טקסט רגיל', 'admin'),
  (NULL, 'emails.editor.no_subject', 'en', 'No subject', 'admin'),
  (NULL, 'emails.editor.no_subject', 'he', 'אין נושא', 'admin'),
  (NULL, 'emails.editor.no_text', 'en', 'No plain text version', 'admin'),
  (NULL, 'emails.editor.no_text', 'he', 'אין גרסת טקסט רגיל', 'admin');

END $$;

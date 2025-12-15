-- Email Settings Page Translations
-- Translations for email settings and category configuration

DO $$
BEGIN
  -- Delete existing email settings translations
  DELETE FROM translations WHERE tenant_id IS NULL AND translation_key LIKE 'emails.settings.%';

  -- Insert email settings translations
  INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES

  -- Settings Page - General
  (NULL, 'emails.settings.title', 'en', 'Email Settings', 'admin'),
  (NULL, 'emails.settings.title', 'he', 'הגדרות אימייל', 'admin'),
  (NULL, 'emails.settings.description', 'en', 'Configure email template categories and badge colors', 'admin'),
  (NULL, 'emails.settings.description', 'he', 'הגדר קטגוריות תבניות אימייל וצבעי תגים', 'admin'),

  -- Settings - Save Messages
  (NULL, 'emails.settings.saved', 'en', 'Email settings saved successfully', 'admin'),
  (NULL, 'emails.settings.saved', 'he', 'הגדרות האימייל נשמרו בהצלחה', 'admin'),
  (NULL, 'emails.settings.save_error', 'en', 'Failed to save settings', 'admin'),
  (NULL, 'emails.settings.save_error', 'he', 'שמירת ההגדרות נכשלה', 'admin'),

  -- Preview Section
  (NULL, 'emails.settings.preview.title', 'en', 'Category Preview', 'admin'),
  (NULL, 'emails.settings.preview.title', 'he', 'תצוגה מקדימה של קטגוריות', 'admin'),
  (NULL, 'emails.settings.preview.description', 'en', 'Preview how your category badges will appear', 'admin'),
  (NULL, 'emails.settings.preview.description', 'he', 'תצוגה מקדימה כיצד תגי הקטגוריות שלך יופיעו', 'admin'),

  -- Categories Section
  (NULL, 'emails.settings.categories.title', 'en', 'Template Categories', 'admin'),
  (NULL, 'emails.settings.categories.title', 'he', 'קטגוריות תבניות', 'admin'),
  (NULL, 'emails.settings.categories.description', 'en', 'Define categories for organizing email templates with custom labels and colors', 'admin'),
  (NULL, 'emails.settings.categories.description', 'he', 'הגדר קטגוריות לארגון תבניות אימייל עם תוויות וצבעים מותאמים אישית', 'admin'),

  -- Category Fields
  (NULL, 'emails.settings.categories.value', 'en', 'Category Key', 'admin'),
  (NULL, 'emails.settings.categories.value', 'he', 'מפתח קטגוריה', 'admin'),
  (NULL, 'emails.settings.categories.label_en', 'en', 'English Label', 'admin'),
  (NULL, 'emails.settings.categories.label_en', 'he', 'תווית באנגלית', 'admin'),
  (NULL, 'emails.settings.categories.label_he', 'en', 'Hebrew Label', 'admin'),
  (NULL, 'emails.settings.categories.label_he', 'he', 'תווית בעברית', 'admin'),
  (NULL, 'emails.settings.categories.color', 'en', 'Badge Color', 'admin'),
  (NULL, 'emails.settings.categories.color', 'he', 'צבע תג', 'admin'),

  -- Category Actions
  (NULL, 'emails.settings.categories.add', 'en', 'Add Category', 'admin'),
  (NULL, 'emails.settings.categories.add', 'he', 'הוסף קטגוריה', 'admin');

END $$;

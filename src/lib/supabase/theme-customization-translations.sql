-- ============================================================================
-- THEME CUSTOMIZATION PAGE TRANSLATIONS
-- ============================================================================
-- Translations for the Theme Customization page (admin/settings)
-- Run this file to add all translation keys for theme customization
-- ============================================================================

INSERT INTO public.translation_keys (key, category, description) VALUES
  -- Page Header
  ('admin.theme.title', 'admin', 'Theme customization page title'),
  ('admin.theme.subtitle', 'admin', 'Theme customization page subtitle'),
  ('admin.theme.resetToDefault', 'admin', 'Reset to default button'),
  ('admin.theme.saveChanges', 'admin', 'Save changes button'),
  ('admin.theme.saved', 'admin', 'Saved confirmation text'),

  -- Tabs
  ('admin.theme.tab.colors', 'admin', 'Colors tab'),
  ('admin.theme.tab.typography', 'admin', 'Typography tab'),
  ('admin.theme.tab.branding', 'admin', 'Branding tab'),

  -- Colors Tab
  ('admin.theme.colors.primaryColors', 'admin', 'Primary colors section title'),
  ('admin.theme.colors.primary', 'admin', 'Primary color label'),
  ('admin.theme.colors.secondary', 'admin', 'Secondary color label'),
  ('admin.theme.colors.accent', 'admin', 'Accent color label'),
  ('admin.theme.colors.backgroundColors', 'admin', 'Background colors section title'),
  ('admin.theme.colors.background', 'admin', 'Background color label'),
  ('admin.theme.colors.foreground', 'admin', 'Foreground/text color label'),

  -- Preview Section
  ('admin.theme.preview.title', 'admin', 'Preview section title'),
  ('admin.theme.preview.sampleHeading', 'admin', 'Sample heading text'),
  ('admin.theme.preview.sampleText', 'admin', 'Sample paragraph text'),
  ('admin.theme.preview.primaryButton', 'admin', 'Primary button label'),
  ('admin.theme.preview.secondaryButton', 'admin', 'Secondary button label'),
  ('admin.theme.preview.note', 'admin', 'Note label'),
  ('admin.theme.preview.noteText', 'admin', 'Note text about applying changes'),

  -- Typography Tab
  ('admin.theme.typography.fontSettings', 'admin', 'Font settings section title'),
  ('admin.theme.typography.bodyFont', 'admin', 'Body font family label'),
  ('admin.theme.typography.headingFont', 'admin', 'Heading font family label'),
  ('admin.theme.typography.baseFontSize', 'admin', 'Base font size label'),
  ('admin.theme.typography.size.small', 'admin', 'Small font size option'),
  ('admin.theme.typography.size.medium', 'admin', 'Medium font size option'),
  ('admin.theme.typography.size.large', 'admin', 'Large font size option'),
  ('admin.theme.typography.borderRadius', 'admin', 'Border radius label'),
  ('admin.theme.typography.radius.none', 'admin', 'No border radius option'),
  ('admin.theme.typography.radius.small', 'admin', 'Small border radius option'),
  ('admin.theme.typography.radius.medium', 'admin', 'Medium border radius option'),
  ('admin.theme.typography.radius.large', 'admin', 'Large border radius option'),
  ('admin.theme.typography.radius.xlarge', 'admin', 'Extra large border radius option'),
  ('admin.theme.typography.preview', 'admin', 'Typography preview title'),
  ('admin.theme.typography.heading1', 'admin', 'Heading 1 sample text'),
  ('admin.theme.typography.heading2', 'admin', 'Heading 2 sample text'),
  ('admin.theme.typography.heading3', 'admin', 'Heading 3 sample text'),
  ('admin.theme.typography.sampleText', 'admin', 'Sample body text'),
  ('admin.theme.typography.buttonExample', 'admin', 'Button example text'),

  -- Branding Tab
  ('admin.theme.branding.title', 'admin', 'Platform branding section title'),
  ('admin.theme.branding.platformName', 'admin', 'Platform name label'),
  ('admin.theme.branding.platformNamePlaceholder', 'admin', 'Platform name placeholder'),
  ('admin.theme.branding.platformNameHint', 'admin', 'Platform name hint text'),
  ('admin.theme.branding.logoText', 'admin', 'Logo text label'),
  ('admin.theme.branding.logoTextPlaceholder', 'admin', 'Logo text placeholder'),
  ('admin.theme.branding.logoTextHint', 'admin', 'Logo text hint'),
  ('admin.theme.branding.preview', 'admin', 'Branding preview title'),
  ('admin.theme.branding.browserTitle', 'admin', 'Browser title label')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.translations (language_code, translation_key, translation_value, category) VALUES
  -- Hebrew Translations
  -- Page Header
  ('he', 'admin.theme.title', 'הגדרות פלטפורמה', 'admin'),
  ('he', 'admin.theme.subtitle', 'התאם את המראה והמיתוג של הפלטפורמה שלך', 'admin'),
  ('he', 'admin.theme.resetToDefault', 'אפס לברירת מחדל', 'admin'),
  ('he', 'admin.theme.saveChanges', 'שמור שינויים', 'admin'),
  ('he', 'admin.theme.saved', 'נשמר!', 'admin'),

  -- Tabs
  ('he', 'admin.theme.tab.colors', 'צבעים', 'admin'),
  ('he', 'admin.theme.tab.typography', 'טיפוגרפיה', 'admin'),
  ('he', 'admin.theme.tab.branding', 'מיתוג', 'admin'),

  -- Colors Tab
  ('he', 'admin.theme.colors.primaryColors', 'צבעים עיקריים', 'admin'),
  ('he', 'admin.theme.colors.primary', 'צבע ראשי', 'admin'),
  ('he', 'admin.theme.colors.secondary', 'צבע משני', 'admin'),
  ('he', 'admin.theme.colors.accent', 'צבע מבטא', 'admin'),
  ('he', 'admin.theme.colors.backgroundColors', 'צבעי רקע', 'admin'),
  ('he', 'admin.theme.colors.background', 'צבע רקע', 'admin'),
  ('he', 'admin.theme.colors.foreground', 'צבע טקסט', 'admin'),

  -- Preview Section
  ('he', 'admin.theme.preview.title', 'תצוגה מקדימה', 'admin'),
  ('he', 'admin.theme.preview.sampleHeading', 'כותרת לדוגמה', 'admin'),
  ('he', 'admin.theme.preview.sampleText', 'כך ייראה הטקסט שלך עם הצבעים שנבחרו.', 'admin'),
  ('he', 'admin.theme.preview.primaryButton', 'כפתור ראשי', 'admin'),
  ('he', 'admin.theme.preview.secondaryButton', 'כפתור משני', 'admin'),
  ('he', 'admin.theme.preview.note', 'שים לב', 'admin'),
  ('he', 'admin.theme.preview.noteText', 'השינויים יוחלו באופן גלובלי בכל הדפים לאחר השמירה.', 'admin'),

  -- Typography Tab
  ('he', 'admin.theme.typography.fontSettings', 'הגדרות גופן', 'admin'),
  ('he', 'admin.theme.typography.bodyFont', 'משפחת גופנים לגוף', 'admin'),
  ('he', 'admin.theme.typography.headingFont', 'משפחת גופנים לכותרות', 'admin'),
  ('he', 'admin.theme.typography.baseFontSize', 'גודל גופן בסיסי', 'admin'),
  ('he', 'admin.theme.typography.size.small', '14px (קטן)', 'admin'),
  ('he', 'admin.theme.typography.size.medium', '16px (בינוני)', 'admin'),
  ('he', 'admin.theme.typography.size.large', '18px (גדול)', 'admin'),
  ('he', 'admin.theme.typography.borderRadius', 'רדיוס פינות', 'admin'),
  ('he', 'admin.theme.typography.radius.none', 'ללא (0px)', 'admin'),
  ('he', 'admin.theme.typography.radius.small', 'קטן (4px)', 'admin'),
  ('he', 'admin.theme.typography.radius.medium', 'בינוני (8px)', 'admin'),
  ('he', 'admin.theme.typography.radius.large', 'גדול (12px)', 'admin'),
  ('he', 'admin.theme.typography.radius.xlarge', 'גדול במיוחד (16px)', 'admin'),
  ('he', 'admin.theme.typography.preview', 'תצוגה מקדימה של טיפוגרפיה', 'admin'),
  ('he', 'admin.theme.typography.heading1', 'כותרת 1', 'admin'),
  ('he', 'admin.theme.typography.heading2', 'כותרת 2', 'admin'),
  ('he', 'admin.theme.typography.heading3', 'כותרת 3', 'admin'),
  ('he', 'admin.theme.typography.sampleText', 'זהו פסקת טקסט גוף. היא מדגימה כיצד התוכן שלך יופיע עם הגדרות הגופן שנבחרו. השועל החום המהיר קופץ מעל הכלב העצלן.', 'admin'),
  ('he', 'admin.theme.typography.buttonExample', 'דוגמת כפתור', 'admin'),

  -- Branding Tab
  ('he', 'admin.theme.branding.title', 'מיתוג פלטפורמה', 'admin'),
  ('he', 'admin.theme.branding.platformName', 'שם פלטפורמה', 'admin'),
  ('he', 'admin.theme.branding.platformNamePlaceholder', 'שם הפלטפורמה שלך', 'admin'),
  ('he', 'admin.theme.branding.platformNameHint', 'זה יופיע בכותרת הדפדפן ובתגי מטא', 'admin'),
  ('he', 'admin.theme.branding.logoText', 'טקסט לוגו', 'admin'),
  ('he', 'admin.theme.branding.logoTextPlaceholder', 'טקסט לוגו', 'admin'),
  ('he', 'admin.theme.branding.logoTextHint', 'טקסט המוצג ליד סמל הלוגו', 'admin'),
  ('he', 'admin.theme.branding.preview', 'תצוגה מקדימה', 'admin'),
  ('he', 'admin.theme.branding.browserTitle', 'כותרת דפדפן', 'admin'),

  -- English Translations
  -- Page Header
  ('en', 'admin.theme.title', 'Platform Settings', 'admin'),
  ('en', 'admin.theme.subtitle', 'Customize your platform''s appearance and branding', 'admin'),
  ('en', 'admin.theme.resetToDefault', 'Reset to Default', 'admin'),
  ('en', 'admin.theme.saveChanges', 'Save Changes', 'admin'),
  ('en', 'admin.theme.saved', 'Saved!', 'admin'),

  -- Tabs
  ('en', 'admin.theme.tab.colors', 'Colors', 'admin'),
  ('en', 'admin.theme.tab.typography', 'Typography', 'admin'),
  ('en', 'admin.theme.tab.branding', 'Branding', 'admin'),

  -- Colors Tab
  ('en', 'admin.theme.colors.primaryColors', 'Primary Colors', 'admin'),
  ('en', 'admin.theme.colors.primary', 'Primary Color', 'admin'),
  ('en', 'admin.theme.colors.secondary', 'Secondary Color', 'admin'),
  ('en', 'admin.theme.colors.accent', 'Accent Color', 'admin'),
  ('en', 'admin.theme.colors.backgroundColors', 'Background Colors', 'admin'),
  ('en', 'admin.theme.colors.background', 'Background Color', 'admin'),
  ('en', 'admin.theme.colors.foreground', 'Foreground Color (Text)', 'admin'),

  -- Preview Section
  ('en', 'admin.theme.preview.title', 'Preview', 'admin'),
  ('en', 'admin.theme.preview.sampleHeading', 'Sample Heading', 'admin'),
  ('en', 'admin.theme.preview.sampleText', 'This is how your text will look with the selected colors.', 'admin'),
  ('en', 'admin.theme.preview.primaryButton', 'Primary Button', 'admin'),
  ('en', 'admin.theme.preview.secondaryButton', 'Secondary Button', 'admin'),
  ('en', 'admin.theme.preview.note', 'Note', 'admin'),
  ('en', 'admin.theme.preview.noteText', 'Changes will be applied globally across all pages after saving.', 'admin'),

  -- Typography Tab
  ('en', 'admin.theme.typography.fontSettings', 'Font Settings', 'admin'),
  ('en', 'admin.theme.typography.bodyFont', 'Body Font Family', 'admin'),
  ('en', 'admin.theme.typography.headingFont', 'Heading Font Family', 'admin'),
  ('en', 'admin.theme.typography.baseFontSize', 'Base Font Size', 'admin'),
  ('en', 'admin.theme.typography.size.small', '14px (Small)', 'admin'),
  ('en', 'admin.theme.typography.size.medium', '16px (Medium)', 'admin'),
  ('en', 'admin.theme.typography.size.large', '18px (Large)', 'admin'),
  ('en', 'admin.theme.typography.borderRadius', 'Border Radius', 'admin'),
  ('en', 'admin.theme.typography.radius.none', 'None (0px)', 'admin'),
  ('en', 'admin.theme.typography.radius.small', 'Small (4px)', 'admin'),
  ('en', 'admin.theme.typography.radius.medium', 'Medium (8px)', 'admin'),
  ('en', 'admin.theme.typography.radius.large', 'Large (12px)', 'admin'),
  ('en', 'admin.theme.typography.radius.xlarge', 'Extra Large (16px)', 'admin'),
  ('en', 'admin.theme.typography.preview', 'Typography Preview', 'admin'),
  ('en', 'admin.theme.typography.heading1', 'Heading 1', 'admin'),
  ('en', 'admin.theme.typography.heading2', 'Heading 2', 'admin'),
  ('en', 'admin.theme.typography.heading3', 'Heading 3', 'admin'),
  ('en', 'admin.theme.typography.sampleText', 'This is a paragraph of body text. It demonstrates how your content will appear with the selected font settings. The quick brown fox jumps over the lazy dog.', 'admin'),
  ('en', 'admin.theme.typography.buttonExample', 'Button Example', 'admin'),

  -- Branding Tab
  ('en', 'admin.theme.branding.title', 'Platform Branding', 'admin'),
  ('en', 'admin.theme.branding.platformName', 'Platform Name', 'admin'),
  ('en', 'admin.theme.branding.platformNamePlaceholder', 'Your Platform Name', 'admin'),
  ('en', 'admin.theme.branding.platformNameHint', 'This will appear in the browser title and meta tags', 'admin'),
  ('en', 'admin.theme.branding.logoText', 'Logo Text', 'admin'),
  ('en', 'admin.theme.branding.logoTextPlaceholder', 'Logo Text', 'admin'),
  ('en', 'admin.theme.branding.logoTextHint', 'Text displayed next to your logo icon', 'admin'),
  ('en', 'admin.theme.branding.preview', 'Preview', 'admin'),
  ('en', 'admin.theme.branding.browserTitle', 'Browser title', 'admin')
ON CONFLICT (language_code, translation_key) DO NOTHING;

-- ============================================================================
-- DONE! Theme Customization page translations added.
-- Total: 52 translation keys with Hebrew + English translations
-- ============================================================================

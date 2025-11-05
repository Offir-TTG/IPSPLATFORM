-- Theme Editor UI Translations
-- Hebrew translations for the color picker interface

-- First, ensure translation keys exist
INSERT INTO translation_keys (key, category)
VALUES
  -- Page Header
  ('admin.theme.title', 'theme'),
  ('admin.theme.subtitle', 'theme'),

  -- Mode Selection
  ('admin.theme.editMode', 'theme'),
  ('admin.theme.lightMode', 'theme'),
  ('admin.theme.darkMode', 'theme'),

  -- Actions
  ('admin.theme.save', 'theme'),
  ('admin.theme.saving', 'theme'),
  ('admin.theme.saveChanges', 'theme'),

  -- Color Categories
  ('admin.theme.categoryBrand', 'theme'),
  ('admin.theme.categoryFeedback', 'theme'),
  ('admin.theme.categoryNeutral', 'theme'),
  ('admin.theme.categoryBorders', 'theme'),

  -- Brand Color Names
  ('admin.theme.primary', 'theme'),
  ('admin.theme.secondary', 'theme'),

  -- Feedback Color Names
  ('admin.theme.success', 'theme'),
  ('admin.theme.error', 'theme'),
  ('admin.theme.warning', 'theme'),
  ('admin.theme.info', 'theme'),

  -- Neutral Color Names
  ('admin.theme.background', 'theme'),
  ('admin.theme.card', 'theme'),
  ('admin.theme.popover', 'theme'),
  ('admin.theme.muted', 'theme'),
  ('admin.theme.accent', 'theme'),
  ('admin.theme.border', 'theme'),
  ('admin.theme.input', 'theme'),
  ('admin.theme.ring', 'theme'),

  -- Border Radius
  ('admin.theme.borderRadius', 'theme'),
  ('admin.theme.borderRadiusHelp', 'theme')
ON CONFLICT (key) DO NOTHING;

-- Hebrew Translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Page Header
  ('he', 'admin.theme.title', 'ערכת נושא ועיצוב', 'theme', 'admin'),
  ('he', 'admin.theme.subtitle', 'התאם אישית צבעים ומראה חזותי', 'theme', 'admin'),

  -- Mode Selection
  ('he', 'admin.theme.editMode', 'מצב עריכה:', 'theme', 'admin'),
  ('he', 'admin.theme.lightMode', 'מצב בהיר', 'theme', 'admin'),
  ('he', 'admin.theme.darkMode', 'מצב כהה', 'theme', 'admin'),

  -- Actions
  ('he', 'admin.theme.save', 'שמור שינויים', 'theme', 'admin'),
  ('he', 'admin.theme.saving', 'שומר...', 'theme', 'admin'),
  ('he', 'admin.theme.saveChanges', 'שמור שינויים', 'theme', 'admin'),

  -- Color Categories
  ('he', 'admin.theme.categoryBrand', 'צבעי מותג', 'theme', 'admin'),
  ('he', 'admin.theme.categoryFeedback', 'צבעי משוב', 'theme', 'admin'),
  ('he', 'admin.theme.categoryNeutral', 'צבעים ניטרליים', 'theme', 'admin'),
  ('he', 'admin.theme.categoryBorders', 'גבולות וקלטים', 'theme', 'admin'),

  -- Brand Color Names
  ('he', 'admin.theme.primary', 'ראשי', 'theme', 'admin'),
  ('he', 'admin.theme.secondary', 'משני', 'theme', 'admin'),

  -- Feedback Color Names
  ('he', 'admin.theme.success', 'הצלחה', 'theme', 'admin'),
  ('he', 'admin.theme.error', 'שגיאה', 'theme', 'admin'),
  ('he', 'admin.theme.warning', 'אזהרה', 'theme', 'admin'),
  ('he', 'admin.theme.info', 'מידע', 'theme', 'admin'),

  -- Neutral Color Names
  ('he', 'admin.theme.background', 'רקע', 'theme', 'admin'),
  ('he', 'admin.theme.card', 'כרטיס', 'theme', 'admin'),
  ('he', 'admin.theme.popover', 'חלון קופץ', 'theme', 'admin'),
  ('he', 'admin.theme.muted', 'מושתק', 'theme', 'admin'),
  ('he', 'admin.theme.accent', 'הדגשה', 'theme', 'admin'),
  ('he', 'admin.theme.border', 'גבול', 'theme', 'admin'),
  ('he', 'admin.theme.input', 'שדה קלט', 'theme', 'admin'),
  ('he', 'admin.theme.ring', 'טבעת פוקוס', 'theme', 'admin'),

  -- Border Radius
  ('he', 'admin.theme.borderRadius', 'רדיוס פינות', 'theme', 'admin'),
  ('he', 'admin.theme.borderRadiusHelp', 'שולט בעיגול הפינות (לדוגמה: 0.5rem, 8px)', 'theme', 'admin')
ON CONFLICT (language_code, translation_key)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context,
  updated_at = NOW();

-- English Translations (for completeness)
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Page Header
  ('en', 'admin.theme.title', 'Theme & Design', 'theme', 'admin'),
  ('en', 'admin.theme.subtitle', 'Customize colors and visual appearance', 'theme', 'admin'),

  -- Mode Selection
  ('en', 'admin.theme.editMode', 'Edit Mode:', 'theme', 'admin'),
  ('en', 'admin.theme.lightMode', 'Light Mode', 'theme', 'admin'),
  ('en', 'admin.theme.darkMode', 'Dark Mode', 'theme', 'admin'),

  -- Actions
  ('en', 'admin.theme.save', 'Save Changes', 'theme', 'admin'),
  ('en', 'admin.theme.saving', 'Saving...', 'theme', 'admin'),
  ('en', 'admin.theme.saveChanges', 'Save Changes', 'theme', 'admin'),

  -- Color Categories
  ('en', 'admin.theme.categoryBrand', 'Brand Colors', 'theme', 'admin'),
  ('en', 'admin.theme.categoryFeedback', 'Feedback Colors', 'theme', 'admin'),
  ('en', 'admin.theme.categoryNeutral', 'Neutral Colors', 'theme', 'admin'),
  ('en', 'admin.theme.categoryBorders', 'Borders & Inputs', 'theme', 'admin'),

  -- Brand Color Names
  ('en', 'admin.theme.primary', 'Primary', 'theme', 'admin'),
  ('en', 'admin.theme.secondary', 'Secondary', 'theme', 'admin'),

  -- Feedback Color Names
  ('en', 'admin.theme.success', 'Success', 'theme', 'admin'),
  ('en', 'admin.theme.error', 'Destructive', 'theme', 'admin'),
  ('en', 'admin.theme.warning', 'Warning', 'theme', 'admin'),
  ('en', 'admin.theme.info', 'Info', 'theme', 'admin'),

  -- Neutral Color Names
  ('en', 'admin.theme.background', 'Background', 'theme', 'admin'),
  ('en', 'admin.theme.card', 'Card', 'theme', 'admin'),
  ('en', 'admin.theme.popover', 'Popover', 'theme', 'admin'),
  ('en', 'admin.theme.muted', 'Muted', 'theme', 'admin'),
  ('en', 'admin.theme.accent', 'Accent', 'theme', 'admin'),
  ('en', 'admin.theme.border', 'Border', 'theme', 'admin'),
  ('en', 'admin.theme.input', 'Input', 'theme', 'admin'),
  ('en', 'admin.theme.ring', 'Ring', 'theme', 'admin'),

  -- Border Radius
  ('en', 'admin.theme.borderRadius', 'Border Radius', 'theme', 'admin'),
  ('en', 'admin.theme.borderRadiusHelp', 'Controls corner rounding (e.g., 0.5rem, 8px)', 'theme', 'admin')
ON CONFLICT (language_code, translation_key)
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context,
  updated_at = NOW();

-- Verify translations
SELECT
  tk.key,
  t_en.translation_value AS english,
  t_he.translation_value AS hebrew
FROM translation_keys tk
LEFT JOIN translations t_en ON tk.key = t_en.translation_key AND t_en.language_code = 'en'
LEFT JOIN translations t_he ON tk.key = t_he.translation_key AND t_he.language_code = 'he'
WHERE tk.key LIKE 'admin.theme.%'
ORDER BY tk.key;

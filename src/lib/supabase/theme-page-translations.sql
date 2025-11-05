-- Theme & Design page translations
-- Run this in your Supabase SQL editor

-- Insert translation keys
INSERT INTO translation_keys (key, category, description, context) VALUES
  -- Page header
  ('admin.theme.title', 'admin', 'Theme & Design page title', 'admin'),
  ('admin.theme.subtitle', 'admin', 'Theme & Design page subtitle', 'admin'),

  -- Quick Guide
  ('admin.theme.howToCustomize', 'admin', 'How to customize heading', 'admin'),
  ('admin.theme.step1', 'admin', 'Customization step 1', 'admin'),
  ('admin.theme.step2', 'admin', 'Customization step 2', 'admin'),
  ('admin.theme.step3', 'admin', 'Customization step 3', 'admin'),
  ('admin.theme.step4', 'admin', 'Customization step 4', 'admin'),

  -- Color Palette
  ('admin.theme.colorPalette', 'admin', 'Color palette section heading', 'admin'),
  ('admin.theme.brand', 'admin', 'Brand colors category', 'admin'),
  ('admin.theme.feedback', 'admin', 'Feedback colors category', 'admin'),
  ('admin.theme.riskLevels', 'admin', 'Risk levels category', 'admin'),
  ('admin.theme.neutral', 'admin', 'Neutral colors category', 'admin'),

  -- Color names
  ('admin.theme.primary', 'admin', 'Primary color', 'admin'),
  ('admin.theme.secondary', 'admin', 'Secondary color', 'admin'),
  ('admin.theme.success', 'admin', 'Success color', 'admin'),
  ('admin.theme.error', 'admin', 'Error color', 'admin'),
  ('admin.theme.warning', 'admin', 'Warning color', 'admin'),
  ('admin.theme.info', 'admin', 'Info color', 'admin'),
  ('admin.theme.critical', 'admin', 'Critical risk', 'admin'),
  ('admin.theme.high', 'admin', 'High risk', 'admin'),
  ('admin.theme.medium', 'admin', 'Medium risk', 'admin'),
  ('admin.theme.low', 'admin', 'Low risk', 'admin'),
  ('admin.theme.muted', 'admin', 'Muted color', 'admin'),
  ('admin.theme.accent', 'admin', 'Accent color', 'admin'),

  -- Component Examples
  ('admin.theme.componentExamples', 'admin', 'Component examples heading', 'admin'),
  ('admin.theme.buttons', 'admin', 'Buttons section', 'admin'),
  ('admin.theme.cards', 'admin', 'Cards section', 'admin'),
  ('admin.theme.table', 'admin', 'Table section', 'admin'),
  ('admin.theme.delete', 'admin', 'Delete button label', 'admin'),
  ('admin.theme.outline', 'admin', 'Outline button label', 'admin'),
  ('admin.theme.defaultCard', 'admin', 'Default card title', 'admin'),
  ('admin.theme.usesCardTokens', 'admin', 'Uses card color tokens description', 'admin'),
  ('admin.theme.mutedCard', 'admin', 'Muted card title', 'admin'),
  ('admin.theme.forSubtleBackgrounds', 'admin', 'For subtle backgrounds description', 'admin'),
  ('admin.theme.name', 'admin', 'Name column header', 'admin'),
  ('admin.theme.status', 'admin', 'Status column header', 'admin'),
  ('admin.theme.role', 'admin', 'Role column header', 'admin'),
  ('admin.theme.active', 'admin', 'Active status', 'admin'),
  ('admin.theme.inactive', 'admin', 'Inactive status', 'admin'),
  ('admin.theme.admin', 'admin', 'Admin role', 'admin'),
  ('admin.theme.user', 'admin', 'User role', 'admin'),

  -- Customization Example
  ('admin.theme.exampleTitle', 'admin', 'Example section title', 'admin'),
  ('admin.theme.exampleStep1', 'admin', 'Example step 1 label', 'admin'),
  ('admin.theme.exampleStep2', 'admin', 'Example step 2 label', 'admin'),
  ('admin.theme.exampleStep3', 'admin', 'Example step 3 label', 'admin'),
  ('admin.theme.hslHue', 'admin', 'HSL Hue explanation', 'admin'),
  ('admin.theme.hslSaturation', 'admin', 'HSL Saturation explanation', 'admin'),
  ('admin.theme.hslLightness', 'admin', 'HSL Lightness explanation', 'admin'),

  -- Documentation
  ('admin.theme.documentation', 'admin', 'Documentation section heading', 'admin'),
  ('admin.theme.docCustomization', 'admin', 'Customization doc description', 'admin'),
  ('admin.theme.docOverview', 'admin', 'Overview doc description', 'admin')

ON CONFLICT (key) DO NOTHING;

-- Insert English translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Page header
  ('en', 'admin.theme.title', 'Theme & Design', 'admin', 'admin'),
  ('en', 'admin.theme.subtitle', 'Customize colors and visual appearance', 'admin', 'admin'),

  -- Quick Guide
  ('en', 'admin.theme.howToCustomize', 'How to Customize', 'admin', 'admin'),
  ('en', 'admin.theme.step1', 'Edit src/app/globals.css', 'admin', 'admin'),
  ('en', 'admin.theme.step2', 'Find the color you want to change (e.g., --primary)', 'admin', 'admin'),
  ('en', 'admin.theme.step3', 'Update the HSL values (Hue, Saturation, Lightness)', 'admin', 'admin'),
  ('en', 'admin.theme.step4', 'Save and refresh to see changes', 'admin', 'admin'),

  -- Color Palette
  ('en', 'admin.theme.colorPalette', 'Color Palette', 'admin', 'admin'),
  ('en', 'admin.theme.brand', 'Brand', 'admin', 'admin'),
  ('en', 'admin.theme.feedback', 'Feedback', 'admin', 'admin'),
  ('en', 'admin.theme.riskLevels', 'Risk Levels (Audit)', 'admin', 'admin'),
  ('en', 'admin.theme.neutral', 'Neutral', 'admin', 'admin'),

  -- Color names
  ('en', 'admin.theme.primary', 'Primary', 'admin', 'admin'),
  ('en', 'admin.theme.secondary', 'Secondary', 'admin', 'admin'),
  ('en', 'admin.theme.success', 'Success', 'admin', 'admin'),
  ('en', 'admin.theme.error', 'Error', 'admin', 'admin'),
  ('en', 'admin.theme.warning', 'Warning', 'admin', 'admin'),
  ('en', 'admin.theme.info', 'Info', 'admin', 'admin'),
  ('en', 'admin.theme.critical', 'Critical', 'admin', 'admin'),
  ('en', 'admin.theme.high', 'High', 'admin', 'admin'),
  ('en', 'admin.theme.medium', 'Medium', 'admin', 'admin'),
  ('en', 'admin.theme.low', 'Low', 'admin', 'admin'),
  ('en', 'admin.theme.muted', 'Muted', 'admin', 'admin'),
  ('en', 'admin.theme.accent', 'Accent', 'admin', 'admin'),

  -- Component Examples
  ('en', 'admin.theme.componentExamples', 'Component Examples', 'admin', 'admin'),
  ('en', 'admin.theme.buttons', 'Buttons', 'admin', 'admin'),
  ('en', 'admin.theme.cards', 'Cards', 'admin', 'admin'),
  ('en', 'admin.theme.table', 'Table', 'admin', 'admin'),
  ('en', 'admin.theme.delete', 'Delete', 'admin', 'admin'),
  ('en', 'admin.theme.outline', 'Outline', 'admin', 'admin'),
  ('en', 'admin.theme.defaultCard', 'Default Card', 'admin', 'admin'),
  ('en', 'admin.theme.usesCardTokens', 'Uses card color tokens', 'admin', 'admin'),
  ('en', 'admin.theme.mutedCard', 'Muted Card', 'admin', 'admin'),
  ('en', 'admin.theme.forSubtleBackgrounds', 'For subtle backgrounds', 'admin', 'admin'),
  ('en', 'admin.theme.name', 'Name', 'admin', 'admin'),
  ('en', 'admin.theme.status', 'Status', 'admin', 'admin'),
  ('en', 'admin.theme.role', 'Role', 'admin', 'admin'),
  ('en', 'admin.theme.active', 'Active', 'admin', 'admin'),
  ('en', 'admin.theme.inactive', 'Inactive', 'admin', 'admin'),
  ('en', 'admin.theme.admin', 'Admin', 'admin', 'admin'),
  ('en', 'admin.theme.user', 'User', 'admin', 'admin'),

  -- Customization Example
  ('en', 'admin.theme.exampleTitle', 'Example: Change Primary Color', 'admin', 'admin'),
  ('en', 'admin.theme.exampleStep1', '1. Open globals.css:', 'admin', 'admin'),
  ('en', 'admin.theme.exampleStep2', '2. Find and edit:', 'admin', 'admin'),
  ('en', 'admin.theme.exampleStep3', '3. HSL Format:', 'admin', 'admin'),
  ('en', 'admin.theme.hslHue', 'Hue (0-360): Color type (0=red, 120=green, 240=blue)', 'admin', 'admin'),
  ('en', 'admin.theme.hslSaturation', 'Saturation (0-100%): Color intensity', 'admin', 'admin'),
  ('en', 'admin.theme.hslLightness', 'Lightness (0-100%): Brightness', 'admin', 'admin'),

  -- Documentation
  ('en', 'admin.theme.documentation', 'Documentation', 'admin', 'admin'),
  ('en', 'admin.theme.docCustomization', 'Full customization guide', 'admin', 'admin'),
  ('en', 'admin.theme.docOverview', 'Technical details', 'admin', 'admin')

ON CONFLICT (language_code, translation_key) DO NOTHING;

-- Insert Hebrew translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Page header
  ('he', 'admin.theme.title', 'ערכת נושא ועיצוב', 'admin', 'admin'),
  ('he', 'admin.theme.subtitle', 'התאמה אישית של צבעים ומראה חזותי', 'admin', 'admin'),

  -- Quick Guide
  ('he', 'admin.theme.howToCustomize', 'כיצד להתאים אישית', 'admin', 'admin'),
  ('he', 'admin.theme.step1', 'ערוך את src/app/globals.css', 'admin', 'admin'),
  ('he', 'admin.theme.step2', 'מצא את הצבע שברצונך לשנות (למשל, --primary)', 'admin', 'admin'),
  ('he', 'admin.theme.step3', 'עדכן את ערכי HSL (גוון, רוויה, בהירות)', 'admin', 'admin'),
  ('he', 'admin.theme.step4', 'שמור ורענן כדי לראות שינויים', 'admin', 'admin'),

  -- Color Palette
  ('he', 'admin.theme.colorPalette', 'לוח צבעים', 'admin', 'admin'),
  ('he', 'admin.theme.brand', 'מותג', 'admin', 'admin'),
  ('he', 'admin.theme.feedback', 'משוב', 'admin', 'admin'),
  ('he', 'admin.theme.riskLevels', 'רמות סיכון (ביקורת)', 'admin', 'admin'),
  ('he', 'admin.theme.neutral', 'נייטרלי', 'admin', 'admin'),

  -- Color names
  ('he', 'admin.theme.primary', 'ראשי', 'admin', 'admin'),
  ('he', 'admin.theme.secondary', 'משני', 'admin', 'admin'),
  ('he', 'admin.theme.success', 'הצלחה', 'admin', 'admin'),
  ('he', 'admin.theme.error', 'שגיאה', 'admin', 'admin'),
  ('he', 'admin.theme.warning', 'אזהרה', 'admin', 'admin'),
  ('he', 'admin.theme.info', 'מידע', 'admin', 'admin'),
  ('he', 'admin.theme.critical', 'קריטי', 'admin', 'admin'),
  ('he', 'admin.theme.high', 'גבוה', 'admin', 'admin'),
  ('he', 'admin.theme.medium', 'בינוני', 'admin', 'admin'),
  ('he', 'admin.theme.low', 'נמוך', 'admin', 'admin'),
  ('he', 'admin.theme.muted', 'מושתק', 'admin', 'admin'),
  ('he', 'admin.theme.accent', 'הדגשה', 'admin', 'admin'),

  -- Component Examples
  ('he', 'admin.theme.componentExamples', 'דוגמאות רכיבים', 'admin', 'admin'),
  ('he', 'admin.theme.buttons', 'כפתורים', 'admin', 'admin'),
  ('he', 'admin.theme.cards', 'כרטיסים', 'admin', 'admin'),
  ('he', 'admin.theme.table', 'טבלה', 'admin', 'admin'),
  ('he', 'admin.theme.delete', 'מחק', 'admin', 'admin'),
  ('he', 'admin.theme.outline', 'מתאר', 'admin', 'admin'),
  ('he', 'admin.theme.defaultCard', 'כרטיס רגיל', 'admin', 'admin'),
  ('he', 'admin.theme.usesCardTokens', 'משתמש באסימוני צבע של כרטיס', 'admin', 'admin'),
  ('he', 'admin.theme.mutedCard', 'כרטיס מושתק', 'admin', 'admin'),
  ('he', 'admin.theme.forSubtleBackgrounds', 'לרקעים עדינים', 'admin', 'admin'),
  ('he', 'admin.theme.name', 'שם', 'admin', 'admin'),
  ('he', 'admin.theme.status', 'סטטוס', 'admin', 'admin'),
  ('he', 'admin.theme.role', 'תפקיד', 'admin', 'admin'),
  ('he', 'admin.theme.active', 'פעיל', 'admin', 'admin'),
  ('he', 'admin.theme.inactive', 'לא פעיל', 'admin', 'admin'),
  ('he', 'admin.theme.admin', 'מנהל', 'admin', 'admin'),
  ('he', 'admin.theme.user', 'משתמש', 'admin', 'admin'),

  -- Customization Example
  ('he', 'admin.theme.exampleTitle', 'דוגמה: שינוי צבע ראשי', 'admin', 'admin'),
  ('he', 'admin.theme.exampleStep1', '1. פתח את globals.css:', 'admin', 'admin'),
  ('he', 'admin.theme.exampleStep2', '2. מצא וערוך:', 'admin', 'admin'),
  ('he', 'admin.theme.exampleStep3', '3. פורמט HSL:', 'admin', 'admin'),
  ('he', 'admin.theme.hslHue', 'גוון (0-360): סוג צבע (0=אדום, 120=ירוק, 240=כחול)', 'admin', 'admin'),
  ('he', 'admin.theme.hslSaturation', 'רוויה (0-100%): עוצמת צבע', 'admin', 'admin'),
  ('he', 'admin.theme.hslLightness', 'בהירות (0-100%): רמת בהירות', 'admin', 'admin'),

  -- Documentation
  ('he', 'admin.theme.documentation', 'תיעוד', 'admin', 'admin'),
  ('he', 'admin.theme.docCustomization', 'מדריך התאמה אישית מלא', 'admin', 'admin'),
  ('he', 'admin.theme.docOverview', 'פרטים טכניים', 'admin', 'admin')

ON CONFLICT (language_code, translation_key) DO NOTHING;

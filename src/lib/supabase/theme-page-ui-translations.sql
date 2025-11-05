-- ============================================================================
-- Theme & Design Page UI Translations
-- ============================================================================
-- Adds all UI text for the Theme & Design admin page to translation system
-- ============================================================================

-- Insert translation keys
INSERT INTO translation_keys (key, category)
VALUES
  -- Tabs
  ('admin.theme.colorsTab', 'admin'),
  ('admin.theme.typographyTab', 'admin'),
  ('admin.theme.sidebarTab', 'admin'),

  -- Colors section
  ('admin.theme.editMode', 'admin'),
  ('admin.theme.editModeHelp', 'admin'),
  ('admin.theme.lightMode', 'admin'),
  ('admin.theme.darkMode', 'admin'),
  ('admin.theme.categoryBrand', 'admin'),
  ('admin.theme.categoryFeedback', 'admin'),
  ('admin.theme.categoryNeutral', 'admin'),
  ('admin.theme.categoryBorders', 'admin'),

  -- Typography section
  ('admin.theme.fontFamilies', 'admin'),
  ('admin.theme.fontPrimary', 'admin'),
  ('admin.theme.fontPrimaryHelp', 'admin'),
  ('admin.theme.fontHeading', 'admin'),
  ('admin.theme.fontHeadingHelp', 'admin'),
  ('admin.theme.fontMono', 'admin'),
  ('admin.theme.fontMonoHelp', 'admin'),
  ('admin.theme.fontSizes', 'admin'),
  ('admin.theme.fontWeights', 'admin'),
  ('admin.theme.lineHeights', 'admin'),
  ('admin.theme.letterSpacing', 'admin'),

  -- Font weight labels
  ('admin.theme.weightNormal', 'admin'),
  ('admin.theme.weightMedium', 'admin'),
  ('admin.theme.weightSemibold', 'admin'),
  ('admin.theme.weightBold', 'admin'),

  -- Line height labels
  ('admin.theme.lineHeightTight', 'admin'),
  ('admin.theme.lineHeightNormal', 'admin'),
  ('admin.theme.lineHeightRelaxed', 'admin'),

  -- Letter spacing labels
  ('admin.theme.letterSpacingTight', 'admin'),
  ('admin.theme.letterSpacingNormal', 'admin'),
  ('admin.theme.letterSpacingWide', 'admin'),

  -- Text colors
  ('admin.theme.textColors', 'admin'),
  ('admin.theme.textBody', 'admin'),
  ('admin.theme.textHeading', 'admin'),
  ('admin.theme.textMuted', 'admin'),
  ('admin.theme.textLink', 'admin'),
  ('admin.theme.textMutedPreview', 'admin'),
  ('admin.theme.textLinkPreview', 'admin'),

  -- Color picker labels
  ('admin.theme.colorBackground', 'admin'),
  ('admin.theme.colorForeground', 'admin'),
  ('admin.theme.colorForegroundPlaceholder', 'admin'),
  ('admin.theme.preview', 'admin'),

  -- Page header
  ('admin.theme.title', 'admin'),
  ('admin.theme.subtitle', 'admin'),
  ('admin.theme.save', 'admin'),
  ('admin.theme.saving', 'admin'),
  ('admin.theme.saveChanges', 'admin'),

  -- Messages
  ('admin.theme.errorNoTheme', 'admin'),
  ('admin.theme.errorLoadFailed', 'admin'),
  ('admin.theme.successSaved', 'admin'),
  ('admin.theme.errorSaveFailed', 'admin'),
  ('admin.theme.errorNoConfig', 'admin'),

  -- Border radius
  ('admin.theme.borderRadius', 'admin'),
  ('admin.theme.borderRadiusHelp', 'admin'),

  -- Color labels
  ('admin.theme.primary', 'admin'),
  ('admin.theme.secondary', 'admin'),
  ('admin.theme.success', 'admin'),
  ('admin.theme.error', 'admin'),
  ('admin.theme.warning', 'admin'),
  ('admin.theme.info', 'admin'),
  ('admin.theme.background', 'admin'),
  ('admin.theme.card', 'admin'),
  ('admin.theme.popover', 'admin'),
  ('admin.theme.muted', 'admin'),
  ('admin.theme.accent', 'admin'),
  ('admin.theme.border', 'admin'),
  ('admin.theme.input', 'admin'),
  ('admin.theme.ring', 'admin'),

  -- Sidebar section
  ('admin.theme.sidebarColors', 'admin'),
  ('admin.theme.sidebarBackground', 'admin'),
  ('admin.theme.sidebarForeground', 'admin'),
  ('admin.theme.sidebarBorder', 'admin'),
  ('admin.theme.sidebarActive', 'admin'),
  ('admin.theme.sidebarActiveForeground', 'admin'),
  ('admin.theme.sidebarPreviewItem', 'admin'),
  ('admin.theme.sidebarPreviewActive', 'admin')
ON CONFLICT (key) DO NOTHING;

-- Insert Hebrew translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Tabs
  ('he', 'admin.theme.colorsTab', 'צבעים', 'admin', 'admin'),
  ('he', 'admin.theme.typographyTab', 'טיפוגרפיה', 'admin', 'admin'),
  ('he', 'admin.theme.sidebarTab', 'סרגל צד', 'admin', 'admin'),

  -- Colors section
  ('he', 'admin.theme.editMode', 'מצב עריכה', 'admin', 'admin'),
  ('he', 'admin.theme.editModeHelp', 'בחר באיזו ערכת צבעים להתאים אישית', 'admin', 'admin'),
  ('he', 'admin.theme.lightMode', 'מצב בהיר', 'admin', 'admin'),
  ('he', 'admin.theme.darkMode', 'מצב כהה', 'admin', 'admin'),
  ('he', 'admin.theme.categoryBrand', 'צבעי מותג', 'admin', 'admin'),
  ('he', 'admin.theme.categoryFeedback', 'צבעי משוב', 'admin', 'admin'),
  ('he', 'admin.theme.categoryNeutral', 'צבעים ניטרליים', 'admin', 'admin'),
  ('he', 'admin.theme.categoryBorders', 'גבולות וקלט', 'admin', 'admin'),

  -- Typography section
  ('he', 'admin.theme.fontFamilies', 'משפחות גופנים', 'admin', 'admin'),
  ('he', 'admin.theme.fontPrimary', 'גופן עיקרי (טקסט גוף)', 'admin', 'admin'),
  ('he', 'admin.theme.fontPrimaryHelp', 'משמש לכל טקסט הגוף ופסקאות', 'admin', 'admin'),
  ('he', 'admin.theme.fontHeading', 'גופן כותרות', 'admin', 'admin'),
  ('he', 'admin.theme.fontHeadingHelp', 'משמש לכותרות וטייטלים', 'admin', 'admin'),
  ('he', 'admin.theme.fontMono', 'גופן מונו (קוד)', 'admin', 'admin'),
  ('he', 'admin.theme.fontMonoHelp', 'משמש לבלוקים של קוד וטקסט טכני', 'admin', 'admin'),
  ('he', 'admin.theme.fontSizes', 'גדלי גופן', 'admin', 'admin'),
  ('he', 'admin.theme.fontWeights', 'עוצמות גופן', 'admin', 'admin'),
  ('he', 'admin.theme.lineHeights', 'גובה שורה', 'admin', 'admin'),
  ('he', 'admin.theme.letterSpacing', 'ריווח אותיות', 'admin', 'admin'),

  -- Font weight labels
  ('he', 'admin.theme.weightNormal', 'רגיל', 'admin', 'admin'),
  ('he', 'admin.theme.weightMedium', 'בינוני', 'admin', 'admin'),
  ('he', 'admin.theme.weightSemibold', 'מודגש בינוני', 'admin', 'admin'),
  ('he', 'admin.theme.weightBold', 'מודגש', 'admin', 'admin'),

  -- Line height labels
  ('he', 'admin.theme.lineHeightTight', 'צפוף', 'admin', 'admin'),
  ('he', 'admin.theme.lineHeightNormal', 'רגיל', 'admin', 'admin'),
  ('he', 'admin.theme.lineHeightRelaxed', 'רגוע', 'admin', 'admin'),

  -- Letter spacing labels
  ('he', 'admin.theme.letterSpacingTight', 'צפוף', 'admin', 'admin'),
  ('he', 'admin.theme.letterSpacingNormal', 'רגיל', 'admin', 'admin'),
  ('he', 'admin.theme.letterSpacingWide', 'רחב', 'admin', 'admin'),

  -- Text colors
  ('he', 'admin.theme.textColors', 'צבעי טקסט', 'admin', 'admin'),
  ('he', 'admin.theme.textBody', 'טקסט גוף', 'admin', 'admin'),
  ('he', 'admin.theme.textHeading', 'טקסט כותרת', 'admin', 'admin'),
  ('he', 'admin.theme.textMuted', 'טקסט עמום', 'admin', 'admin'),
  ('he', 'admin.theme.textLink', 'טקסט קישור', 'admin', 'admin'),
  ('he', 'admin.theme.textMutedPreview', 'טקסט משני', 'admin', 'admin'),
  ('he', 'admin.theme.textLinkPreview', 'טקסט קישור', 'admin', 'admin'),

  -- Color picker labels
  ('he', 'admin.theme.colorBackground', 'רקע', 'admin', 'admin'),
  ('he', 'admin.theme.colorForeground', 'חזית', 'admin', 'admin'),
  ('he', 'admin.theme.colorForegroundPlaceholder', 'HSL חזית', 'admin', 'admin'),
  ('he', 'admin.theme.preview', 'תצוגה מקדימה', 'admin', 'admin'),

  -- Page header
  ('he', 'admin.theme.title', 'ערכת נושא ועיצוב', 'admin', 'admin'),
  ('he', 'admin.theme.subtitle', 'התאמה אישית של צבעים ומראה חזותי', 'admin', 'admin'),
  ('he', 'admin.theme.save', 'שמור שינויים', 'admin', 'admin'),
  ('he', 'admin.theme.saving', 'שומר...', 'admin', 'admin'),
  ('he', 'admin.theme.saveChanges', 'שמור שינויים', 'admin', 'admin'),

  -- Messages
  ('he', 'admin.theme.errorNoTheme', 'לא נמצאה הגדרת ערכת נושא פעילה', 'admin', 'admin'),
  ('he', 'admin.theme.errorLoadFailed', 'טעינת ערכת הנושא נכשלה', 'admin', 'admin'),
  ('he', 'admin.theme.successSaved', 'ערכת הנושא נשמרה בהצלחה! מרענן את הדף...', 'admin', 'admin'),
  ('he', 'admin.theme.errorSaveFailed', 'שמירת ערכת הנושא נכשלה', 'admin', 'admin'),
  ('he', 'admin.theme.errorNoConfig', 'לא נמצאה הגדרת ערכת נושא. אנא הרץ את העדכון במסד הנתונים.', 'admin', 'admin'),

  -- Border radius
  ('he', 'admin.theme.borderRadius', 'רדיוס פינות', 'admin', 'admin'),
  ('he', 'admin.theme.borderRadiusHelp', 'קובע את עיגול הפינות (למשל, 0.5rem, 8px)', 'admin', 'admin'),

  -- Color labels
  ('he', 'admin.theme.primary', 'ראשי', 'admin', 'admin'),
  ('he', 'admin.theme.secondary', 'משני', 'admin', 'admin'),
  ('he', 'admin.theme.success', 'הצלחה', 'admin', 'admin'),
  ('he', 'admin.theme.error', 'שגיאה', 'admin', 'admin'),
  ('he', 'admin.theme.warning', 'אזהרה', 'admin', 'admin'),
  ('he', 'admin.theme.info', 'מידע', 'admin', 'admin'),
  ('he', 'admin.theme.background', 'רקע', 'admin', 'admin'),
  ('he', 'admin.theme.card', 'כרטיס', 'admin', 'admin'),
  ('he', 'admin.theme.popover', 'חלון צץ', 'admin', 'admin'),
  ('he', 'admin.theme.muted', 'עמום', 'admin', 'admin'),
  ('he', 'admin.theme.accent', 'הדגשה', 'admin', 'admin'),
  ('he', 'admin.theme.border', 'גבול', 'admin', 'admin'),
  ('he', 'admin.theme.input', 'שדה קלט', 'admin', 'admin'),
  ('he', 'admin.theme.ring', 'טבעת', 'admin', 'admin'),

  -- Sidebar section
  ('he', 'admin.theme.sidebarColors', 'צבעי סרגל צד', 'admin', 'admin'),
  ('he', 'admin.theme.sidebarBackground', 'רקע סרגל', 'admin', 'admin'),
  ('he', 'admin.theme.sidebarForeground', 'טקסט סרגל', 'admin', 'admin'),
  ('he', 'admin.theme.sidebarBorder', 'גבול סרגל', 'admin', 'admin'),
  ('he', 'admin.theme.sidebarActive', 'פריט פעיל', 'admin', 'admin'),
  ('he', 'admin.theme.sidebarActiveForeground', 'טקסט פריט פעיל', 'admin', 'admin'),
  ('he', 'admin.theme.sidebarPreviewItem', 'פריט תפריט', 'admin', 'admin'),
  ('he', 'admin.theme.sidebarPreviewActive', 'פעיל', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context;

-- Insert English translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Tabs
  ('en', 'admin.theme.colorsTab', 'Colors', 'admin', 'admin'),
  ('en', 'admin.theme.typographyTab', 'Typography', 'admin', 'admin'),
  ('en', 'admin.theme.sidebarTab', 'Sidebar', 'admin', 'admin'),

  -- Colors section
  ('en', 'admin.theme.editMode', 'Edit Mode', 'admin', 'admin'),
  ('en', 'admin.theme.editModeHelp', 'Choose which color scheme to customize', 'admin', 'admin'),
  ('en', 'admin.theme.lightMode', 'Light', 'admin', 'admin'),
  ('en', 'admin.theme.darkMode', 'Dark', 'admin', 'admin'),
  ('en', 'admin.theme.categoryBrand', 'Brand Colors', 'admin', 'admin'),
  ('en', 'admin.theme.categoryFeedback', 'Feedback Colors', 'admin', 'admin'),
  ('en', 'admin.theme.categoryNeutral', 'Neutral Colors', 'admin', 'admin'),
  ('en', 'admin.theme.categoryBorders', 'Borders & Inputs', 'admin', 'admin'),

  -- Typography section
  ('en', 'admin.theme.fontFamilies', 'Font Families', 'admin', 'admin'),
  ('en', 'admin.theme.fontPrimary', 'Primary Font (Body Text)', 'admin', 'admin'),
  ('en', 'admin.theme.fontPrimaryHelp', 'Used for all body text and paragraphs', 'admin', 'admin'),
  ('en', 'admin.theme.fontHeading', 'Heading Font', 'admin', 'admin'),
  ('en', 'admin.theme.fontHeadingHelp', 'Used for headings and titles', 'admin', 'admin'),
  ('en', 'admin.theme.fontMono', 'Monospace Font (Code)', 'admin', 'admin'),
  ('en', 'admin.theme.fontMonoHelp', 'Used for code blocks and technical text', 'admin', 'admin'),
  ('en', 'admin.theme.fontSizes', 'Font Sizes', 'admin', 'admin'),
  ('en', 'admin.theme.fontWeights', 'Font Weights', 'admin', 'admin'),
  ('en', 'admin.theme.lineHeights', 'Line Heights', 'admin', 'admin'),
  ('en', 'admin.theme.letterSpacing', 'Letter Spacing', 'admin', 'admin'),

  -- Font weight labels
  ('en', 'admin.theme.weightNormal', 'Normal', 'admin', 'admin'),
  ('en', 'admin.theme.weightMedium', 'Medium', 'admin', 'admin'),
  ('en', 'admin.theme.weightSemibold', 'Semibold', 'admin', 'admin'),
  ('en', 'admin.theme.weightBold', 'Bold', 'admin', 'admin'),

  -- Line height labels
  ('en', 'admin.theme.lineHeightTight', 'Tight', 'admin', 'admin'),
  ('en', 'admin.theme.lineHeightNormal', 'Normal', 'admin', 'admin'),
  ('en', 'admin.theme.lineHeightRelaxed', 'Relaxed', 'admin', 'admin'),

  -- Letter spacing labels
  ('en', 'admin.theme.letterSpacingTight', 'Tight', 'admin', 'admin'),
  ('en', 'admin.theme.letterSpacingNormal', 'Normal', 'admin', 'admin'),
  ('en', 'admin.theme.letterSpacingWide', 'Wide', 'admin', 'admin'),

  -- Text colors
  ('en', 'admin.theme.textColors', 'Text Colors', 'admin', 'admin'),
  ('en', 'admin.theme.textBody', 'Body Text', 'admin', 'admin'),
  ('en', 'admin.theme.textHeading', 'Heading Text', 'admin', 'admin'),
  ('en', 'admin.theme.textMuted', 'Muted Text', 'admin', 'admin'),
  ('en', 'admin.theme.textLink', 'Link Text', 'admin', 'admin'),
  ('en', 'admin.theme.textMutedPreview', 'Secondary text', 'admin', 'admin'),
  ('en', 'admin.theme.textLinkPreview', 'Link text', 'admin', 'admin'),

  -- Color picker labels
  ('en', 'admin.theme.colorBackground', 'Background', 'admin', 'admin'),
  ('en', 'admin.theme.colorForeground', 'Foreground', 'admin', 'admin'),
  ('en', 'admin.theme.colorForegroundPlaceholder', 'Foreground HSL', 'admin', 'admin'),
  ('en', 'admin.theme.preview', 'Preview', 'admin', 'admin'),

  -- Page header
  ('en', 'admin.theme.title', 'Theme & Design', 'admin', 'admin'),
  ('en', 'admin.theme.subtitle', 'Customize colors and visual appearance', 'admin', 'admin'),
  ('en', 'admin.theme.save', 'Save Changes', 'admin', 'admin'),
  ('en', 'admin.theme.saving', 'Saving...', 'admin', 'admin'),
  ('en', 'admin.theme.saveChanges', 'Save Changes', 'admin', 'admin'),

  -- Messages
  ('en', 'admin.theme.errorNoTheme', 'No active theme found', 'admin', 'admin'),
  ('en', 'admin.theme.errorLoadFailed', 'Failed to load theme', 'admin', 'admin'),
  ('en', 'admin.theme.successSaved', 'Theme saved successfully! Refreshing page...', 'admin', 'admin'),
  ('en', 'admin.theme.errorSaveFailed', 'Failed to save theme', 'admin', 'admin'),
  ('en', 'admin.theme.errorNoConfig', 'No theme configuration found. Please run the database migration.', 'admin', 'admin'),

  -- Border radius
  ('en', 'admin.theme.borderRadius', 'Border Radius', 'admin', 'admin'),
  ('en', 'admin.theme.borderRadiusHelp', 'Controls corner rounding (e.g., 0.5rem, 8px)', 'admin', 'admin'),

  -- Color labels
  ('en', 'admin.theme.primary', 'Primary', 'admin', 'admin'),
  ('en', 'admin.theme.secondary', 'Secondary', 'admin', 'admin'),
  ('en', 'admin.theme.success', 'Success', 'admin', 'admin'),
  ('en', 'admin.theme.error', 'Destructive', 'admin', 'admin'),
  ('en', 'admin.theme.warning', 'Warning', 'admin', 'admin'),
  ('en', 'admin.theme.info', 'Info', 'admin', 'admin'),
  ('en', 'admin.theme.background', 'Background', 'admin', 'admin'),
  ('en', 'admin.theme.card', 'Card', 'admin', 'admin'),
  ('en', 'admin.theme.popover', 'Popover', 'admin', 'admin'),
  ('en', 'admin.theme.muted', 'Muted', 'admin', 'admin'),
  ('en', 'admin.theme.accent', 'Accent', 'admin', 'admin'),
  ('en', 'admin.theme.border', 'Border', 'admin', 'admin'),
  ('en', 'admin.theme.input', 'Input', 'admin', 'admin'),
  ('en', 'admin.theme.ring', 'Ring', 'admin', 'admin'),

  -- Sidebar section
  ('en', 'admin.theme.sidebarColors', 'Sidebar Colors', 'admin', 'admin'),
  ('en', 'admin.theme.sidebarBackground', 'Sidebar Background', 'admin', 'admin'),
  ('en', 'admin.theme.sidebarForeground', 'Sidebar Text', 'admin', 'admin'),
  ('en', 'admin.theme.sidebarBorder', 'Sidebar Border', 'admin', 'admin'),
  ('en', 'admin.theme.sidebarActive', 'Active Item Background', 'admin', 'admin'),
  ('en', 'admin.theme.sidebarActiveForeground', 'Active Item Text', 'admin', 'admin'),
  ('en', 'admin.theme.sidebarPreviewItem', 'Menu Item', 'admin', 'admin'),
  ('en', 'admin.theme.sidebarPreviewActive', 'Active', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context;

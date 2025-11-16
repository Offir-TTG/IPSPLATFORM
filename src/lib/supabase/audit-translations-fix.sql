-- ============================================================================
-- AUDIT TRANSLATIONS FIX - Add missing translations to correct tables
-- ============================================================================
-- This adds audit filter translations to the translation_keys and translations tables

-- Step 1: Insert translation keys
INSERT INTO translation_keys (key, category, description)
VALUES
  ('admin.audit.filters.filters', 'admin', 'Filters button label'),
  ('admin.audit.filters.allCategories', 'admin', 'All Categories tab label'),
  ('admin.audit.filters.category.security', 'admin', 'Security category tab'),
  ('admin.audit.filters.category.auth', 'admin', 'Authentication category tab'),
  ('admin.audit.filters.category.config', 'admin', 'Configuration category tab'),
  ('admin.audit.filters.category.data', 'admin', 'Data category tab'),
  ('admin.audit.filters.category.admin', 'admin', 'Admin category tab'),
  ('admin.audit.filters.category.studentRecord', 'admin', 'Student Records category tab'),
  ('admin.audit.filters.category.grade', 'admin', 'Grades category tab'),
  ('admin.audit.filters.category.attendance', 'admin', 'Attendance category tab'),
  ('admin.audit.details.before', 'admin', 'Before label in value comparison'),
  ('admin.audit.details.after', 'admin', 'After label in value comparison'),
  ('admin.audit.table.changed', 'admin', 'Changed prefix for field list'),
  ('admin.audit.details.exactChanges', 'admin', 'Exact Changes section header')
ON CONFLICT (key) DO NOTHING;

-- Step 2: Insert Hebrew translations
INSERT INTO translations (translation_key, language_code, translation_value, category)
VALUES
  ('admin.audit.filters.filters', 'he', 'סינון', 'admin'),
  ('admin.audit.filters.allCategories', 'he', 'כל הקטגוריות', 'admin'),
  ('admin.audit.filters.category.security', 'he', 'אבטחה', 'admin'),
  ('admin.audit.filters.category.auth', 'he', 'אימות', 'admin'),
  ('admin.audit.filters.category.config', 'he', 'הגדרות', 'admin'),
  ('admin.audit.filters.category.data', 'he', 'נתונים', 'admin'),
  ('admin.audit.filters.category.admin', 'he', 'מנהל', 'admin'),
  ('admin.audit.filters.category.studentRecord', 'he', 'רישומי תלמידים', 'admin'),
  ('admin.audit.filters.category.grade', 'he', 'ציונים', 'admin'),
  ('admin.audit.filters.category.attendance', 'he', 'נוכחות', 'admin'),
  ('admin.audit.details.before', 'he', 'לפני', 'admin'),
  ('admin.audit.details.after', 'he', 'אחרי', 'admin'),
  ('admin.audit.table.changed', 'he', 'שונה', 'admin'),
  ('admin.audit.details.exactChanges', 'he', 'שינויים מדויקים', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

-- Step 3: Insert English translations
INSERT INTO translations (translation_key, language_code, translation_value, category)
VALUES
  ('admin.audit.filters.filters', 'en', 'Filters', 'admin'),
  ('admin.audit.filters.allCategories', 'en', 'All Categories', 'admin'),
  ('admin.audit.filters.category.security', 'en', 'Security', 'admin'),
  ('admin.audit.filters.category.auth', 'en', 'Authentication', 'admin'),
  ('admin.audit.filters.category.config', 'en', 'Configuration', 'admin'),
  ('admin.audit.filters.category.data', 'en', 'Data', 'admin'),
  ('admin.audit.filters.category.admin', 'en', 'Admin', 'admin'),
  ('admin.audit.filters.category.studentRecord', 'en', 'Student Records', 'admin'),
  ('admin.audit.filters.category.grade', 'en', 'Grades', 'admin'),
  ('admin.audit.filters.category.attendance', 'en', 'Attendance', 'admin'),
  ('admin.audit.details.before', 'en', 'Before', 'admin'),
  ('admin.audit.details.after', 'en', 'After', 'admin'),
  ('admin.audit.table.changed', 'en', 'Changed', 'admin'),
  ('admin.audit.details.exactChanges', 'en', 'Exact Changes', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

-- Verify translations were added
SELECT
  tk.key,
  tk.description,
  COUNT(t.id) as translation_count,
  STRING_AGG(t.language_code || ': ' || t.translation_value, ', ' ORDER BY t.language_code) as translations
FROM translation_keys tk
LEFT JOIN translations t ON tk.key = t.translation_key
WHERE tk.key LIKE 'admin.audit.%'
GROUP BY tk.key, tk.description
ORDER BY tk.key;

-- ============================================================================
-- AUDIT FILTER TRANSLATIONS - Missing Keys
-- ============================================================================
-- This SQL adds missing translation keys for the audit filter component

-- Step 1: Add missing UI text config entries
INSERT INTO ui_text_config (key, category, default_value, description)
VALUES
  ('admin.audit.filters.filters', 'admin', 'Filters', 'Filters button label'),
  ('admin.audit.filters.allCategories', 'admin', 'All Categories', 'All Categories tab label'),
  ('admin.audit.filters.category.security', 'admin', 'Security', 'Security category tab'),
  ('admin.audit.filters.category.auth', 'admin', 'Authentication', 'Authentication category tab'),
  ('admin.audit.filters.category.config', 'admin', 'Configuration', 'Configuration category tab'),
  ('admin.audit.filters.category.data', 'admin', 'Data', 'Data category tab'),
  ('admin.audit.filters.category.admin', 'admin', 'Admin', 'Admin category tab'),
  ('admin.audit.filters.category.studentRecord', 'admin', 'Student Records', 'Student Records category tab'),
  ('admin.audit.filters.category.grade', 'admin', 'Grades', 'Grades category tab'),
  ('admin.audit.filters.category.attendance', 'admin', 'Attendance', 'Attendance category tab'),
  ('admin.audit.details.before', 'admin', 'Before', 'Before label in value comparison'),
  ('admin.audit.details.after', 'admin', 'After', 'After label in value comparison'),
  ('admin.audit.table.changed', 'admin', 'Changed', 'Changed prefix for field list'),
  ('admin.audit.details.exactChanges', 'admin', 'Exact Changes', 'Exact Changes section header')
ON CONFLICT (key) DO NOTHING;

-- Step 2: Add Hebrew translations
INSERT INTO ui_text_values (text_key, language_code, value)
VALUES
  ('admin.audit.filters.filters', 'he', 'סינון'),
  ('admin.audit.filters.allCategories', 'he', 'כל הקטגוריות'),
  ('admin.audit.filters.category.security', 'he', 'אבטחה'),
  ('admin.audit.filters.category.auth', 'he', 'אימות'),
  ('admin.audit.filters.category.config', 'he', 'הגדרות'),
  ('admin.audit.filters.category.data', 'he', 'נתונים'),
  ('admin.audit.filters.category.admin', 'he', 'מנהל'),
  ('admin.audit.filters.category.studentRecord', 'he', 'רישומי תלמידים'),
  ('admin.audit.filters.category.grade', 'he', 'ציונים'),
  ('admin.audit.filters.category.attendance', 'he', 'נוכחות'),
  ('admin.audit.details.before', 'he', 'לפני'),
  ('admin.audit.details.after', 'he', 'אחרי'),
  ('admin.audit.table.changed', 'he', 'שונה'),
  ('admin.audit.details.exactChanges', 'he', 'שינויים מדויקים')
ON CONFLICT (text_key, language_code) DO UPDATE
SET value = EXCLUDED.value;

-- Step 3: Add English translations
INSERT INTO ui_text_values (text_key, language_code, value)
VALUES
  ('admin.audit.filters.filters', 'en', 'Filters'),
  ('admin.audit.filters.allCategories', 'en', 'All Categories'),
  ('admin.audit.filters.category.security', 'en', 'Security'),
  ('admin.audit.filters.category.auth', 'en', 'Authentication'),
  ('admin.audit.filters.category.config', 'en', 'Configuration'),
  ('admin.audit.filters.category.data', 'en', 'Data'),
  ('admin.audit.filters.category.admin', 'en', 'Admin'),
  ('admin.audit.filters.category.studentRecord', 'en', 'Student Records'),
  ('admin.audit.filters.category.grade', 'en', 'Grades'),
  ('admin.audit.filters.category.attendance', 'en', 'Attendance'),
  ('admin.audit.details.before', 'en', 'Before'),
  ('admin.audit.details.after', 'en', 'After'),
  ('admin.audit.table.changed', 'en', 'Changed'),
  ('admin.audit.details.exactChanges', 'en', 'Exact Changes')
ON CONFLICT (text_key, language_code) DO UPDATE
SET value = EXCLUDED.value;

-- Verify translations were added
SELECT
  c.key,
  c.default_value,
  COUNT(v.id) as translation_count,
  STRING_AGG(v.language_code || ': ' || v.value, ', ' ORDER BY v.language_code) as translations
FROM ui_text_config c
LEFT JOIN ui_text_values v ON c.key = v.text_key
WHERE c.key LIKE 'admin.audit.%'
GROUP BY c.key, c.default_value
ORDER BY c.key;

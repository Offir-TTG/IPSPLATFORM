-- ============================================================================
-- COMPLETE AUDIT TRANSLATIONS - ALL IN ONE
-- ============================================================================
-- Run this single script to add ALL audit translations with proper context

-- Step 1: Insert ALL translation keys
INSERT INTO translation_keys (key, category, description)
VALUES
  -- Filter UI
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

  -- Details/Drill-down
  ('admin.audit.details.before', 'admin', 'Before label in value comparison'),
  ('admin.audit.details.after', 'admin', 'After label in value comparison'),
  ('admin.audit.table.changed', 'admin', 'Changed prefix for field list'),
  ('admin.audit.details.exactChanges', 'admin', 'Exact Changes section header'),

  -- Date range labels
  ('admin.audit.filters.dateFrom', 'admin', 'Date range start label'),
  ('admin.audit.filters.dateTo', 'admin', 'Date range end label'),

  -- Section headers
  ('admin.audit.filters.eventTypes', 'admin', 'Event Types section header'),
  ('admin.audit.filters.riskLevels', 'admin', 'Risk Levels section header'),
  ('admin.audit.filters.status', 'admin', 'Status section header'),
  ('admin.audit.filters.searchPlaceholder', 'admin', 'Search input placeholder'),

  -- Event type values
  ('admin.audit.filters.eventType.create', 'admin', 'CREATE event type'),
  ('admin.audit.filters.eventType.read', 'admin', 'READ event type'),
  ('admin.audit.filters.eventType.update', 'admin', 'UPDATE event type'),
  ('admin.audit.filters.eventType.delete', 'admin', 'DELETE event type'),
  ('admin.audit.filters.eventType.login', 'admin', 'LOGIN event type'),
  ('admin.audit.filters.eventType.logout', 'admin', 'LOGOUT event type'),
  ('admin.audit.filters.eventType.export', 'admin', 'EXPORT event type'),
  ('admin.audit.filters.eventType.import', 'admin', 'IMPORT event type'),
  ('admin.audit.filters.eventType.access', 'admin', 'ACCESS event type'),

  -- Risk level values
  ('admin.audit.filters.riskLevel.low', 'admin', 'Low risk level'),
  ('admin.audit.filters.riskLevel.medium', 'admin', 'Medium risk level'),
  ('admin.audit.filters.riskLevel.high', 'admin', 'High risk level'),
  ('admin.audit.filters.riskLevel.critical', 'admin', 'Critical risk level'),

  -- Status values
  ('admin.audit.filters.statusValue.success', 'admin', 'Success status'),
  ('admin.audit.filters.statusValue.failure', 'admin', 'Failure status'),
  ('admin.audit.filters.statusValue.partial', 'admin', 'Partial status')
ON CONFLICT (key) DO NOTHING;

-- Step 2: Set context = 'admin' for all admin.audit.* keys
UPDATE translation_keys
SET context = 'admin'
WHERE key LIKE 'admin.audit.%';

-- Step 3: Insert ALL Hebrew translations
INSERT INTO translations (translation_key, language_code, translation_value, category)
VALUES
  -- Filter UI
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

  -- Details/Drill-down
  ('admin.audit.details.before', 'he', 'לפני', 'admin'),
  ('admin.audit.details.after', 'he', 'אחרי', 'admin'),
  ('admin.audit.table.changed', 'he', 'שונה', 'admin'),
  ('admin.audit.details.exactChanges', 'he', 'שינויים מדויקים', 'admin'),

  -- Date range labels
  ('admin.audit.filters.dateFrom', 'he', 'מתאריך', 'admin'),
  ('admin.audit.filters.dateTo', 'he', 'עד תאריך', 'admin'),

  -- Section headers
  ('admin.audit.filters.eventTypes', 'he', 'סוגי אירועים', 'admin'),
  ('admin.audit.filters.riskLevels', 'he', 'רמות סיכון', 'admin'),
  ('admin.audit.filters.status', 'he', 'סטטוס', 'admin'),
  ('admin.audit.filters.searchPlaceholder', 'he', 'חיפוש...', 'admin'),

  -- Event type values
  ('admin.audit.filters.eventType.create', 'he', 'יצירה', 'admin'),
  ('admin.audit.filters.eventType.read', 'he', 'קריאה', 'admin'),
  ('admin.audit.filters.eventType.update', 'he', 'עדכון', 'admin'),
  ('admin.audit.filters.eventType.delete', 'he', 'מחיקה', 'admin'),
  ('admin.audit.filters.eventType.login', 'he', 'כניסה', 'admin'),
  ('admin.audit.filters.eventType.logout', 'he', 'יציאה', 'admin'),
  ('admin.audit.filters.eventType.export', 'he', 'ייצוא', 'admin'),
  ('admin.audit.filters.eventType.import', 'he', 'ייבוא', 'admin'),
  ('admin.audit.filters.eventType.access', 'he', 'גישה', 'admin'),

  -- Risk level values
  ('admin.audit.filters.riskLevel.low', 'he', 'נמוך', 'admin'),
  ('admin.audit.filters.riskLevel.medium', 'he', 'בינוני', 'admin'),
  ('admin.audit.filters.riskLevel.high', 'he', 'גבוה', 'admin'),
  ('admin.audit.filters.riskLevel.critical', 'he', 'קריטי', 'admin'),

  -- Status values
  ('admin.audit.filters.statusValue.success', 'he', 'הצלחה', 'admin'),
  ('admin.audit.filters.statusValue.failure', 'he', 'כישלון', 'admin'),
  ('admin.audit.filters.statusValue.partial', 'he', 'חלקי', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

-- Step 4: Insert ALL English translations
INSERT INTO translations (translation_key, language_code, translation_value, category)
VALUES
  -- Filter UI
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

  -- Details/Drill-down
  ('admin.audit.details.before', 'en', 'Before', 'admin'),
  ('admin.audit.details.after', 'en', 'After', 'admin'),
  ('admin.audit.table.changed', 'en', 'Changed', 'admin'),
  ('admin.audit.details.exactChanges', 'en', 'Exact Changes', 'admin'),

  -- Date range labels
  ('admin.audit.filters.dateFrom', 'en', 'From', 'admin'),
  ('admin.audit.filters.dateTo', 'en', 'To', 'admin'),

  -- Section headers
  ('admin.audit.filters.eventTypes', 'en', 'Event Types', 'admin'),
  ('admin.audit.filters.riskLevels', 'en', 'Risk Levels', 'admin'),
  ('admin.audit.filters.status', 'en', 'Status', 'admin'),
  ('admin.audit.filters.searchPlaceholder', 'en', 'Search...', 'admin'),

  -- Event type values
  ('admin.audit.filters.eventType.create', 'en', 'CREATE', 'admin'),
  ('admin.audit.filters.eventType.read', 'en', 'READ', 'admin'),
  ('admin.audit.filters.eventType.update', 'en', 'UPDATE', 'admin'),
  ('admin.audit.filters.eventType.delete', 'en', 'DELETE', 'admin'),
  ('admin.audit.filters.eventType.login', 'en', 'LOGIN', 'admin'),
  ('admin.audit.filters.eventType.logout', 'en', 'LOGOUT', 'admin'),
  ('admin.audit.filters.eventType.export', 'en', 'EXPORT', 'admin'),
  ('admin.audit.filters.eventType.import', 'en', 'IMPORT', 'admin'),
  ('admin.audit.filters.eventType.access', 'en', 'ACCESS', 'admin'),

  -- Risk level values
  ('admin.audit.filters.riskLevel.low', 'en', 'LOW', 'admin'),
  ('admin.audit.filters.riskLevel.medium', 'en', 'MEDIUM', 'admin'),
  ('admin.audit.filters.riskLevel.high', 'en', 'HIGH', 'admin'),
  ('admin.audit.filters.riskLevel.critical', 'en', 'CRITICAL', 'admin'),

  -- Status values
  ('admin.audit.filters.statusValue.success', 'en', 'Success', 'admin'),
  ('admin.audit.filters.statusValue.failure', 'en', 'Failure', 'admin'),
  ('admin.audit.filters.statusValue.partial', 'en', 'Partial', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

-- Step 5: Sync context from translation_keys to translations
UPDATE translations t
SET context = tk.context
FROM translation_keys tk
WHERE t.translation_key = tk.key
  AND t.translation_key LIKE 'admin.audit.%';

-- Step 6: Verify everything is correct
SELECT
  tk.key,
  tk.context as key_context,
  t.language_code,
  t.translation_value,
  t.context as translation_context
FROM translation_keys tk
LEFT JOIN translations t ON tk.key = t.translation_key
WHERE tk.key LIKE 'admin.audit.%'
ORDER BY tk.key, t.language_code;

-- Step 7: Count summary
SELECT
  'Translation Keys' as item,
  COUNT(*) as count
FROM translation_keys
WHERE key LIKE 'admin.audit.%'
UNION ALL
SELECT
  'Hebrew Translations' as item,
  COUNT(*) as count
FROM translations
WHERE translation_key LIKE 'admin.audit.%' AND language_code = 'he'
UNION ALL
SELECT
  'English Translations' as item,
  COUNT(*) as count
FROM translations
WHERE translation_key LIKE 'admin.audit.%' AND language_code = 'en'
UNION ALL
SELECT
  'With Admin Context' as item,
  COUNT(*) as count
FROM translations
WHERE translation_key LIKE 'admin.audit.%' AND context = 'admin';

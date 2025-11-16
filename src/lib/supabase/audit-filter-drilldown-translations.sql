-- ============================================================================
-- AUDIT FILTER DRILL-DOWN TRANSLATIONS
-- ============================================================================
-- Adds translations for the expanded filter section (event types, risk levels, status)

-- Step 1: Insert translation keys
INSERT INTO translation_keys (key, category, description, context)
VALUES
  -- Date range labels
  ('admin.audit.filters.dateFrom', 'admin', 'Date range start label', 'admin'),
  ('admin.audit.filters.dateTo', 'admin', 'Date range end label', 'admin'),

  -- Section headers
  ('admin.audit.filters.eventTypes', 'admin', 'Event Types section header', 'admin'),
  ('admin.audit.filters.riskLevels', 'admin', 'Risk Levels section header', 'admin'),
  ('admin.audit.filters.status', 'admin', 'Status section header', 'admin'),
  ('admin.audit.filters.searchPlaceholder', 'admin', 'Search input placeholder', 'admin'),

  -- Event type values
  ('admin.audit.filters.eventType.create', 'admin', 'CREATE event type', 'admin'),
  ('admin.audit.filters.eventType.read', 'admin', 'READ event type', 'admin'),
  ('admin.audit.filters.eventType.update', 'admin', 'UPDATE event type', 'admin'),
  ('admin.audit.filters.eventType.delete', 'admin', 'DELETE event type', 'admin'),
  ('admin.audit.filters.eventType.login', 'admin', 'LOGIN event type', 'admin'),
  ('admin.audit.filters.eventType.logout', 'admin', 'LOGOUT event type', 'admin'),
  ('admin.audit.filters.eventType.export', 'admin', 'EXPORT event type', 'admin'),
  ('admin.audit.filters.eventType.import', 'admin', 'IMPORT event type', 'admin'),
  ('admin.audit.filters.eventType.access', 'admin', 'ACCESS event type', 'admin'),

  -- Risk level values
  ('admin.audit.filters.riskLevel.low', 'admin', 'Low risk level', 'admin'),
  ('admin.audit.filters.riskLevel.medium', 'admin', 'Medium risk level', 'admin'),
  ('admin.audit.filters.riskLevel.high', 'admin', 'High risk level', 'admin'),
  ('admin.audit.filters.riskLevel.critical', 'admin', 'Critical risk level', 'admin'),

  -- Status values
  ('admin.audit.filters.statusValue.success', 'admin', 'Success status', 'admin'),
  ('admin.audit.filters.statusValue.failure', 'admin', 'Failure status', 'admin'),
  ('admin.audit.filters.statusValue.partial', 'admin', 'Partial status', 'admin')
ON CONFLICT (key) DO UPDATE
SET context = EXCLUDED.context;

-- Step 2: Insert Hebrew translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  -- Date range labels
  ('admin.audit.filters.dateFrom', 'he', 'מתאריך', 'admin', 'admin'),
  ('admin.audit.filters.dateTo', 'he', 'עד תאריך', 'admin', 'admin'),

  -- Section headers
  ('admin.audit.filters.eventTypes', 'he', 'סוגי אירועים', 'admin', 'admin'),
  ('admin.audit.filters.riskLevels', 'he', 'רמת סיכון', 'admin', 'admin'),
  ('admin.audit.filters.status', 'he', 'סטטוס', 'admin', 'admin'),
  ('admin.audit.filters.searchPlaceholder', 'he', 'חיפוש...', 'admin', 'admin'),

  -- Event type values
  ('admin.audit.filters.eventType.create', 'he', 'יצירה', 'admin', 'admin'),
  ('admin.audit.filters.eventType.read', 'he', 'קריאה', 'admin', 'admin'),
  ('admin.audit.filters.eventType.update', 'he', 'עדכון', 'admin', 'admin'),
  ('admin.audit.filters.eventType.delete', 'he', 'מחיקה', 'admin', 'admin'),
  ('admin.audit.filters.eventType.login', 'he', 'כניסה', 'admin', 'admin'),
  ('admin.audit.filters.eventType.logout', 'he', 'יציאה', 'admin', 'admin'),
  ('admin.audit.filters.eventType.export', 'he', 'ייצוא', 'admin', 'admin'),
  ('admin.audit.filters.eventType.import', 'he', 'ייבוא', 'admin', 'admin'),
  ('admin.audit.filters.eventType.access', 'he', 'גישה', 'admin', 'admin'),

  -- Risk level values
  ('admin.audit.filters.riskLevel.low', 'he', 'נמוך', 'admin', 'admin'),
  ('admin.audit.filters.riskLevel.medium', 'he', 'בינוני', 'admin', 'admin'),
  ('admin.audit.filters.riskLevel.high', 'he', 'גבוה', 'admin', 'admin'),
  ('admin.audit.filters.riskLevel.critical', 'he', 'קריטי', 'admin', 'admin'),

  -- Status values
  ('admin.audit.filters.statusValue.success', 'he', 'הצלחה', 'admin', 'admin'),
  ('admin.audit.filters.statusValue.failure', 'he', 'כישלון', 'admin', 'admin'),
  ('admin.audit.filters.statusValue.partial', 'he', 'חלקי', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    context = EXCLUDED.context;

-- Step 3: Insert English translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  -- Date range labels
  ('admin.audit.filters.dateFrom', 'en', 'From', 'admin', 'admin'),
  ('admin.audit.filters.dateTo', 'en', 'To', 'admin', 'admin'),

  -- Section headers
  ('admin.audit.filters.eventTypes', 'en', 'Event Types', 'admin', 'admin'),
  ('admin.audit.filters.riskLevels', 'en', 'Risk Levels', 'admin', 'admin'),
  ('admin.audit.filters.status', 'en', 'Status', 'admin', 'admin'),
  ('admin.audit.filters.searchPlaceholder', 'en', 'Search...', 'admin', 'admin'),

  -- Event type values
  ('admin.audit.filters.eventType.create', 'en', 'CREATE', 'admin', 'admin'),
  ('admin.audit.filters.eventType.read', 'en', 'READ', 'admin', 'admin'),
  ('admin.audit.filters.eventType.update', 'en', 'UPDATE', 'admin', 'admin'),
  ('admin.audit.filters.eventType.delete', 'en', 'DELETE', 'admin', 'admin'),
  ('admin.audit.filters.eventType.login', 'en', 'LOGIN', 'admin', 'admin'),
  ('admin.audit.filters.eventType.logout', 'en', 'LOGOUT', 'admin', 'admin'),
  ('admin.audit.filters.eventType.export', 'en', 'EXPORT', 'admin', 'admin'),
  ('admin.audit.filters.eventType.import', 'en', 'IMPORT', 'admin', 'admin'),
  ('admin.audit.filters.eventType.access', 'en', 'ACCESS', 'admin', 'admin'),

  -- Risk level values
  ('admin.audit.filters.riskLevel.low', 'en', 'LOW', 'admin', 'admin'),
  ('admin.audit.filters.riskLevel.medium', 'en', 'MEDIUM', 'admin', 'admin'),
  ('admin.audit.filters.riskLevel.high', 'en', 'HIGH', 'admin', 'admin'),
  ('admin.audit.filters.riskLevel.critical', 'en', 'CRITICAL', 'admin', 'admin'),

  -- Status values
  ('admin.audit.filters.statusValue.success', 'en', 'Success', 'admin', 'admin'),
  ('admin.audit.filters.statusValue.failure', 'en', 'Failure', 'admin', 'admin'),
  ('admin.audit.filters.statusValue.partial', 'en', 'Partial', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    context = EXCLUDED.context;

-- Verify the translations
SELECT
  tk.key,
  tk.description,
  COUNT(t.id) as translation_count,
  STRING_AGG(t.language_code || ': ' || t.translation_value, ' | ' ORDER BY t.language_code) as translations
FROM translation_keys tk
LEFT JOIN translations t ON tk.key = t.translation_key
WHERE tk.key LIKE 'admin.audit.filters.%'
  AND (tk.key LIKE '%.eventType.%' OR tk.key LIKE '%.riskLevel.%' OR tk.key LIKE '%.statusValue.%'
       OR tk.key IN ('admin.audit.filters.dateFrom', 'admin.audit.filters.dateTo',
                     'admin.audit.filters.eventTypes', 'admin.audit.filters.riskLevels',
                     'admin.audit.filters.status', 'admin.audit.filters.searchPlaceholder'))
GROUP BY tk.key, tk.description
ORDER BY tk.key;

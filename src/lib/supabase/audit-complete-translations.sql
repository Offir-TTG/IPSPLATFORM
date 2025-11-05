-- ============================================================================
-- COMPLETE AUDIT TRAIL TRANSLATIONS
-- ============================================================================
-- This file contains ALL translation keys needed for the audit trail system
-- Run this to add both admin and user translations
-- ============================================================================

-- ============================================================================
-- COMMON KEYS (Used by both admin and user)
-- ============================================================================

INSERT INTO public.translation_keys (key, category, description, context) VALUES
  -- Pagination
  ('common.showing', 'common', 'Showing text in pagination', 'both'),
  ('common.to', 'common', 'To text in pagination', 'both'),
  ('common.of', 'common', 'Of text in pagination', 'both'),
  ('common.page', 'common', 'Page text', 'both'),
  ('common.events', 'common', 'Events text', 'both'),
  ('common.activities', 'common', 'Activities text', 'both'),

  -- Navigation
  ('common.previous', 'common', 'Previous button', 'both'),
  ('common.next', 'common', 'Next button', 'both'),

  -- Actions
  ('common.refresh', 'common', 'Refresh button', 'both'),
  ('common.export', 'common', 'Export button', 'both'),
  ('common.filters', 'common', 'Filters button', 'both'),
  ('common.clear', 'common', 'Clear button', 'both'),
  ('common.search', 'common', 'Search placeholder', 'both'),

  -- States
  ('common.loading', 'common', 'Loading text', 'both'),
  ('common.error', 'common', 'Error text', 'both'),
  ('common.noResults', 'common', 'No results text', 'both')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- ADMIN AUDIT TRAIL KEYS
-- ============================================================================

INSERT INTO public.translation_keys (key, category, description, context) VALUES
  -- Navigation
  ('admin.nav.security', 'admin', 'Security & Compliance section title', 'admin'),
  ('admin.nav.audit', 'admin', 'Audit Trail link', 'admin'),

  -- Page Header
  ('admin.audit.title', 'admin', 'Audit Trail page title', 'admin'),
  ('admin.audit.subtitle', 'admin', 'Audit Trail page subtitle', 'admin'),

  -- Statistics
  ('admin.audit.stats.total', 'admin', 'Total Events statistic label', 'admin'),
  ('admin.audit.stats.highRisk', 'admin', 'High Risk statistic label', 'admin'),
  ('admin.audit.stats.failed', 'admin', 'Failed Actions statistic label', 'admin'),
  ('admin.audit.stats.today', 'admin', 'Last 24 Hours statistic label', 'admin'),

  -- Filters
  ('admin.audit.filters.dateFrom', 'admin', 'From Date filter label', 'admin'),
  ('admin.audit.filters.dateTo', 'admin', 'To Date filter label', 'admin'),
  ('admin.audit.filters.eventTypes', 'admin', 'Event Types filter label', 'admin'),
  ('admin.audit.filters.categories', 'admin', 'Categories filter label', 'admin'),
  ('admin.audit.filters.riskLevels', 'admin', 'Risk Levels filter label', 'admin'),
  ('admin.audit.filters.status', 'admin', 'Status filter label', 'admin'),
  ('admin.audit.filters.searchPlaceholder', 'admin', 'Search input placeholder', 'admin'),

  -- Table Headers
  ('admin.audit.table.time', 'admin', 'Time column header', 'admin'),
  ('admin.audit.table.user', 'admin', 'User column header', 'admin'),
  ('admin.audit.table.action', 'admin', 'Action column header', 'admin'),
  ('admin.audit.table.resource', 'admin', 'Resource column header', 'admin'),
  ('admin.audit.table.type', 'admin', 'Type column header', 'admin'),
  ('admin.audit.table.risk', 'admin', 'Risk column header', 'admin'),
  ('admin.audit.table.status', 'admin', 'Status column header', 'admin'),
  ('admin.audit.table.details', 'admin', 'Details column header', 'admin'),

  -- Event Details
  ('admin.audit.details.eventDetails', 'admin', 'Event Details section', 'admin'),
  ('admin.audit.details.network', 'admin', 'Network section', 'admin'),
  ('admin.audit.details.compliance', 'admin', 'Compliance section', 'admin'),
  ('admin.audit.details.changes', 'admin', 'Changes section', 'admin'),
  ('admin.audit.details.before', 'admin', 'Before label', 'admin'),
  ('admin.audit.details.after', 'admin', 'After label', 'admin'),
  ('admin.audit.details.changedFields', 'admin', 'Changed fields label', 'admin'),

  -- Messages
  ('admin.audit.noEvents', 'admin', 'No audit events found message', 'admin'),
  ('admin.audit.exportSoon', 'admin', 'Export functionality coming soon', 'admin'),
  ('admin.audit.loadError', 'admin', 'Failed to load audit events', 'admin')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- USER ACTIVITY KEYS
-- ============================================================================

INSERT INTO public.translation_keys (key, category, description, context) VALUES
  -- Page Header
  ('myActivity.title', 'user', 'My Activity page title', 'user'),
  ('myActivity.subtitle', 'user', 'My Activity page subtitle', 'user'),

  -- Info Banner
  ('myActivity.info.title', 'user', 'Privacy & Transparency banner title', 'user'),
  ('myActivity.info.description', 'user', 'Privacy info description', 'user'),

  -- Statistics
  ('myActivity.stats.total', 'user', 'Total Activities statistic', 'user'),
  ('myActivity.stats.thisPage', 'user', 'On This Page statistic', 'user'),
  ('myActivity.stats.protected', 'user', 'Data Protected statistic', 'user'),

  -- Privacy Notice
  ('myActivity.privacy.title', 'user', 'Your Privacy Rights title', 'user'),
  ('myActivity.privacy.ferpa', 'user', 'FERPA protection info', 'user'),
  ('myActivity.privacy.access', 'user', 'Access review rights info', 'user'),
  ('myActivity.privacy.retention', 'user', 'Data retention info', 'user'),
  ('myActivity.privacy.security', 'user', 'Security encryption info', 'user'),

  -- Messages
  ('myActivity.noActivities', 'user', 'No activities found message', 'user')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- HEBREW TRANSLATIONS
-- ============================================================================

INSERT INTO public.translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Common - Hebrew
  ('he', 'common.showing', 'מציג', 'common', 'both'),
  ('he', 'common.to', 'עד', 'common', 'both'),
  ('he', 'common.of', 'מתוך', 'common', 'both'),
  ('he', 'common.page', 'עמוד', 'common', 'both'),
  ('he', 'common.events', 'אירועים', 'common', 'both'),
  ('he', 'common.activities', 'פעילויות', 'common', 'both'),
  ('he', 'common.previous', 'הקודם', 'common', 'both'),
  ('he', 'common.next', 'הבא', 'common', 'both'),
  ('he', 'common.refresh', 'רענן', 'common', 'both'),
  ('he', 'common.export', 'ייצא', 'common', 'both'),
  ('he', 'common.filters', 'מסננים', 'common', 'both'),
  ('he', 'common.clear', 'נקה', 'common', 'both'),
  ('he', 'common.search', 'חיפוש', 'common', 'both'),
  ('he', 'common.loading', 'טוען...', 'common', 'both'),
  ('he', 'common.error', 'שגיאה', 'common', 'both'),
  ('he', 'common.noResults', 'לא נמצאו תוצאות', 'common', 'both'),

  -- Admin Audit - Hebrew
  ('he', 'admin.nav.security', 'אבטחה ותאימות', 'admin', 'admin'),
  ('he', 'admin.nav.audit', 'מעקב ביקורת', 'admin', 'admin'),
  ('he', 'admin.audit.title', 'מעקב ביקורת', 'admin', 'admin'),
  ('he', 'admin.audit.subtitle', 'מעקב אחר כל פעילות המערכת ואירועי תאימות', 'admin', 'admin'),
  ('he', 'admin.audit.stats.total', 'סה"כ אירועים', 'admin', 'admin'),
  ('he', 'admin.audit.stats.highRisk', 'סיכון גבוה', 'admin', 'admin'),
  ('he', 'admin.audit.stats.failed', 'פעולות שנכשלו', 'admin', 'admin'),
  ('he', 'admin.audit.stats.today', '24 שעות אחרונות', 'admin', 'admin'),
  ('he', 'admin.audit.filters.dateFrom', 'מתאריך', 'admin', 'admin'),
  ('he', 'admin.audit.filters.dateTo', 'עד תאריך', 'admin', 'admin'),
  ('he', 'admin.audit.filters.eventTypes', 'סוגי אירועים', 'admin', 'admin'),
  ('he', 'admin.audit.filters.categories', 'קטגוריות', 'admin', 'admin'),
  ('he', 'admin.audit.filters.riskLevels', 'רמות סיכון', 'admin', 'admin'),
  ('he', 'admin.audit.filters.status', 'סטטוס', 'admin', 'admin'),
  ('he', 'admin.audit.filters.searchPlaceholder', 'חפש פעולות, תיאורים, משתמשים...', 'admin', 'admin'),
  ('he', 'admin.audit.table.time', 'זמן', 'admin', 'admin'),
  ('he', 'admin.audit.table.user', 'משתמש', 'admin', 'admin'),
  ('he', 'admin.audit.table.action', 'פעולה', 'admin', 'admin'),
  ('he', 'admin.audit.table.resource', 'משאב', 'admin', 'admin'),
  ('he', 'admin.audit.table.type', 'סוג', 'admin', 'admin'),
  ('he', 'admin.audit.table.risk', 'סיכון', 'admin', 'admin'),
  ('he', 'admin.audit.table.status', 'סטטוס', 'admin', 'admin'),
  ('he', 'admin.audit.table.details', 'פרטים', 'admin', 'admin'),
  ('he', 'admin.audit.details.eventDetails', 'פרטי אירוע', 'admin', 'admin'),
  ('he', 'admin.audit.details.network', 'רשת', 'admin', 'admin'),
  ('he', 'admin.audit.details.compliance', 'תאימות', 'admin', 'admin'),
  ('he', 'admin.audit.details.changes', 'שינויים', 'admin', 'admin'),
  ('he', 'admin.audit.details.before', 'לפני', 'admin', 'admin'),
  ('he', 'admin.audit.details.after', 'אחרי', 'admin', 'admin'),
  ('he', 'admin.audit.details.changedFields', 'שדות ששונו', 'admin', 'admin'),
  ('he', 'admin.audit.noEvents', 'לא נמצאו אירועי ביקורת', 'admin', 'admin'),
  ('he', 'admin.audit.exportSoon', 'פונקציונליות ייצוא תגיע בקרוב', 'admin', 'admin'),
  ('he', 'admin.audit.loadError', 'נכשל בטעינת אירועי ביקורת', 'admin', 'admin'),

  -- User Activity - Hebrew
  ('he', 'myActivity.title', 'הפעילות שלי', 'user', 'user'),
  ('he', 'myActivity.subtitle', 'צפה בפעילות החשבון והיסטוריית הגישה שלך', 'user', 'user'),
  ('he', 'myActivity.info.title', 'פרטיות ושקיפות', 'user', 'user'),
  ('he', 'myActivity.info.description', 'עמוד זה מציג את כל הפעילויות שבוצעו בחשבונך. אנו שומרים רישום זה לצורך האבטחה שלך ועל מנת לעמוד בחוקי פרטיות חינוכיים (FERPA).', 'user', 'user'),
  ('he', 'myActivity.stats.total', 'סה"כ פעילויות', 'user', 'user'),
  ('he', 'myActivity.stats.thisPage', 'בעמוד זה', 'user', 'user'),
  ('he', 'myActivity.stats.protected', 'נתונים מוגנים', 'user', 'user'),
  ('he', 'myActivity.privacy.title', 'זכויות הפרטיות שלך', 'user', 'user'),
  ('he', 'myActivity.privacy.ferpa', 'הרשומות החינוכיות שלך מוגנות תחת תקנות FERPA', 'user', 'user'),
  ('he', 'myActivity.privacy.access', 'יש לך את הזכות לבדוק מי ניגש למידע שלך', 'user', 'user'),
  ('he', 'myActivity.privacy.retention', 'יומני פעילות נשמרים למשך 7 שנים למטרות תאימות', 'user', 'user'),
  ('he', 'myActivity.privacy.security', 'כל הפעילות מוצפנת ומוגנת מפני חבלה לביטחונך', 'user', 'user'),
  ('he', 'myActivity.noActivities', 'לא נמצאו פעילויות', 'user', 'user')
ON CONFLICT (language_code, translation_key) DO NOTHING;

-- ============================================================================
-- ENGLISH TRANSLATIONS
-- ============================================================================

INSERT INTO public.translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Common - English
  ('en', 'common.showing', 'Showing', 'common', 'both'),
  ('en', 'common.to', 'to', 'common', 'both'),
  ('en', 'common.of', 'of', 'common', 'both'),
  ('en', 'common.page', 'Page', 'common', 'both'),
  ('en', 'common.events', 'events', 'common', 'both'),
  ('en', 'common.activities', 'activities', 'common', 'both'),
  ('en', 'common.previous', 'Previous', 'common', 'both'),
  ('en', 'common.next', 'Next', 'common', 'both'),
  ('en', 'common.refresh', 'Refresh', 'common', 'both'),
  ('en', 'common.export', 'Export', 'common', 'both'),
  ('en', 'common.filters', 'Filters', 'common', 'both'),
  ('en', 'common.clear', 'Clear', 'common', 'both'),
  ('en', 'common.search', 'Search', 'common', 'both'),
  ('en', 'common.loading', 'Loading...', 'common', 'both'),
  ('en', 'common.error', 'Error', 'common', 'both'),
  ('en', 'common.noResults', 'No results found', 'common', 'both'),

  -- Admin Audit - English
  ('en', 'admin.nav.security', 'Security & Compliance', 'admin', 'admin'),
  ('en', 'admin.nav.audit', 'Audit Trail', 'admin', 'admin'),
  ('en', 'admin.audit.title', 'Audit Trail', 'admin', 'admin'),
  ('en', 'admin.audit.subtitle', 'Monitor all system activities and compliance events', 'admin', 'admin'),
  ('en', 'admin.audit.stats.total', 'Total Events', 'admin', 'admin'),
  ('en', 'admin.audit.stats.highRisk', 'High Risk', 'admin', 'admin'),
  ('en', 'admin.audit.stats.failed', 'Failed Actions', 'admin', 'admin'),
  ('en', 'admin.audit.stats.today', 'Last 24 Hours', 'admin', 'admin'),
  ('en', 'admin.audit.filters.dateFrom', 'From Date', 'admin', 'admin'),
  ('en', 'admin.audit.filters.dateTo', 'To Date', 'admin', 'admin'),
  ('en', 'admin.audit.filters.eventTypes', 'Event Types', 'admin', 'admin'),
  ('en', 'admin.audit.filters.categories', 'Categories', 'admin', 'admin'),
  ('en', 'admin.audit.filters.riskLevels', 'Risk Levels', 'admin', 'admin'),
  ('en', 'admin.audit.filters.status', 'Status', 'admin', 'admin'),
  ('en', 'admin.audit.filters.searchPlaceholder', 'Search actions, descriptions, users...', 'admin', 'admin'),
  ('en', 'admin.audit.table.time', 'Time', 'admin', 'admin'),
  ('en', 'admin.audit.table.user', 'User', 'admin', 'admin'),
  ('en', 'admin.audit.table.action', 'Action', 'admin', 'admin'),
  ('en', 'admin.audit.table.resource', 'Resource', 'admin', 'admin'),
  ('en', 'admin.audit.table.type', 'Type', 'admin', 'admin'),
  ('en', 'admin.audit.table.risk', 'Risk', 'admin', 'admin'),
  ('en', 'admin.audit.table.status', 'Status', 'admin', 'admin'),
  ('en', 'admin.audit.table.details', 'Details', 'admin', 'admin'),
  ('en', 'admin.audit.details.eventDetails', 'Event Details', 'admin', 'admin'),
  ('en', 'admin.audit.details.network', 'Network', 'admin', 'admin'),
  ('en', 'admin.audit.details.compliance', 'Compliance', 'admin', 'admin'),
  ('en', 'admin.audit.details.changes', 'Changes', 'admin', 'admin'),
  ('en', 'admin.audit.details.before', 'Before', 'admin', 'admin'),
  ('en', 'admin.audit.details.after', 'After', 'admin', 'admin'),
  ('en', 'admin.audit.details.changedFields', 'Changed fields', 'admin', 'admin'),
  ('en', 'admin.audit.noEvents', 'No audit events found', 'admin', 'admin'),
  ('en', 'admin.audit.exportSoon', 'Export functionality coming soon', 'admin', 'admin'),
  ('en', 'admin.audit.loadError', 'Failed to load audit events', 'admin', 'admin'),

  -- User Activity - English
  ('en', 'myActivity.title', 'My Activity', 'user', 'user'),
  ('en', 'myActivity.subtitle', 'View your account activity and access history', 'user', 'user'),
  ('en', 'myActivity.info.title', 'Privacy & Transparency', 'user', 'user'),
  ('en', 'myActivity.info.description', 'This page shows all activities performed on your account. We keep this record for your security and to comply with educational privacy laws (FERPA).', 'user', 'user'),
  ('en', 'myActivity.stats.total', 'Total Activities', 'user', 'user'),
  ('en', 'myActivity.stats.thisPage', 'On This Page', 'user', 'user'),
  ('en', 'myActivity.stats.protected', 'Data Protected', 'user', 'user'),
  ('en', 'myActivity.privacy.title', 'Your Privacy Rights', 'user', 'user'),
  ('en', 'myActivity.privacy.ferpa', 'Your educational records are protected under FERPA regulations', 'user', 'user'),
  ('en', 'myActivity.privacy.access', 'You have the right to review who accessed your information', 'user', 'user'),
  ('en', 'myActivity.privacy.retention', 'Activity logs are retained for 7 years for compliance purposes', 'user', 'user'),
  ('en', 'myActivity.privacy.security', 'All activity is encrypted and tamper-proof for your security', 'user', 'user'),
  ('en', 'myActivity.noActivities', 'No activities found', 'user', 'user')
ON CONFLICT (language_code, translation_key) DO NOTHING;

-- ============================================================================
-- DONE! All audit trail translations added.
-- Total: ~90 translation keys with Hebrew + English translations
-- ============================================================================

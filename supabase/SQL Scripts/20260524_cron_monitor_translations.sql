-- Translations for /admin/crons (cron monitor page) + the sidebar nav
-- entry that links to it. Hebrew translations are first-pass natural
-- phrasing.
--
-- Idempotency: there's no unique constraint on
-- (translation_key, language_code, tenant_id) in this DB, so an
-- ON CONFLICT upsert fails with 42P10. Instead we DELETE-then-INSERT
-- inside a single transaction (the DO block runs as one tx) — safe to
-- re-run.
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  DELETE FROM translations
   WHERE tenant_id = tenant_uuid
     AND (
       translation_key = 'admin.nav.crons'
       OR translation_key LIKE 'admin.crons.%'
     );

  -- Column is `context` (not `category`) — the translations API filters
  -- on `context IN ('admin', 'both')`, so rows inserted into `category`
  -- come back invisible. A previous migration template (20251126_…) had
  -- the same bug; if you re-seeded from it, those rows are silently
  -- dropped by the API too.
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- Nav
    ('en', 'admin.nav.crons',                  'Cron monitor',           'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.nav.crons',                  'ניטור משימות מתוזמנות',  'admin', NOW(), NOW(), tenant_uuid),

    -- Page header
    ('en', 'admin.crons.title',                'Cron monitor',           'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.title',                'ניטור משימות מתוזמנות',  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.subtitle',             'Last 100 cron runs. Auto-refreshes every 10s. Failed or stuck crons appear first in the per-cron health row.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.subtitle',             '100 ההרצות האחרונות. מתעדכן אוטומטית כל 10 שניות. משימות שנכשלו או תקועות מודגשות בשורת הסטטוס שלמעלה.', 'admin', NOW(), NOW(), tenant_uuid),

    -- Actions
    ('en', 'admin.crons.refresh',              'Refresh',                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.refresh',              'רענן',                   'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.filter',               'Filter',                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.filter',               'סינון',                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.allCrons',             'All crons',              'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.allCrons',             'כל המשימות',             'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.allStatuses',          'All statuses',           'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.allStatuses',          'כל הסטטוסים',            'admin', NOW(), NOW(), tenant_uuid),

    -- Status pills
    ('en', 'admin.crons.status.success',       'Success',                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.status.success',       'הצלחה',                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.status.failed',        'Failed',                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.status.failed',        'נכשל',                   'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.status.running',       'Running',                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.status.running',       'בריצה',                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.status.dryRun',        'Dry-run',                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.status.dryRun',        'הרצת בדיקה',             'admin', NOW(), NOW(), tenant_uuid),

    -- Empty / loading states
    ('en', 'admin.crons.noRunsYet',            'No runs yet',            'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.noRunsYet',            'אין הרצות עדיין',        'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.loading',              'Loading…',               'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.loading',              'טוען…',                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.empty',                'No runs yet. Crons will log here on their next tick after the cron_runs migration is applied and the new code is deployed.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.empty',                'אין הרצות עדיין. משימות יירשמו כאן בסיבוב הבא לאחר החלת המיגרציה ופריסת הקוד החדש.', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.runCount',             '{{count}} runs',         'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.runCount',             '{{count}} הרצות',        'admin', NOW(), NOW(), tenant_uuid),

    -- Table columns
    ('en', 'admin.crons.col.when',             'When',                   'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.col.when',             'מתי',                    'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.col.cron',             'Cron',                   'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.col.cron',             'משימה',                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.col.status',           'Status',                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.col.status',           'סטטוס',                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.col.duration',         'Duration',               'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.col.duration',         'משך',                    'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.col.result',           'Result',                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.col.result',           'תוצאה',                  'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Cron monitor translations added successfully';
END$$;

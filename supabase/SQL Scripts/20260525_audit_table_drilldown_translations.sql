-- Audit drill-down labels. The expanded panel now focuses on WHAT
-- CHANGED in plain terms — not technical metadata (IDs, IP addresses,
-- user agents) which were noise for non-tech admins.
--
-- For UPDATE rows the before/after diff already had its own labels;
-- the only new strings here are headings for CREATE/DELETE payload
-- summaries.
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Clean up any earlier technical-noise labels we no longer use.
  DELETE FROM translations
   WHERE tenant_id = tenant_uuid
     AND translation_key IN (
       'admin.audit.details.description',
       'admin.audit.details.resourceId',
       'admin.audit.details.ipAddress',
       'admin.audit.details.userAgent',
       'admin.audit.details.sessionId',
       'admin.audit.details.metadata',
       'admin.audit.details.created',
       'admin.audit.details.deleted'
     );

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'admin.audit.details.created',  'What was created', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.audit.details.created',  'מה נוצר',          'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.audit.details.deleted',  'What was deleted', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.audit.details.deleted',  'מה נמחק',          'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Audit drilldown translations updated (technical labels removed, plain-language created/deleted headings added)';
END$$;

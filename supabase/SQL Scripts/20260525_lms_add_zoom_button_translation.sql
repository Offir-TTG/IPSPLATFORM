-- Translation for the new "Add Zoom" per-row button on the course
-- management page. Previously only "Add Daily.co" was offered for
-- lessons without a meeting, which forced Daily even when the admin
-- had picked Zoom in the new-lesson dialog (whose Zoom endpoint
-- silently 404'd, leaving no Zoom session on the lesson).
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
     AND translation_key = 'lms.builder.add_zoom';

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'lms.builder.add_zoom', 'Add Zoom',     'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'lms.builder.add_zoom', 'הוסף Zoom',    'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Add Zoom button translation added';
END$$;

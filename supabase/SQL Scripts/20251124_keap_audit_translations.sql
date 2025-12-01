-- Migration: Add Keap audit event translations
-- Adds Hebrew and English translations for Keap CRM sync audit events

-- Generate a fixed UUID for this tenant's translations
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant's UUID, or use a default
  SELECT id INTO tenant_uuid FROM public.tenants LIMIT 1;
  IF tenant_uuid IS NULL THEN
    tenant_uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
  END IF;

  -- Delete existing audit translations if they exist
  DELETE FROM public.translations WHERE translation_key LIKE 'audit.keap.%' OR translation_key LIKE 'audit.event_%';

  -- English translations for Keap audit events
  INSERT INTO public.translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    -- Keap Sync Actions
    ('en', 'audit.keap.sync_tags', 'Synced Keap tags', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.keap.sync_tags_desc', 'Fetched {count} tags from Keap CRM', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.keap.create_tag', 'Created Keap tag', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.keap.create_tag_desc', 'Created tag "{name}"', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.keap.bulk_sync', 'Bulk sync students to Keap', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.keap.bulk_sync_desc', 'Synced {synced} students, {failed} failed', 'audit', NOW(), NOW(), tenant_uuid),

    -- Event types
    ('en', 'audit.event_type.sync', 'Sync', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.event_type.create', 'Create', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.event_type.read', 'Read', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.event_type.update', 'Update', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.event_type.delete', 'Delete', 'audit', NOW(), NOW(), tenant_uuid),

    -- Event categories
    ('en', 'audit.event_category.system', 'System', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.event_category.integration', 'Integration', 'audit', NOW(), NOW(), tenant_uuid);

  -- Hebrew translations for Keap audit events
  INSERT INTO public.translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    -- Keap Sync Actions
    ('he', 'audit.keap.sync_tags', 'סנכרון תגיות Keap', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.keap.sync_tags_desc', 'נמשכו {count} תגיות מ-Keap CRM', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.keap.create_tag', 'יצירת תגית Keap', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.keap.create_tag_desc', 'נוצרה תגית "{name}"', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.keap.bulk_sync', 'סנכרון המוני של תלמידים ל-Keap', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.keap.bulk_sync_desc', 'סונכרנו {synced} תלמידים, {failed} נכשלו', 'audit', NOW(), NOW(), tenant_uuid),

    -- Event types
    ('he', 'audit.event_type.sync', 'סנכרון', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.event_type.create', 'יצירה', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.event_type.read', 'קריאה', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.event_type.update', 'עדכון', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.event_type.delete', 'מחיקה', 'audit', NOW(), NOW(), tenant_uuid),

    -- Event categories
    ('he', 'audit.event_category.system', 'מערכת', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.event_category.integration', 'אינטגרציה', 'audit', NOW(), NOW(), tenant_uuid);

END $$;

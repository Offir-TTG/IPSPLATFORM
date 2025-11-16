-- ============================================================================
-- MULTITENANCY: MIGRATE EXISTING DATA TO DEFAULT TENANT
-- ============================================================================
-- This script creates a default tenant and migrates all existing data to it.
-- Run this AFTER adding tenant_id columns (02-add-tenant-id-columns.sql)
-- Run this BEFORE creating RLS functions (04-tenant-rls-functions.sql)
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE DEFAULT TENANT
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_admin_email TEXT;
  v_admin_user_id UUID;
BEGIN
  -- Check if default tenant already exists
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE slug = 'default';

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'Creating default tenant...';

    -- Try to get first admin user's email
    SELECT id, email INTO v_admin_user_id, v_admin_email
    FROM auth.users
    WHERE email IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1;

    -- Use fallback if no users exist yet
    IF v_admin_email IS NULL THEN
      v_admin_email := 'admin@ipsplatform.com';
    END IF;

    -- Create default tenant
    INSERT INTO tenants (
      name,
      slug,
      status,
      subscription_tier,
      admin_email,
      admin_name,
      default_language,
      timezone,
      currency,
      currency_symbol,
      currency_position,
      max_users,
      max_courses,
      max_storage_gb,
      max_instructors,
      enabled_features,
      created_by
    ) VALUES (
      'Default Organization',
      'default',
      'active',
      'enterprise', -- Give default tenant full features
      v_admin_email,
      'Platform Administrator',
      'en',
      'UTC',
      'USD',
      '$',
      'before',
      1000, -- High limits for default tenant
      500,
      100,
      100,
      '{"courses": true, "zoom": true, "docusign": true}'::jsonb,
      v_admin_user_id
    )
    RETURNING id INTO v_tenant_id;

    RAISE NOTICE '✅ Default tenant created with ID: %', v_tenant_id;
  ELSE
    RAISE NOTICE 'ℹ️  Default tenant already exists with ID: %', v_tenant_id;
  END IF;

  -- Store tenant_id for use in subsequent steps
  CREATE TEMP TABLE IF NOT EXISTS temp_default_tenant (tenant_id UUID);
  DELETE FROM temp_default_tenant;
  INSERT INTO temp_default_tenant VALUES (v_tenant_id);
END $$;

-- ============================================================================
-- STEP 2: MIGRATE DATA TO DEFAULT TENANT
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_updated_count INTEGER;
  v_total_updates INTEGER := 0;
BEGIN
  -- Get default tenant ID
  SELECT tenant_id INTO v_tenant_id FROM temp_default_tenant;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migrating data to tenant: %', v_tenant_id;
  RAISE NOTICE '============================================';

  -- users
  UPDATE users SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ users: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- programs
  UPDATE programs SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM programs LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ programs: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- courses
  UPDATE courses SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM courses LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ courses: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- lessons
  UPDATE lessons SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM lessons LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ lessons: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- enrollments
  UPDATE enrollments SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM enrollments LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ enrollments: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- payments
  UPDATE payments SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM payments LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ payments: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- languages
  UPDATE languages SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ languages: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- translations
  UPDATE translations SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ translations: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- translation_keys
  UPDATE translation_keys SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ translation_keys: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- ui_text_values
  UPDATE ui_text_values SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM ui_text_values LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ ui_text_values: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- theme_configs
  UPDATE theme_configs SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM theme_configs LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ theme_configs: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- platform_settings
  UPDATE platform_settings SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM platform_settings LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ platform_settings: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- navigation_items
  UPDATE navigation_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM navigation_items LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ navigation_items: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- feature_flags
  UPDATE feature_flags SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM feature_flags LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ feature_flags: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- page_content
  UPDATE page_content SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM page_content LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ page_content: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- page_sections
  UPDATE page_sections SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM page_sections LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ page_sections: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- email_templates
  UPDATE email_templates SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM email_templates LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ email_templates: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- form_fields
  UPDATE form_fields SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM form_fields LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ form_fields: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- integrations
  UPDATE integrations SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM integrations LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ integrations: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- docusign_envelopes
  UPDATE docusign_envelopes SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM docusign_envelopes LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ docusign_envelopes: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- zoom_meetings
  UPDATE zoom_meetings SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM zoom_meetings LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ zoom_meetings: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- recordings
  UPDATE recordings SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM recordings LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ recordings: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- notifications
  UPDATE notifications SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM notifications LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ notifications: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  -- AUDIT TABLES (CRITICAL)
  UPDATE audit_events SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM audit_events LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ audit_events: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  UPDATE audit_config SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM audit_config LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ audit_config: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  UPDATE audit_sessions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM audit_sessions LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ audit_sessions: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  UPDATE parental_consent_audit SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM parental_consent_audit LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ parental_consent_audit: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  UPDATE audit_reports SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM audit_reports LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ audit_reports: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  UPDATE audit_alerts SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM audit_alerts LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ audit_alerts: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  UPDATE audit_compliance_snapshots SET tenant_id = v_tenant_id WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM audit_compliance_snapshots LIMIT 1);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ audit_compliance_snapshots: % rows', v_updated_count;
    v_total_updates := v_total_updates + v_updated_count;
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total rows migrated: %', v_total_updates;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- STEP 3: ADD ADMIN USERS TO tenant_users TABLE
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_user_record RECORD;
  v_added_count INTEGER := 0;
BEGIN
  -- Get default tenant ID
  SELECT tenant_id INTO v_tenant_id FROM temp_default_tenant;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Adding users to tenant_users table...';
  RAISE NOTICE '============================================';

  -- Add all existing users to tenant_users table
  FOR v_user_record IN
    SELECT u.id, u.email, u.role, u.created_at
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.user_id = u.id
      AND tu.tenant_id = v_tenant_id
    )
  LOOP
    INSERT INTO tenant_users (
      tenant_id,
      user_id,
      role,
      status,
      joined_at,
      created_at
    ) VALUES (
      v_tenant_id,
      v_user_record.id,
      COALESCE(v_user_record.role, 'student'), -- Map user.role to tenant_users.role
      'active',
      v_user_record.created_at,
      NOW()
    );

    v_added_count := v_added_count + 1;
  END LOOP;

  RAISE NOTICE '✅ Added % users to tenant_users', v_added_count;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- STEP 4: MAKE tenant_id NOT NULL AND ADD FOREIGN KEYS
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM temp_default_tenant;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Making tenant_id NOT NULL and adding foreign keys...';
  RAISE NOTICE '============================================';

  -- Core tables
  ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  RAISE NOTICE '✅ users';

  ALTER TABLE languages ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE languages ADD CONSTRAINT fk_languages_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  RAISE NOTICE '✅ languages';

  ALTER TABLE translations ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE translations ADD CONSTRAINT fk_translations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  RAISE NOTICE '✅ translations';

  ALTER TABLE translation_keys ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE translation_keys ADD CONSTRAINT fk_translation_keys_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  RAISE NOTICE '✅ translation_keys';

  -- Optional tables (only if they have data)
  IF EXISTS (SELECT 1 FROM programs LIMIT 1) THEN
    ALTER TABLE programs ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE programs ADD CONSTRAINT fk_programs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    RAISE NOTICE '✅ programs';
  END IF;

  IF EXISTS (SELECT 1 FROM courses LIMIT 1) THEN
    ALTER TABLE courses ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE courses ADD CONSTRAINT fk_courses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    RAISE NOTICE '✅ courses';
  END IF;

  IF EXISTS (SELECT 1 FROM theme_configs LIMIT 1) THEN
    ALTER TABLE theme_configs ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE theme_configs ADD CONSTRAINT fk_theme_configs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    RAISE NOTICE '✅ theme_configs';
  END IF;

  IF EXISTS (SELECT 1 FROM audit_events LIMIT 1) THEN
    ALTER TABLE audit_events ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE audit_events ADD CONSTRAINT fk_audit_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    RAISE NOTICE '✅ audit_events';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run 04-tenant-rls-functions.sql';
  RAISE NOTICE '============================================';
END $$;

-- Cleanup temp table
DROP TABLE IF EXISTS temp_default_tenant;

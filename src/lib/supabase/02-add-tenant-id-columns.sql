-- ============================================================================
-- MULTITENANCY: ADD TENANT_ID TO ALL TABLES
-- ============================================================================
-- This script adds tenant_id columns to all existing tables.
-- Run this AFTER creating tenant management tables (01-tenant-schema.sql)
-- Run this BEFORE migrating data (03-migrate-to-default-tenant.sql)
-- ============================================================================

-- ============================================================================
-- CORE USER & AUTH TABLES
-- ============================================================================

-- users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- ============================================================================
-- EDUCATIONAL CONTENT TABLES
-- ============================================================================

-- programs table
ALTER TABLE IF EXISTS programs ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_programs_tenant ON programs(tenant_id) WHERE tenant_id IS NOT NULL;

-- courses table
ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_courses_tenant ON courses(tenant_id) WHERE tenant_id IS NOT NULL;

-- lessons table
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_lessons_tenant ON lessons(tenant_id) WHERE tenant_id IS NOT NULL;

-- enrollments table
ALTER TABLE IF EXISTS enrollments ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_enrollments_tenant ON enrollments(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- PAYMENT & BILLING TABLES
-- ============================================================================

-- payments table
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- LANGUAGE & TRANSLATION TABLES
-- ============================================================================

-- languages table
ALTER TABLE languages ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_languages_tenant ON languages(tenant_id);

-- translations table
ALTER TABLE translations ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_translations_tenant ON translations(tenant_id);

-- translation_keys table (can be global, but add tenant_id for custom keys)
ALTER TABLE translation_keys ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_translation_keys_tenant ON translation_keys(tenant_id) WHERE tenant_id IS NOT NULL;

-- ui_text_values table
ALTER TABLE IF EXISTS ui_text_values ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_ui_text_values_tenant ON ui_text_values(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- THEME & DESIGN TABLES
-- ============================================================================

-- theme_configs table
ALTER TABLE IF EXISTS theme_configs ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_theme_configs_tenant ON theme_configs(tenant_id) WHERE tenant_id IS NOT NULL;

-- theme_config table (legacy - if exists)
ALTER TABLE IF EXISTS theme_config ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_theme_config_tenant ON theme_config(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- PLATFORM CONFIGURATION TABLES
-- ============================================================================

-- platform_settings table
ALTER TABLE IF EXISTS platform_settings ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_platform_settings_tenant ON platform_settings(tenant_id) WHERE tenant_id IS NOT NULL;

-- navigation_items table
ALTER TABLE IF EXISTS navigation_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_navigation_items_tenant ON navigation_items(tenant_id) WHERE tenant_id IS NOT NULL;

-- feature_flags table
ALTER TABLE IF EXISTS feature_flags ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant ON feature_flags(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- CONTENT MANAGEMENT TABLES
-- ============================================================================

-- page_content table
ALTER TABLE IF EXISTS page_content ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_page_content_tenant ON page_content(tenant_id) WHERE tenant_id IS NOT NULL;

-- page_sections table
ALTER TABLE IF EXISTS page_sections ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_page_sections_tenant ON page_sections(tenant_id) WHERE tenant_id IS NOT NULL;

-- email_templates table
ALTER TABLE IF EXISTS email_templates ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id) WHERE tenant_id IS NOT NULL;

-- form_fields table
ALTER TABLE IF EXISTS form_fields ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_form_fields_tenant ON form_fields(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- INTEGRATION TABLES
-- ============================================================================

-- integrations table
ALTER TABLE IF EXISTS integrations ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id) WHERE tenant_id IS NOT NULL;

-- docusign_envelopes table
ALTER TABLE IF EXISTS docusign_envelopes ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_tenant ON docusign_envelopes(tenant_id) WHERE tenant_id IS NOT NULL;

-- zoom_meetings table
ALTER TABLE IF EXISTS zoom_meetings ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_tenant ON zoom_meetings(tenant_id) WHERE tenant_id IS NOT NULL;

-- recordings table
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_recordings_tenant ON recordings(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- NOTIFICATION TABLES
-- ============================================================================

-- notifications table
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- AUDIT TRAIL TABLES (CRITICAL - MUST BE TENANT-ISOLATED)
-- ============================================================================

-- audit_events table
ALTER TABLE IF EXISTS audit_events ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant ON audit_events(tenant_id);

-- audit_config table
ALTER TABLE IF EXISTS audit_config ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_audit_config_tenant ON audit_config(tenant_id) WHERE tenant_id IS NOT NULL;

-- audit_sessions table
ALTER TABLE IF EXISTS audit_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_audit_sessions_tenant ON audit_sessions(tenant_id) WHERE tenant_id IS NOT NULL;

-- parental_consent_audit table
ALTER TABLE IF EXISTS parental_consent_audit ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_parental_consent_audit_tenant ON parental_consent_audit(tenant_id) WHERE tenant_id IS NOT NULL;

-- audit_reports table
ALTER TABLE IF EXISTS audit_reports ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_audit_reports_tenant ON audit_reports(tenant_id) WHERE tenant_id IS NOT NULL;

-- audit_alerts table
ALTER TABLE IF EXISTS audit_alerts ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_audit_alerts_tenant ON audit_alerts(tenant_id) WHERE tenant_id IS NOT NULL;

-- audit_compliance_snapshots table
ALTER TABLE IF EXISTS audit_compliance_snapshots ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_audit_compliance_snapshots_tenant ON audit_compliance_snapshots(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- List all tables with tenant_id column
DO $$
DECLARE
  table_record RECORD;
  tenant_column_count INTEGER := 0;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables with tenant_id column added:';
  RAISE NOTICE '============================================';

  FOR table_record IN
    SELECT
      table_name,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = t.table_name
        AND column_name = 'tenant_id'
      ) as has_tenant_id
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT IN ('tenants', 'tenant_users', 'tenant_invitations', 'tenant_usage_metrics')
    ORDER BY table_name
  LOOP
    IF table_record.has_tenant_id THEN
      RAISE NOTICE '✅ %', table_record.table_name;
      tenant_column_count := tenant_column_count + 1;
    ELSE
      RAISE NOTICE '⚠️  % (no tenant_id - may be intentional)', table_record.table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total tables with tenant_id: %', tenant_column_count;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ tenant_id columns added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run 03-migrate-to-default-tenant.sql';
END $$;

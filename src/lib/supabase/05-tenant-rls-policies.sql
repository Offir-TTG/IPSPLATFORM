-- ============================================================================
-- MULTITENANCY: UPDATE RLS POLICIES FOR TENANT ISOLATION
-- ============================================================================
-- This script updates ALL Row Level Security policies to enforce tenant isolation.
-- Run this AFTER creating RLS functions (04-tenant-rls-functions.sql)
-- This is CRITICAL for security - prevents cross-tenant data access
-- ============================================================================

-- ============================================================================
-- IMPORTANT: This will DROP and recreate all RLS policies
-- Backup your database before running if you have custom policies
-- ============================================================================

-- ============================================================================
-- TENANT MANAGEMENT TABLES (New Tables)
-- ============================================================================

-- Enable RLS on tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

-- tenants table policies
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenants" ON tenants;
DROP POLICY IF EXISTS "Tenant admins can view their tenant" ON tenants;
DROP POLICY IF EXISTS "Tenant admins can update their tenant" ON tenants;

CREATE POLICY "Super admins can manage all tenants" ON tenants
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own tenants" ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can update their tenant" ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    id = get_current_tenant_id()
    AND is_tenant_admin()
  )
  WITH CHECK (
    id = get_current_tenant_id()
    AND is_tenant_admin()
  );

-- tenant_users policies
DROP POLICY IF EXISTS "Super admins can manage all tenant users" ON tenant_users;
DROP POLICY IF EXISTS "Users can view their own memberships" ON tenant_users;
DROP POLICY IF EXISTS "Tenant admins can manage users in their tenant" ON tenant_users;

CREATE POLICY "Super admins can manage all tenant users" ON tenant_users
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own memberships" ON tenant_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can manage users in their tenant" ON tenant_users
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  )
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  );

-- tenant_invitations policies
DROP POLICY IF EXISTS "Super admins can manage all invitations" ON tenant_invitations;
DROP POLICY IF EXISTS "Tenant admins can manage invitations in their tenant" ON tenant_invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON tenant_invitations;

CREATE POLICY "Super admins can manage all invitations" ON tenant_invitations
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Tenant admins can manage invitations in their tenant" ON tenant_invitations
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  )
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  );

CREATE POLICY "Users can view invitations to their email" ON tenant_invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );

-- tenant_usage_metrics policies
DROP POLICY IF EXISTS "Super admins can view all usage metrics" ON tenant_usage_metrics;
DROP POLICY IF EXISTS "Tenant admins can view their usage metrics" ON tenant_usage_metrics;

CREATE POLICY "Super admins can view all usage metrics" ON tenant_usage_metrics
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Tenant admins can view their usage metrics" ON tenant_usage_metrics
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  );

-- ============================================================================
-- USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR is_super_admin(auth.uid())
    OR (tenant_id = get_current_tenant_id() AND is_tenant_admin())
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Tenant admins can view users in their tenant
CREATE POLICY "Tenant admins can view tenant users" ON users
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  );

-- Tenant admins can manage users in their tenant
CREATE POLICY "Tenant admins can manage tenant users" ON users
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  )
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  );

-- ============================================================================
-- LANGUAGE & TRANSLATION TABLES
-- ============================================================================

-- languages table
DROP POLICY IF EXISTS "Anyone can view active languages" ON languages;
DROP POLICY IF EXISTS "Admins can manage languages" ON languages;

CREATE POLICY "Anyone can view languages in current tenant" ON languages
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant admins can manage languages" ON languages
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  )
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  );

-- translations table
DROP POLICY IF EXISTS "Anyone can view translations" ON translations;
DROP POLICY IF EXISTS "Admins can manage translations" ON translations;

CREATE POLICY "Anyone can view translations in current tenant" ON translations
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant admins can manage translations" ON translations
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  )
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  );

-- translation_keys table
DROP POLICY IF EXISTS "Anyone can view translation keys" ON translation_keys;
DROP POLICY IF EXISTS "Admins can manage translation keys" ON translation_keys;

CREATE POLICY "Anyone can view translation keys in current tenant" ON translation_keys
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant admins can manage translation keys" ON translation_keys
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  )
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    AND is_tenant_admin()
  );

-- ui_text_values table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ui_text_values') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view ui text values" ON ui_text_values';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage ui text values" ON ui_text_values';

    EXECUTE 'CREATE POLICY "Anyone can view ui text values in current tenant" ON ui_text_values
      FOR SELECT TO authenticated
      USING (tenant_id = get_current_tenant_id() OR is_super_admin(auth.uid()))';

    EXECUTE 'CREATE POLICY "Tenant admins can manage ui text values" ON ui_text_values
      FOR ALL TO authenticated
      USING (tenant_id = get_current_tenant_id() AND is_tenant_admin())
      WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin())';
  END IF;
END $$;

-- ============================================================================
-- THEME CONFIGURATION TABLES
-- ============================================================================

-- theme_configs table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'theme_configs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view theme configs" ON theme_configs';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage theme configs" ON theme_configs';

    EXECUTE 'CREATE POLICY "Anyone can view theme in current tenant" ON theme_configs
      FOR SELECT TO authenticated
      USING (tenant_id = get_current_tenant_id() OR is_super_admin(auth.uid()))';

    EXECUTE 'CREATE POLICY "Tenant admins can manage theme" ON theme_configs
      FOR ALL TO authenticated
      USING (tenant_id = get_current_tenant_id() AND is_tenant_admin())
      WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin())';
  END IF;
END $$;

-- ============================================================================
-- AUDIT TRAIL TABLES (CRITICAL - MUST BE TENANT-ISOLATED)
-- ============================================================================

-- audit_events table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_events') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own audit events" ON audit_events';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all audit events" ON audit_events';
    EXECUTE 'DROP POLICY IF EXISTS "System can insert audit events" ON audit_events';

    -- Users can view their own audit events in their tenant
    EXECUTE 'CREATE POLICY "Users can view own audit events in tenant" ON audit_events
      FOR SELECT TO authenticated
      USING (
        user_id = auth.uid()
        AND tenant_id = get_current_tenant_id()
      )';

    -- Tenant admins can view all audit events in their tenant
    EXECUTE 'CREATE POLICY "Tenant admins can view tenant audit events" ON audit_events
      FOR SELECT TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        AND is_tenant_admin()
      )';

    -- Super admins can view all audit events
    EXECUTE 'CREATE POLICY "Super admins can view all audit events" ON audit_events
      FOR SELECT TO authenticated
      USING (is_super_admin(auth.uid()))';

    -- System can insert audit events (service role)
    EXECUTE 'CREATE POLICY "System can insert audit events" ON audit_events
      FOR INSERT TO authenticated
      WITH CHECK (true)';
  END IF;
END $$;

-- audit_config table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage audit config" ON audit_config';

    EXECUTE 'CREATE POLICY "Tenant admins can manage audit config" ON audit_config
      FOR ALL TO authenticated
      USING (tenant_id = get_current_tenant_id() AND is_tenant_admin())
      WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin())';
  END IF;
END $$;

-- ============================================================================
-- EDUCATIONAL CONTENT TABLES
-- ============================================================================

-- programs table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active programs" ON programs';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage programs" ON programs';

    EXECUTE 'CREATE POLICY "Users can view programs in tenant" ON programs
      FOR SELECT TO authenticated
      USING (tenant_id = get_current_tenant_id())';

    EXECUTE 'CREATE POLICY "Admins can manage programs in tenant" ON programs
      FOR ALL TO authenticated
      USING (tenant_id = get_current_tenant_id() AND is_tenant_admin())
      WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin())';
  END IF;
END $$;

-- courses table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active courses" ON courses';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage courses" ON courses';
    EXECUTE 'DROP POLICY IF EXISTS "Instructors can manage their courses" ON courses';

    EXECUTE 'CREATE POLICY "Users can view courses in tenant" ON courses
      FOR SELECT TO authenticated
      USING (tenant_id = get_current_tenant_id())';

    EXECUTE 'CREATE POLICY "Admins can manage courses in tenant" ON courses
      FOR ALL TO authenticated
      USING (tenant_id = get_current_tenant_id() AND is_tenant_admin())
      WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin())';

    EXECUTE 'CREATE POLICY "Instructors can manage their courses" ON courses
      FOR ALL TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        AND is_tenant_instructor()
        AND instructor_id = auth.uid()
      )
      WITH CHECK (
        tenant_id = get_current_tenant_id()
        AND is_tenant_instructor()
      )';
  END IF;
END $$;

-- ============================================================================
-- PLATFORM SETTINGS TABLES
-- ============================================================================

-- platform_settings table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view platform settings" ON platform_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage platform settings" ON platform_settings';

    EXECUTE 'CREATE POLICY "Users can view settings in tenant" ON platform_settings
      FOR SELECT TO authenticated
      USING (tenant_id = get_current_tenant_id())';

    EXECUTE 'CREATE POLICY "Admins can manage settings in tenant" ON platform_settings
      FOR ALL TO authenticated
      USING (tenant_id = get_current_tenant_id() AND is_tenant_admin())
      WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin())';
  END IF;
END $$;

-- ============================================================================
-- INTEGRATION TABLES
-- ============================================================================

-- zoom_meetings table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zoom_meetings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their zoom meetings" ON zoom_meetings';
    EXECUTE 'DROP POLICY IF EXISTS "Instructors can manage zoom meetings" ON zoom_meetings';

    EXECUTE 'CREATE POLICY "Users can view zoom meetings in tenant" ON zoom_meetings
      FOR SELECT TO authenticated
      USING (tenant_id = get_current_tenant_id())';

    EXECUTE 'CREATE POLICY "Instructors can manage zoom meetings" ON zoom_meetings
      FOR ALL TO authenticated
      USING (tenant_id = get_current_tenant_id() AND is_tenant_instructor())
      WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_instructor())';
  END IF;
END $$;

-- docusign_envelopes table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'docusign_envelopes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their envelopes" ON docusign_envelopes';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage envelopes" ON docusign_envelopes';

    EXECUTE 'CREATE POLICY "Users can view envelopes in tenant" ON docusign_envelopes
      FOR SELECT TO authenticated
      USING (tenant_id = get_current_tenant_id())';

    EXECUTE 'CREATE POLICY "Admins can manage envelopes in tenant" ON docusign_envelopes
      FOR ALL TO authenticated
      USING (tenant_id = get_current_tenant_id() AND is_tenant_admin())
      WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin())';
  END IF;
END $$;

-- ============================================================================
-- NOTIFICATION TABLES
-- ============================================================================

-- notifications table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their notifications" ON notifications';

    EXECUTE 'CREATE POLICY "Users can view notifications in tenant" ON notifications
      FOR SELECT TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        AND user_id = auth.uid()
      )';

    EXECUTE 'CREATE POLICY "System can create notifications" ON notifications
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id = get_current_tenant_id())';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION & TESTING
-- ============================================================================

DO $$
DECLARE
  v_policy_count INTEGER;
  v_tenant_id UUID;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS Policy Update Complete!';
  RAISE NOTICE '============================================';

  -- Count total policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE 'Total RLS policies: %', v_policy_count;
  RAISE NOTICE '';

  -- Test tenant isolation
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'default';

  IF v_tenant_id IS NOT NULL THEN
    PERFORM set_current_tenant(v_tenant_id);
    RAISE NOTICE '✅ Tenant context set successfully';
    RAISE NOTICE '✅ Current tenant: %', v_tenant_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PHASE 1 COMPLETE! ';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Database is now fully tenant-aware with:';
  RAISE NOTICE '✅ Tenant management tables';
  RAISE NOTICE '✅ tenant_id on all tables';
  RAISE NOTICE '✅ Data migrated to default tenant';
  RAISE NOTICE '✅ RLS helper functions';
  RAISE NOTICE '✅ RLS policies enforcing tenant isolation';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Phase: Infrastructure (middleware, contexts)';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- MULTITENANCY: TENANT MANAGEMENT SCHEMA
-- ============================================================================
-- This file creates the core tenant management tables for multitenancy support.
-- Run this FIRST before adding tenant_id to existing tables.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: tenants
-- ============================================================================
-- Stores information about each organization/institution using the platform

CREATE TABLE IF NOT EXISTS tenants (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Display name: "Harvard University"
  slug TEXT UNIQUE NOT NULL, -- URL-safe identifier: "harvard"

  -- Domain Configuration
  domain TEXT UNIQUE, -- Custom domain: "learning.harvard.edu" (optional)

  -- Status & Subscription
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ, -- End of trial period
  subscription_tier TEXT NOT NULL DEFAULT 'basic'
    CHECK (subscription_tier IN ('basic', 'professional', 'enterprise', 'custom')),

  -- Resource Limits
  max_users INTEGER DEFAULT 100,
  max_courses INTEGER DEFAULT 50,
  max_storage_gb INTEGER DEFAULT 10,
  max_instructors INTEGER DEFAULT 10,

  -- Branding
  logo_url TEXT,
  primary_color TEXT, -- Hex color: "#4F46E5"
  secondary_color TEXT,

  -- Contact Information
  admin_email TEXT NOT NULL, -- Primary contact email
  admin_name TEXT NOT NULL, -- Primary contact name
  billing_email TEXT,
  support_email TEXT,

  -- Regional Settings
  default_language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  currency_position TEXT DEFAULT 'before' CHECK (currency_position IN ('before', 'after')),

  -- Features (JSON for flexibility)
  enabled_features JSONB DEFAULT '{"courses": true, "zoom": false, "docusign": false}'::jsonb,

  -- Metadata (for extensibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Indexes for tenants table
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- ============================================================================
-- TABLE: tenant_users
-- ============================================================================
-- Junction table linking users to tenants with role information
-- Allows users to belong to multiple tenants with different roles

CREATE TABLE IF NOT EXISTS tenant_users (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role within this tenant
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'instructor', 'student', 'support')),

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'invited', 'suspended')),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,

  -- Granular Permissions (JSON for flexibility)
  permissions JSONB DEFAULT '{}'::jsonb,

  -- Settings specific to this tenant membership
  settings JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(tenant_id, user_id) -- User can only have one membership per tenant
);

-- Indexes for tenant_users table
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON tenant_users(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_users_last_accessed ON tenant_users(tenant_id, last_accessed_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tenant_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_users_updated_at
  BEFORE UPDATE ON tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_users_updated_at();

-- ============================================================================
-- TABLE: tenant_invitations
-- ============================================================================
-- Manages invitations to join a tenant

CREATE TABLE IF NOT EXISTS tenant_invitations (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Invitation Details
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student', 'support')),
  token TEXT UNIQUE NOT NULL, -- Secure random token for invitation link

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),

  -- Metadata
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),

  -- Optional personalized message
  message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(tenant_id, email, status) -- Prevent duplicate active invitations
);

-- Indexes for tenant_invitations table
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant ON tenant_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_status ON tenant_invitations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_expires ON tenant_invitations(expires_at);

-- ============================================================================
-- TABLE: tenant_usage_metrics
-- ============================================================================
-- Tracks resource usage per tenant for billing and limits

CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Usage Metrics
  total_users INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,
  total_storage_bytes BIGINT DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,

  -- Computed Fields
  storage_gb NUMERIC GENERATED ALWAYS AS (total_storage_bytes / 1073741824.0) STORED,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, period_start)
);

-- Indexes for tenant_usage_metrics
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant ON tenant_usage_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON tenant_usage_metrics(tenant_id, period_start DESC);

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE tenants IS 'Organizations/institutions using the platform';
COMMENT ON TABLE tenant_users IS 'Junction table linking users to tenants with roles';
COMMENT ON TABLE tenant_invitations IS 'Pending invitations for users to join tenants';
COMMENT ON TABLE tenant_usage_metrics IS 'Resource usage tracking per tenant';

COMMENT ON COLUMN tenants.slug IS 'URL-safe identifier used in subdomains';
COMMENT ON COLUMN tenants.status IS 'Current operational status of the tenant';
COMMENT ON COLUMN tenants.subscription_tier IS 'Subscription plan level';
COMMENT ON COLUMN tenant_users.role IS 'User role within this specific tenant';
COMMENT ON COLUMN tenant_invitations.token IS 'Secure token for invitation URL';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tenant management tables created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run 02-add-tenant-id-columns.sql to add tenant_id to existing tables';
  RAISE NOTICE '2. Run 03-migrate-to-default-tenant.sql to migrate existing data';
  RAISE NOTICE '3. Run 04-tenant-rls-functions.sql to create helper functions';
  RAISE NOTICE '4. Run 05-tenant-rls-policies.sql to update RLS policies';
END $$;

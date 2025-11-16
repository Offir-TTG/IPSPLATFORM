// ============================================================================
// MULTITENANCY: TYPE DEFINITIONS
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  subscription_tier: 'basic' | 'professional' | 'enterprise' | 'custom';

  // Organization Details
  organization_type: 'university' | 'college' | 'school' | 'training_center' | 'corporate' | 'non_profit' | 'government' | 'other' | null;
  industry: string | null;
  organization_size: '1-50' | '51-200' | '201-500' | '501-1000' | '1000+' | null;
  website_url: string | null;
  description: string | null;

  // Resource Limits
  max_users: number;
  max_courses: number;
  max_storage_gb: number;
  max_instructors: number;
  max_storage_per_user_mb: number;
  max_file_upload_size_mb: number;
  max_video_duration_minutes: number;
  max_concurrent_sessions: number;

  // Branding
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  custom_css: string | null;
  custom_domain_verified: boolean;
  custom_domain_verified_at: string | null;

  // Contact Information
  admin_email: string;
  admin_name: string;
  phone_number: string | null;
  billing_email: string | null;
  support_email: string | null;
  support_phone: string | null;
  notification_email: string | null;
  technical_contact_email: string | null;
  technical_contact_name: string | null;
  technical_contact_phone: string | null;

  // Address
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;

  // Tax & Legal
  tax_id: string | null;
  legal_name: string | null;
  registration_number: string | null;

  // Regional Settings
  default_language: string;
  timezone: string;
  currency: string;
  currency_symbol: string;
  currency_position: 'before' | 'after';
  date_format: string;
  time_format: '12h' | '24h';
  week_start: 'sunday' | 'monday';

  // Self-Service Signup
  creation_method: 'self_service' | 'super_admin' | 'invitation';
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_sent_at: string | null;
  email_verified_at: string | null;
  signup_completed_at: string | null;

  // Onboarding
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_step: number;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_accepted_at: string | null;

  // Subscription Management
  subscription_id: string | null;
  subscription_status: 'pending' | 'active' | 'past_due' | 'canceled' | 'trialing';
  subscription_started_at: string | null;
  subscription_current_period_start: string | null;
  subscription_current_period_end: string | null;

  // Billing
  billing_cycle: 'monthly' | 'quarterly' | 'annually';
  payment_method_type: string | null;
  last_payment_date: string | null;
  next_billing_date: string | null;

  // Features
  enabled_features: {
    courses: boolean;
    zoom: boolean;
    docusign: boolean;
    [key: string]: boolean;
  };

  // Risk & Compliance
  requires_data_residency: boolean;
  data_residency_region: string | null;
  gdpr_compliant: boolean;
  sso_enabled: boolean;
  sso_provider: string | null;

  // Success Metrics
  customer_success_manager: string | null;
  health_score: number | null;
  last_activity_at: string | null;
  churn_risk: 'low' | 'medium' | 'high' | null;

  // Referral & Source
  referral_source: string | null;
  partner_id: string | null;
  campaign_source: string | null;

  // Notes & Tags
  internal_notes: string | null;
  tags: string[] | null;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
  trial_ends_at: string | null;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'instructor' | 'student' | 'support';
  status: 'active' | 'inactive' | 'invited' | 'suspended';

  // Dates
  invited_at: string | null;
  joined_at: string | null;
  last_accessed_at: string | null;

  // Settings
  permissions: Record<string, boolean>;
  settings: Record<string, any>;
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: 'admin' | 'instructor' | 'student' | 'support';
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';

  // Metadata
  invited_by: string | null;
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  message: string | null;
  metadata: Record<string, any>;
}

export interface TenantMembership {
  tenant: Tenant;
  role: TenantUser['role'];
  joined_at: string;
  last_accessed_at: string | null;
}

export interface TenantContext {
  tenant: Tenant | null;
  tenantId: string | null;
  tenantSlug: string | null;
  userTenants: TenantMembership[];
  currentRole: TenantUser['role'] | null;
  loading: boolean;
  error: Error | null;
}

export interface TenantUsageMetrics {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;

  // Usage
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  total_storage_bytes: number;
  total_api_calls: number;
  storage_gb: number;

  // Metadata
  metadata: Record<string, any>;
  created_at: string;
}

export interface TenantOnboardingStep {
  id: string;
  tenant_id: string;
  step_number: number;
  step_name: string;
  step_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  step_data: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantNote {
  id: string;
  tenant_id: string;
  note_type: 'general' | 'support' | 'billing' | 'technical' | 'success';
  title: string | null;
  content: string;
  is_pinned: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  created_by: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

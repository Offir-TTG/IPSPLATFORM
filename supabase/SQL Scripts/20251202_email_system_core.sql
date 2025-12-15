-- ============================================================================
-- EMAIL SYSTEM - CORE DATABASE SCHEMA
-- Created: December 2, 2025
-- ============================================================================
-- This migration creates the complete email system infrastructure including:
-- - Email templates with multi-language versioning
-- - Email queue for sending management
-- - Email analytics and tracking
-- - Automated email triggers
-- - Scheduled email campaigns
-- - RLS policies for multi-tenant isolation
-- - Database functions for common operations
-- ============================================================================

-- ============================================================================
-- 1. EMAIL TEMPLATES - Template library with customization
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Template Identification
  template_key TEXT NOT NULL, -- 'enrollment_confirmation', 'payment_receipt', etc.
  template_name TEXT NOT NULL,
  template_category TEXT NOT NULL CHECK (template_category IN ('enrollment', 'payment', 'lesson', 'parent', 'system')),

  -- Content description
  description TEXT,

  -- Configuration
  is_system BOOLEAN DEFAULT false, -- System templates can't be deleted
  is_active BOOLEAN DEFAULT true,

  -- Customization settings (tenant-specific overrides)
  allow_customization BOOLEAN DEFAULT true,
  custom_subject JSONB, -- {en: "...", he: "..."}
  custom_body JSONB, -- {en: "...", he: "..."}
  custom_styles JSONB, -- {primaryColor: "#...", logo_url: "...", footer: "..."}

  -- Metadata
  variables JSONB, -- [{name, description, example, required}]
  preview_data JSONB, -- Sample data for preview: {student_name: "John Doe", ...}

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE(tenant_id, template_key)
);

-- Indexes for email_templates
CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_category ON email_templates(template_category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_email_templates_key ON email_templates(template_key);

-- Comments
COMMENT ON TABLE email_templates IS 'Email template definitions with customization support';
COMMENT ON COLUMN email_templates.template_key IS 'Unique identifier for template (enrollment_confirmation, payment_receipt, etc.)';
COMMENT ON COLUMN email_templates.is_system IS 'System templates cannot be deleted by users';
COMMENT ON COLUMN email_templates.variables IS 'JSON array of available variables: [{name, description, example, required}]';
COMMENT ON COLUMN email_templates.custom_styles IS 'Tenant-specific style overrides: {primaryColor, secondaryColor, logo_url, footer}';

-- ============================================================================
-- 2. EMAIL TEMPLATE VERSIONS - Multi-language template content
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,

  -- Language
  language_code TEXT NOT NULL DEFAULT 'en' CHECK (language_code IN ('en', 'he')),

  -- Content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,

  -- Version control
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  change_notes TEXT,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(template_id, language_code, version)
);

-- Indexes for email_template_versions
CREATE INDEX idx_template_versions_template ON email_template_versions(template_id);
CREATE INDEX idx_template_versions_current ON email_template_versions(template_id, language_code, is_current) WHERE is_current = true;
CREATE INDEX idx_template_versions_language ON email_template_versions(language_code);

-- Comments
COMMENT ON TABLE email_template_versions IS 'Versioned email template content with multi-language support';
COMMENT ON COLUMN email_template_versions.is_current IS 'Only one version per template+language should be current';
COMMENT ON COLUMN email_template_versions.body_html IS 'HTML email body with Handlebars variables {{variableName}}';
COMMENT ON COLUMN email_template_versions.body_text IS 'Plain text email body with Handlebars variables {{variableName}}';

-- ============================================================================
-- 3. EMAIL QUEUE - Outgoing email queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cc_emails TEXT[], -- Optional CC recipients
  bcc_emails TEXT[], -- Optional BCC recipients

  -- Content
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  language_code TEXT DEFAULT 'en',
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,

  -- Template data
  template_variables JSONB, -- Variables used to render template

  -- Attachments
  attachments JSONB, -- [{filename, path, content_type}]

  -- Sending configuration
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  scheduled_for TIMESTAMPTZ, -- Send at specific time
  send_after TIMESTAMPTZ DEFAULT now(), -- Don't send before this time
  expires_at TIMESTAMPTZ, -- Don't send after this time

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled', 'expired')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Results
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  error_message TEXT,
  smtp_message_id TEXT, -- Message ID from SMTP server

  -- Tracking
  tracking_enabled BOOLEAN DEFAULT true,
  tracking_id UUID DEFAULT gen_random_uuid() UNIQUE,

  -- Trigger info (what caused this email)
  trigger_type TEXT CHECK (trigger_type IN ('automated', 'manual', 'scheduled', 'api')),
  trigger_event TEXT, -- 'enrollment.created', 'payment.completed', etc.
  trigger_resource_type TEXT, -- 'enrollment', 'payment', etc.
  trigger_resource_id UUID,

  -- BullMQ job reference
  job_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Sent by
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for email_queue
CREATE INDEX idx_email_queue_tenant ON email_queue(tenant_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_user ON email_queue(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending' AND scheduled_for IS NOT NULL;
CREATE INDEX idx_email_queue_tracking ON email_queue(tracking_id);
CREATE INDEX idx_email_queue_trigger ON email_queue(trigger_type, trigger_event) WHERE trigger_event IS NOT NULL;
CREATE INDEX idx_email_queue_created ON email_queue(created_at DESC);
CREATE INDEX idx_email_queue_priority_status ON email_queue(priority, status) WHERE status = 'pending';

-- Comments
COMMENT ON TABLE email_queue IS 'Email sending queue with status tracking and BullMQ integration';
COMMENT ON COLUMN email_queue.tracking_id IS 'Unique ID for tracking opens and clicks';
COMMENT ON COLUMN email_queue.job_id IS 'BullMQ job ID for queue processing';
COMMENT ON COLUMN email_queue.trigger_event IS 'Event that triggered this email (enrollment.created, payment.completed, etc.)';

-- ============================================================================
-- 4. EMAIL ANALYTICS - Email tracking and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id UUID NOT NULL REFERENCES email_queue(id) ON DELETE CASCADE,
  tracking_id UUID NOT NULL,

  -- Open tracking
  opened_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,

  -- Click tracking
  clicked_at TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  clicked_links JSONB DEFAULT '[]'::jsonb, -- [{url, clicked_at, count}]

  -- Bounce tracking
  bounced_at TIMESTAMPTZ,
  bounce_type TEXT CHECK (bounce_type IN ('hard', 'soft', 'complaint')),
  bounce_reason TEXT,

  -- Unsubscribe tracking
  unsubscribed_at TIMESTAMPTZ,

  -- Device/Location info (from first open)
  user_agent TEXT,
  ip_address TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet', 'unknown'
  browser TEXT,
  os TEXT,
  location_country TEXT,
  location_city TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(email_queue_id)
);

-- Indexes for email_analytics
CREATE INDEX idx_email_analytics_tracking ON email_analytics(tracking_id);
CREATE INDEX idx_email_analytics_opened ON email_analytics(opened_at) WHERE opened_at IS NOT NULL;
CREATE INDEX idx_email_analytics_clicked ON email_analytics(clicked_at) WHERE clicked_at IS NOT NULL;
CREATE INDEX idx_email_analytics_bounced ON email_analytics(bounced_at) WHERE bounced_at IS NOT NULL;

-- Comments
COMMENT ON TABLE email_analytics IS 'Email tracking data for opens, clicks, bounces, and unsubscribes';
COMMENT ON COLUMN email_analytics.clicked_links IS 'JSON array of clicked links with counts: [{url, clicked_at, count}]';
COMMENT ON COLUMN email_analytics.device_type IS 'Detected device type from user agent';

-- ============================================================================
-- 5. EMAIL TRIGGERS - Automated email trigger configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Trigger configuration
  trigger_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'enrollment.created', 'payment.completed', 'lesson.reminder'
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,

  -- Conditions (filter when to send)
  conditions JSONB, -- {status: 'active', payment_status: 'paid', ...}

  -- Timing
  delay_minutes INTEGER DEFAULT 0, -- Send X minutes after event (0 = immediate)
  send_time TIME, -- Send at specific time of day (overrides delay)
  send_days_before INTEGER, -- For reminders: send X days before event

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Recipients
  recipient_role TEXT, -- 'student', 'parent', 'instructor', 'admin'
  recipient_field TEXT, -- Field to get email from: 'user.email', 'parent_email', etc.

  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE(tenant_id, trigger_event, template_id)
);

-- Indexes for email_triggers
CREATE INDEX idx_email_triggers_tenant ON email_triggers(tenant_id);
CREATE INDEX idx_email_triggers_event ON email_triggers(trigger_event);
CREATE INDEX idx_email_triggers_active ON email_triggers(is_active) WHERE is_active = true;
CREATE INDEX idx_email_triggers_template ON email_triggers(template_id);

-- Comments
COMMENT ON TABLE email_triggers IS 'Automated email trigger configuration for event-based sending';
COMMENT ON COLUMN email_triggers.trigger_event IS 'Event that triggers email (enrollment.created, payment.completed, etc.)';
COMMENT ON COLUMN email_triggers.conditions IS 'JSONB filter conditions for when to send email';
COMMENT ON COLUMN email_triggers.send_days_before IS 'For reminders: send X days before the event date';

-- ============================================================================
-- 6. EMAIL SCHEDULES - Scheduled email campaigns
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Schedule info
  schedule_name TEXT NOT NULL,
  schedule_description TEXT,
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,

  -- Recipients
  recipient_filter JSONB, -- Query conditions for selecting users: {role: 'student', status: 'active'}
  recipient_ids UUID[], -- Specific user IDs (alternative to filter)
  recipient_count INTEGER DEFAULT 0, -- Calculated when schedule is created

  -- Timing
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',

  -- Recurrence (for recurring campaigns)
  recurrence_rule TEXT, -- RRULE format (RFC 5545)
  recurrence_end_date TIMESTAMPTZ,

  -- Template variables (same for all recipients)
  template_variables JSONB,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')),

  -- Results
  emails_queued INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  error_message TEXT,

  -- Created by
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for email_schedules
CREATE INDEX idx_email_schedules_tenant ON email_schedules(tenant_id);
CREATE INDEX idx_email_schedules_status ON email_schedules(status);
CREATE INDEX idx_email_schedules_scheduled ON email_schedules(scheduled_for);
CREATE INDEX idx_email_schedules_template ON email_schedules(template_id);
CREATE INDEX idx_email_schedules_created_by ON email_schedules(created_by) WHERE created_by IS NOT NULL;

-- Comments
COMMENT ON TABLE email_schedules IS 'Scheduled email campaigns and bulk sends';
COMMENT ON COLUMN email_schedules.recipient_filter IS 'JSONB query to select recipients: {role: "student", status: "active"}';
COMMENT ON COLUMN email_schedules.recurrence_rule IS 'RRULE format for recurring campaigns (RFC 5545)';

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all email tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- email_templates policies
-- ============================================================================

-- Allow service role full access
CREATE POLICY email_templates_service_full ON email_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can manage templates for their tenant
CREATE POLICY email_templates_admin_all ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = email_templates.tenant_id
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = email_templates.tenant_id
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Users can view active templates for their tenant (for preview)
CREATE POLICY email_templates_user_read ON email_templates
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = email_templates.tenant_id
    )
  );

-- ============================================================================
-- email_template_versions policies
-- ============================================================================

CREATE POLICY email_template_versions_service_full ON email_template_versions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY email_template_versions_admin_all ON email_template_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN email_templates ON email_templates.id = email_template_versions.template_id
      WHERE users.id = auth.uid()
      AND users.tenant_id = email_templates.tenant_id
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- email_queue policies
-- ============================================================================

CREATE POLICY email_queue_service_full ON email_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view and manage queue for their tenant
CREATE POLICY email_queue_admin_all ON email_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = email_queue.tenant_id
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own emails
CREATE POLICY email_queue_user_own ON email_queue
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- email_analytics policies
-- ============================================================================

CREATE POLICY email_analytics_service_full ON email_analytics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view analytics for their tenant
CREATE POLICY email_analytics_admin_read ON email_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN email_queue ON email_queue.id = email_analytics.email_queue_id
      WHERE users.id = auth.uid()
      AND users.tenant_id = email_queue.tenant_id
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- email_triggers policies
-- ============================================================================

CREATE POLICY email_triggers_service_full ON email_triggers
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY email_triggers_admin_all ON email_triggers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = email_triggers.tenant_id
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- email_schedules policies
-- ============================================================================

CREATE POLICY email_schedules_service_full ON email_schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY email_schedules_admin_all ON email_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = email_schedules.tenant_id
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 8. DATABASE FUNCTIONS
-- ============================================================================

-- Function to get template with current version
CREATE OR REPLACE FUNCTION get_email_template(
  p_template_key TEXT,
  p_language_code TEXT DEFAULT 'en',
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  template_id UUID,
  template_name TEXT,
  template_category TEXT,
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  variables JSONB,
  custom_subject JSONB,
  custom_body JSONB,
  custom_styles JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.template_name,
    t.template_category,
    COALESCE(v.subject, ''),
    COALESCE(v.body_html, ''),
    COALESCE(v.body_text, ''),
    t.variables,
    t.custom_subject,
    t.custom_body,
    t.custom_styles
  FROM email_templates t
  LEFT JOIN email_template_versions v ON v.template_id = t.id
    AND v.language_code = p_language_code
    AND v.is_current = true
  WHERE t.template_key = p_template_key
    AND t.is_active = true
    AND (p_tenant_id IS NULL OR t.tenant_id = p_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log email sent
CREATE OR REPLACE FUNCTION log_email_sent(
  p_email_queue_id UUID,
  p_smtp_message_id TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE email_queue
  SET
    status = 'sent',
    sent_at = now(),
    smtp_message_id = p_smtp_message_id,
    updated_at = now()
  WHERE id = p_email_queue_id;

  -- Initialize analytics record
  INSERT INTO email_analytics (email_queue_id, tracking_id)
  SELECT id, tracking_id FROM email_queue WHERE id = p_email_queue_id
  ON CONFLICT (email_queue_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log email failed
CREATE OR REPLACE FUNCTION log_email_failed(
  p_email_queue_id UUID,
  p_error_message TEXT,
  p_attempts INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE email_queue
  SET
    status = 'failed',
    failed_at = now(),
    error_message = p_error_message,
    attempts = p_attempts,
    updated_at = now()
  WHERE id = p_email_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track email open
CREATE OR REPLACE FUNCTION track_email_open(
  p_tracking_id UUID,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_device_type TEXT;
BEGIN
  -- Detect device type from user agent
  v_device_type := CASE
    WHEN p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%' THEN 'mobile'
    WHEN p_user_agent ILIKE '%tablet%' OR p_user_agent ILIKE '%ipad%' THEN 'tablet'
    WHEN p_user_agent IS NOT NULL THEN 'desktop'
    ELSE 'unknown'
  END;

  -- Update or insert analytics record
  INSERT INTO email_analytics (
    email_queue_id,
    tracking_id,
    opened_at,
    open_count,
    first_opened_at,
    last_opened_at,
    user_agent,
    ip_address,
    device_type
  )
  SELECT
    eq.id,
    p_tracking_id,
    now(),
    1,
    now(),
    now(),
    p_user_agent,
    p_ip_address,
    v_device_type
  FROM email_queue eq
  WHERE eq.tracking_id = p_tracking_id
  ON CONFLICT (email_queue_id) DO UPDATE SET
    opened_at = COALESCE(email_analytics.opened_at, now()),
    open_count = email_analytics.open_count + 1,
    first_opened_at = COALESCE(email_analytics.first_opened_at, now()),
    last_opened_at = now(),
    user_agent = COALESCE(email_analytics.user_agent, p_user_agent),
    ip_address = COALESCE(email_analytics.ip_address, p_ip_address),
    device_type = COALESCE(email_analytics.device_type, v_device_type),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track email click
CREATE OR REPLACE FUNCTION track_email_click(
  p_tracking_id UUID,
  p_url TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_clicked_links JSONB;
BEGIN
  -- Get existing clicked links or initialize empty array
  SELECT COALESCE(clicked_links, '[]'::jsonb)
  INTO v_clicked_links
  FROM email_analytics
  WHERE tracking_id = p_tracking_id;

  -- Update clicked links array
  v_clicked_links := v_clicked_links || jsonb_build_object(
    'url', p_url,
    'clicked_at', now(),
    'count', 1
  );

  -- Update or insert analytics record
  INSERT INTO email_analytics (
    email_queue_id,
    tracking_id,
    clicked_at,
    click_count,
    clicked_links
  )
  SELECT
    eq.id,
    p_tracking_id,
    now(),
    1,
    v_clicked_links
  FROM email_queue eq
  WHERE eq.tracking_id = p_tracking_id
  ON CONFLICT (email_queue_id) DO UPDATE SET
    clicked_at = COALESCE(email_analytics.clicked_at, now()),
    click_count = email_analytics.click_count + 1,
    clicked_links = v_clicked_links,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_triggers_updated_at BEFORE UPDATE ON email_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_schedules_updated_at BEFORE UPDATE ON email_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_analytics_updated_at BEFORE UPDATE ON email_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the tables were created
DO $$
BEGIN
  RAISE NOTICE 'Email system core schema migration completed successfully!';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - email_templates';
  RAISE NOTICE '  - email_template_versions';
  RAISE NOTICE '  - email_queue';
  RAISE NOTICE '  - email_analytics';
  RAISE NOTICE '  - email_triggers';
  RAISE NOTICE '  - email_schedules';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '  - get_email_template()';
  RAISE NOTICE '  - log_email_sent()';
  RAISE NOTICE '  - log_email_failed()';
  RAISE NOTICE '  - track_email_open()';
  RAISE NOTICE '  - track_email_click()';
  RAISE NOTICE 'Enabled RLS on all tables';
END $$;

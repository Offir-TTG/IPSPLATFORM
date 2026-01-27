/**
 * Recreate Audit Trail Tables
 *
 * This migration creates:
 * 1. audit_events - Main audit log table for FERPA compliance and security monitoring
 * 2. audit_sessions - Session tracking table
 * 3. Indexes for performance
 * 4. RLS policies for security
 * 5. Helper views for common queries
 */

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE event_type AS ENUM (
  'CREATE', 'READ', 'UPDATE', 'DELETE',
  'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT',
  'ACCESS', 'MODIFY', 'EXECUTE', 'SHARE', 'CONSENT'
);

CREATE TYPE event_category AS ENUM (
  'DATA', 'AUTH', 'ADMIN', 'CONFIG', 'SECURITY',
  'COMPLIANCE', 'SYSTEM', 'EDUCATION', 'STUDENT_RECORD',
  'GRADE', 'ATTENDANCE', 'PARENTAL_ACCESS'
);

CREATE TYPE event_status AS ENUM ('success', 'failure', 'partial', 'pending');

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================================================
-- AUDIT EVENTS TABLE
-- ============================================================================

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Tenant isolation
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- User identification
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,

  -- Session tracking
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Event details
  event_type event_type NOT NULL,
  event_category event_category NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,

  -- Education-specific (FERPA compliance)
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_id UUID,
  is_student_record BOOLEAN DEFAULT FALSE,
  is_minor_data BOOLEAN DEFAULT FALSE,
  parental_consent_id UUID,

  -- Action details
  action TEXT NOT NULL,
  description TEXT,

  -- Data changes (for UPDATE events)
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],

  -- Event correlation
  parent_event_id UUID REFERENCES audit_events(id) ON DELETE SET NULL,
  correlation_id TEXT,

  -- Status
  status event_status NOT NULL DEFAULT 'success',
  error_message TEXT,

  -- Security
  risk_level risk_level NOT NULL DEFAULT 'low',
  compliance_flags TEXT[],

  -- Tamper detection
  previous_hash TEXT,
  event_hash TEXT,

  -- Retention
  retention_until TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Additional metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AUDIT SESSIONS TABLE
-- ============================================================================

CREATE TABLE audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,

  -- Tenant isolation
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- User identification
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT,

  -- Session timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Session details
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,

  -- City and country for geolocation
  city TEXT,
  country_code TEXT,

  -- Activity tracking
  events_count INTEGER DEFAULT 0,
  high_risk_events_count INTEGER DEFAULT 0,

  -- Session status
  is_active BOOLEAN DEFAULT TRUE,
  termination_reason TEXT,

  -- Additional metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Audit Events indexes
CREATE INDEX idx_audit_events_tenant_id ON audit_events(tenant_id);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_student_id ON audit_events(student_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(event_timestamp DESC);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_event_category ON audit_events(event_category);
CREATE INDEX idx_audit_events_resource_type ON audit_events(resource_type);
CREATE INDEX idx_audit_events_risk_level ON audit_events(risk_level);
CREATE INDEX idx_audit_events_status ON audit_events(status);
CREATE INDEX idx_audit_events_session_id ON audit_events(session_id);
CREATE INDEX idx_audit_events_is_student_record ON audit_events(is_student_record) WHERE is_student_record = TRUE;
CREATE INDEX idx_audit_events_compliance_flags ON audit_events USING GIN(compliance_flags);

-- Composite indexes for common queries
CREATE INDEX idx_audit_events_tenant_timestamp ON audit_events(tenant_id, event_timestamp DESC);
CREATE INDEX idx_audit_events_user_timestamp ON audit_events(user_id, event_timestamp DESC);
CREATE INDEX idx_audit_events_student_timestamp ON audit_events(student_id, event_timestamp DESC) WHERE is_student_record = TRUE;

-- Audit Sessions indexes
CREATE INDEX idx_audit_sessions_tenant_id ON audit_sessions(tenant_id);
CREATE INDEX idx_audit_sessions_user_id ON audit_sessions(user_id);
CREATE INDEX idx_audit_sessions_session_id ON audit_sessions(session_id);
CREATE INDEX idx_audit_sessions_is_active ON audit_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_audit_sessions_last_activity ON audit_sessions(last_activity_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;

-- Audit Events Policies

-- Service role can do everything (for system logging)
CREATE POLICY "Service role can manage audit events"
  ON audit_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin users can view all audit events in their tenant
CREATE POLICY "Admin users can view all audit events"
  ON audit_events
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id
      FROM tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

-- Users can view their own audit events
CREATE POLICY "Users can view their own audit events"
  ON audit_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Audit Sessions Policies

-- Service role can do everything
CREATE POLICY "Service role can manage audit sessions"
  ON audit_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON audit_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin users can view all sessions in their tenant
CREATE POLICY "Admin users can view all sessions"
  ON audit_sessions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tu.tenant_id
      FROM tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_audit_events_updated_at
  BEFORE UPDATE ON audit_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_sessions_updated_at
  BEFORE UPDATE ON audit_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for student record access (FERPA compliance)
CREATE OR REPLACE VIEW audit_student_record_access AS
SELECT
  ae.id,
  ae.event_timestamp,
  ae.user_id,
  ae.user_email,
  ae.user_role,
  ae.student_id,
  s.email AS student_email,
  s.first_name || ' ' || s.last_name AS student_name,
  ae.resource_type,
  ae.resource_id,
  ae.action,
  ae.description,
  ae.ip_address,
  ae.is_student_record,
  ae.compliance_flags,
  ae.session_id
FROM audit_events ae
LEFT JOIN users s ON ae.student_id = s.id
WHERE ae.is_student_record = TRUE
ORDER BY ae.event_timestamp DESC;

-- View for grade changes
CREATE OR REPLACE VIEW audit_grade_changes AS
SELECT
  ae.id,
  ae.event_timestamp,
  ae.user_id,
  ae.user_email,
  ae.user_role,
  ae.student_id,
  ae.resource_id AS grade_id,
  ae.event_type,
  ae.action,
  ae.old_values->>'grade' AS old_grade,
  ae.new_values->>'grade' AS new_grade,
  ae.old_values->>'score' AS old_score,
  ae.new_values->>'score' AS new_score,
  ae.changed_fields,
  ae.description,
  ae.ip_address,
  ae.session_id
FROM audit_events ae
WHERE ae.event_category = 'GRADE'
  AND ae.event_type = 'UPDATE'
ORDER BY ae.event_timestamp DESC;

-- View for high-risk events
CREATE OR REPLACE VIEW audit_high_risk_events AS
SELECT *
FROM audit_events
WHERE risk_level IN ('high', 'critical')
ORDER BY event_timestamp DESC;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON audit_events TO authenticated;
GRANT SELECT ON audit_sessions TO authenticated;
GRANT SELECT ON audit_student_record_access TO authenticated;
GRANT SELECT ON audit_grade_changes TO authenticated;
GRANT SELECT ON audit_high_risk_events TO authenticated;

-- Grant full access to service role
GRANT ALL ON audit_events TO service_role;
GRANT ALL ON audit_sessions TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE audit_events IS 'Main audit trail table for FERPA compliance and security monitoring';
COMMENT ON TABLE audit_sessions IS 'User session tracking for security and compliance';

COMMENT ON COLUMN audit_events.is_student_record IS 'Flag indicating this event involves student educational records (FERPA protected)';
COMMENT ON COLUMN audit_events.compliance_flags IS 'Applicable compliance frameworks (FERPA, COPPA, GDPR, etc.)';
COMMENT ON COLUMN audit_events.risk_level IS 'Risk level of the event for security monitoring';
COMMENT ON COLUMN audit_events.event_hash IS 'Hash of event data for tamper detection';
COMMENT ON COLUMN audit_events.previous_hash IS 'Hash of previous event to create audit chain';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Audit tables created successfully' as status;

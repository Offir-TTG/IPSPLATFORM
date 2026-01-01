-- ============================================================================
-- CREATE NOTIFICATIONS SYSTEM
-- ============================================================================
-- Date: 2025-01-31
-- Purpose: Complete notification system with multi-channel delivery support
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE notification_scope AS ENUM ('individual', 'course', 'program', 'tenant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM ('lesson', 'assignment', 'payment', 'enrollment', 'attendance', 'achievement', 'announcement', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_channel AS ENUM ('in_app', 'email', 'sms', 'push');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'failed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Main notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Scoping
  scope notification_scope NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  target_program_id UUID REFERENCES programs(id) ON DELETE CASCADE,

  -- Notification content
  category notification_category NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- Actions
  action_url TEXT,
  action_label TEXT,

  -- Lifecycle
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_scope_targets CHECK (
    (scope = 'individual' AND target_user_id IS NOT NULL) OR
    (scope = 'course' AND target_course_id IS NOT NULL) OR
    (scope = 'program' AND target_program_id IS NOT NULL) OR
    (scope = 'tenant')
  )
);

-- Read tracking table
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(notification_id, user_id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Master channel toggles
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,

  -- Per-category channel preferences
  category_preferences JSONB DEFAULT '{
    "lesson": {"in_app": true, "email": true, "sms": false, "push": true},
    "assignment": {"in_app": true, "email": true, "sms": false, "push": true},
    "payment": {"in_app": true, "email": true, "sms": true, "push": true},
    "enrollment": {"in_app": true, "email": true, "sms": false, "push": true},
    "attendance": {"in_app": true, "email": false, "sms": false, "push": false},
    "achievement": {"in_app": true, "email": true, "sms": false, "push": true},
    "announcement": {"in_app": true, "email": true, "sms": false, "push": true},
    "system": {"in_app": true, "email": false, "sms": false, "push": false}
  }'::JSONB,

  -- Quiet hours
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',

  -- Digest mode
  digest_mode BOOLEAN DEFAULT FALSE,
  digest_frequency TEXT DEFAULT 'daily', -- daily, weekly
  digest_time TIME DEFAULT '09:00',

  -- Contact info for external channels
  phone_number TEXT,
  push_subscription JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, tenant_id)
);

-- Delivery audit log
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel delivery_channel NOT NULL,
  status delivery_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scope ON notifications(scope);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_course ON notifications(target_course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_program ON notifications(target_program_id);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_notification_reads_notif ON notification_reads(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_tenant ON notification_preferences(tenant_id);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notif ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user ON notification_deliveries(user_id);

-- ============================================================================
-- 4. CREATE FUNCTIONS
-- ============================================================================

-- Drop existing functions if they exist (to handle signature changes)
DROP FUNCTION IF EXISTS get_user_notifications(UUID, INT, INT, notification_category, notification_priority, BOOLEAN);
DROP FUNCTION IF EXISTS get_user_unread_count(UUID);
DROP FUNCTION IF EXISTS mark_notification_as_read(UUID, UUID);
DROP FUNCTION IF EXISTS mark_all_notifications_as_read(UUID);
DROP FUNCTION IF EXISTS cleanup_expired_notifications();

-- Function to get user's notifications with scoping logic
CREATE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_category notification_category DEFAULT NULL,
  p_priority notification_priority DEFAULT NULL,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  scope notification_scope,
  target_user_id UUID,
  target_course_id UUID,
  target_program_id UUID,
  category notification_category,
  priority notification_priority,
  title TEXT,
  message TEXT,
  metadata JSONB,
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    n.id,
    n.tenant_id,
    n.scope,
    n.target_user_id,
    n.target_course_id,
    n.target_program_id,
    n.category,
    n.priority,
    n.title,
    n.message,
    n.metadata,
    n.action_url,
    n.action_label,
    n.expires_at,
    n.created_at,
    n.updated_at,
    (nr.id IS NOT NULL) as is_read,
    nr.read_at
  FROM notifications n
  LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = p_user_id
  WHERE
    (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
      -- Individual scope: notification directly targets this user
      (n.scope = 'individual' AND n.target_user_id = p_user_id)

      -- Course scope: user is enrolled in a product linked to this course
      OR (n.scope = 'course' AND EXISTS (
        SELECT 1 FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        WHERE prod.course_id = n.target_course_id
        AND e.user_id = p_user_id
        AND e.status = 'active'
      ))

      -- Program scope: user is enrolled in a product linked to this program
      OR (n.scope = 'program' AND EXISTS (
        SELECT 1 FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        WHERE prod.program_id = n.target_program_id
        AND e.user_id = p_user_id
        AND e.status = 'active'
      ))

      -- Tenant scope: user belongs to this tenant
      OR (n.scope = 'tenant' AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = p_user_id
        AND u.tenant_id = n.tenant_id
      ))
    )
    AND (p_category IS NULL OR n.category = p_category)
    AND (p_priority IS NULL OR n.priority = p_priority)
    AND (NOT p_unread_only OR nr.id IS NULL)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_user_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT n.id)::INTEGER INTO unread_count
  FROM notifications n
  LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = p_user_id
  WHERE
    (n.expires_at IS NULL OR n.expires_at > NOW())
    AND nr.id IS NULL
    AND (
      (n.scope = 'individual' AND n.target_user_id = p_user_id)
      OR (n.scope = 'course' AND EXISTS (
        SELECT 1 FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        WHERE prod.course_id = n.target_course_id
        AND e.user_id = p_user_id
        AND e.status = 'active'
      ))
      OR (n.scope = 'program' AND EXISTS (
        SELECT 1 FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        WHERE prod.program_id = n.target_program_id
        AND e.user_id = p_user_id
        AND e.status = 'active'
      ))
      OR (n.scope = 'tenant' AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = p_user_id
        AND u.tenant_id = n.tenant_id
      ))
    );

  RETURN unread_count;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_reads (notification_id, user_id, read_at)
  VALUES (p_notification_id, p_user_id, NOW())
  ON CONFLICT (notification_id, user_id) DO NOTHING;
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  marked_count INTEGER;
BEGIN
  WITH notifications_to_mark AS (
    SELECT DISTINCT n.id
    FROM notifications n
    LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = p_user_id
    WHERE
      (n.expires_at IS NULL OR n.expires_at > NOW())
      AND nr.id IS NULL
      AND (
        (n.scope = 'individual' AND n.target_user_id = p_user_id)
        OR (n.scope = 'course' AND EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          WHERE prod.course_id = n.target_course_id
          AND e.user_id = p_user_id
          AND e.status = 'active'
        ))
        OR (n.scope = 'program' AND EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          WHERE prod.program_id = n.target_program_id
          AND e.user_id = p_user_id
          AND e.status = 'active'
        ))
        OR (n.scope = 'tenant' AND EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = p_user_id
          AND u.tenant_id = n.tenant_id
        ))
      )
  ),
  inserted AS (
    INSERT INTO notification_reads (notification_id, user_id, read_at)
    SELECT id, p_user_id, NOW()
    FROM notifications_to_mark
    ON CONFLICT (notification_id, user_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO marked_count FROM inserted;

  RETURN marked_count;
END;
$$;

-- Function to cleanup expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT
  USING (
    scope = 'individual' AND target_user_id = auth.uid()
    OR scope = 'course' AND EXISTS (
      SELECT 1 FROM enrollments e
      JOIN products prod ON prod.id = e.product_id
      WHERE prod.course_id = target_course_id
      AND e.user_id = auth.uid()
      AND e.status = 'active'
    )
    OR scope = 'program' AND EXISTS (
      SELECT 1 FROM enrollments e
      JOIN products prod ON prod.id = e.product_id
      WHERE prod.program_id = target_program_id
      AND e.user_id = auth.uid()
      AND e.status = 'active'
    )
    OR scope = 'tenant' AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.tenant_id = notifications.tenant_id
    )
  );

DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.tenant_id = notifications.tenant_id
    )
  );

DROP POLICY IF EXISTS "Admins can update notifications" ON notifications;
CREATE POLICY "Admins can update notifications" ON notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND tenant_id = notifications.tenant_id
    )
  );

DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;
CREATE POLICY "Admins can delete notifications" ON notifications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND tenant_id = notifications.tenant_id
    )
  );

-- Notification reads policies
DROP POLICY IF EXISTS "Users can view their read status" ON notification_reads;
CREATE POLICY "Users can view their read status" ON notification_reads
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark notifications as read" ON notification_reads;
CREATE POLICY "Users can mark notifications as read" ON notification_reads
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their read status" ON notification_reads;
CREATE POLICY "Users can update their read status" ON notification_reads
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their read status" ON notification_reads;
CREATE POLICY "Users can delete their read status" ON notification_reads
  FOR DELETE
  USING (user_id = auth.uid());

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can view their preferences" ON notification_preferences;
CREATE POLICY "Users can view their preferences" ON notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their preferences" ON notification_preferences;
CREATE POLICY "Users can create their preferences" ON notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their preferences" ON notification_preferences;
CREATE POLICY "Users can update their preferences" ON notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- Notification deliveries policies
DROP POLICY IF EXISTS "Users can view their delivery logs" ON notification_deliveries;
CREATE POLICY "Users can view their delivery logs" ON notification_deliveries
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create delivery logs" ON notification_deliveries;
CREATE POLICY "System can create delivery logs" ON notification_deliveries
  FOR INSERT
  WITH CHECK (true); -- Service role can always insert

-- ============================================================================
-- 6. ENABLE REALTIME
-- ============================================================================

-- Enable realtime for notifications table (only if not already added)
DO $$
BEGIN
  -- Add notifications table to realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  -- Add notification_reads table to realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notification_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notification_reads;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE notifications IS 'Stores all notifications with multi-channel delivery support';
COMMENT ON TABLE notification_reads IS 'Tracks which notifications have been read by which users';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery channels';
COMMENT ON TABLE notification_deliveries IS 'Audit log of notification deliveries across channels';

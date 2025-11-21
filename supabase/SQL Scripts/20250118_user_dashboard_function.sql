-- Create user_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  course_id UUID NOT NULL,
  program_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Create enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID,
  course_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, cancelled
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  course_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMPTZ,
  max_score INTEGER DEFAULT 100,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, submitted, graded
  submission_text TEXT,
  submission_url VARCHAR(500),
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_user_assignments_user_id ON user_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_status ON user_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- Create optimized dashboard function
CREATE OR REPLACE FUNCTION get_user_dashboard(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
  v_enrollments JSONB;
  v_upcoming_sessions JSONB;
  v_pending_assignments JSONB;
  v_stats JSONB;
  v_recent_activity JSONB;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = p_user_id;

  -- Get active enrollments with progress
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'program_id', e.program_id,
      'course_id', e.course_id,
      'program_name', p.name,
      'course_name', c.title,
      'course_description', c.description,
      'course_image', c.image_url,
      'enrolled_at', e.enrolled_at,
      'completed_at', e.completed_at,
      'overall_progress', COALESCE(
        (
          SELECT ROUND(AVG(progress_percentage))
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.enrollment_id = e.id
        ), 0
      ),
      'completed_lessons', COALESCE(
        (
          SELECT COUNT(*)
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.enrollment_id = e.id
            AND up.status = 'completed'
        ), 0
      ),
      'total_lessons', COALESCE(
        (
          SELECT COUNT(*)
          FROM lessons l
          JOIN modules m ON l.module_id = m.id
          WHERE m.course_id = e.course_id
        ), 0
      )
    )
  ), '[]'::jsonb) INTO v_enrollments
  FROM enrollments e
  LEFT JOIN programs p ON p.id = e.program_id
  LEFT JOIN courses c ON c.id = e.course_id
  WHERE e.user_id = p_user_id
    AND e.status = 'active'
    AND e.tenant_id = v_tenant_id
  ORDER BY e.enrolled_at DESC
  LIMIT 10;

  -- Get upcoming sessions (lessons with zoom_config and future start times)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'course_name', c.title,
      'start_time', l.start_time,
      'end_time', l.end_time,
      'instructor_name', CASE
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL
        THEN u.first_name || ' ' || u.last_name
        WHEN u.first_name IS NOT NULL
        THEN u.first_name
        ELSE u.email
      END,
      'zoom_meeting_id', l.zoom_meeting_id
    ) ORDER BY l.start_time ASC
  ), '[]'::jsonb) INTO v_upcoming_sessions
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  JOIN courses c ON m.course_id = c.id
  JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
  LEFT JOIN users u ON u.id = c.instructor_id
  WHERE l.tenant_id = v_tenant_id
    AND l.start_time IS NOT NULL
    AND l.start_time > NOW()
    AND l.zoom_meeting_id IS NOT NULL
  LIMIT 5;

  -- Get pending assignments
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'course_name', c.title,
      'due_date', a.due_date,
      'max_score', a.max_score,
      'status', COALESCE(ua.status, 'pending'),
      'is_overdue', CASE
        WHEN a.due_date < NOW() AND COALESCE(ua.status, 'pending') != 'submitted'
        THEN true
        ELSE false
      END
    ) ORDER BY a.due_date ASC
  ), '[]'::jsonb) INTO v_pending_assignments
  FROM assignments a
  INNER JOIN courses c ON c.id = a.course_id
  INNER JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
  LEFT JOIN user_assignments ua ON ua.assignment_id = a.id AND ua.user_id = p_user_id
  WHERE a.tenant_id = v_tenant_id
    AND COALESCE(ua.status, 'pending') IN ('pending', 'submitted')
  LIMIT 10;

  -- Calculate stats (using subqueries to avoid GROUP BY issues)
  SELECT jsonb_build_object(
    'total_courses', (
      SELECT COUNT(DISTINCT course_id)
      FROM enrollments
      WHERE user_id = p_user_id
        AND status = 'active'
        AND tenant_id = v_tenant_id
    ),
    'completed_lessons', (
      SELECT COUNT(*)
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.status = 'completed'
        AND up.tenant_id = v_tenant_id
    ),
    'in_progress_lessons', (
      SELECT COUNT(*)
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.status = 'in_progress'
        AND up.tenant_id = v_tenant_id
    ),
    'pending_assignments', 0,
    'total_hours_spent', COALESCE((
      SELECT SUM(time_spent_seconds) / 3600.0
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.tenant_id = v_tenant_id
    ), 0)
  ) INTO v_stats;

  -- Get recent activity (last 5 actions)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', up.id,
      'type', 'lesson_progress',
      'lesson_title', l.title,
      'course_name', c.title,
      'status', up.status,
      'timestamp', up.updated_at
    ) ORDER BY up.updated_at DESC
  ), '[]'::jsonb) INTO v_recent_activity
  FROM user_progress up
  JOIN lessons l ON l.id = up.lesson_id
  JOIN modules m ON l.module_id = m.id
  JOIN courses c ON m.course_id = c.id
  WHERE up.user_id = p_user_id
    AND up.tenant_id = v_tenant_id
  ORDER BY up.updated_at DESC
  LIMIT 5;

  -- Build final result
  v_result := jsonb_build_object(
    'enrollments', v_enrollments,
    'upcoming_sessions', v_upcoming_sessions,
    'pending_assignments', v_pending_assignments,
    'stats', v_stats,
    'recent_activity', v_recent_activity
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_dashboard(UUID) TO authenticated;

-- Add RLS policies for new tables
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- User progress policies
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert progress"
  ON user_progress FOR INSERT
  WITH CHECK (true);

-- Enrollments policies
CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments"
  ON enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- Assignments policies
CREATE POLICY "Users can view assignments for enrolled courses"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = assignments.course_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
    )
  );

CREATE POLICY "Instructors and admins can manage assignments"
  ON assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- User assignments policies
CREATE POLICY "Users can view own assignment submissions"
  ON user_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit own assignments"
  ON user_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending assignments"
  ON user_assignments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Instructors and admins can grade assignments"
  ON user_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'instructor')
    )
  );

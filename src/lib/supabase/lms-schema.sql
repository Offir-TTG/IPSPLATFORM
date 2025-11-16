-- ============================================================================
-- LMS SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Learning Management System with hierarchical structure:
-- Programs → Courses → Modules → Lessons → Topics
--
-- Features:
-- - Progress tracking
-- - Assignments and grading
-- - Certificates
-- - Attendance tracking
-- - Discussions
-- - Announcements
-- - Full multi-tenancy support with RLS
-- ============================================================================

-- ============================================================================
-- EXTENSION SETUP
-- ============================================================================

-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: modules
-- ============================================================================
-- Organizational layer between courses and lessons
-- Allows grouping lessons into logical modules/sections

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  is_optional BOOLEAN DEFAULT false,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique ordering within course
  CONSTRAINT unique_module_order UNIQUE(course_id, "order")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_tenant ON modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_modules_published ON modules(is_published) WHERE is_published = true;

-- Comments
COMMENT ON TABLE modules IS 'Course modules for organizing lessons into sections';
COMMENT ON COLUMN modules."order" IS 'Display order within the course (1-indexed)';
COMMENT ON COLUMN modules.is_optional IS 'Whether module is optional or required for course completion';

-- ============================================================================
-- TABLE: lesson_topics
-- ============================================================================
-- Granular content blocks within lessons
-- Supports multiple content types: video, text, PDF, quiz, assignment, etc.

CREATE TABLE IF NOT EXISTS lesson_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (
    content_type IN ('video', 'text', 'pdf', 'quiz', 'assignment', 'link', 'embed', 'download')
  ),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  "order" INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique ordering within lesson
  CONSTRAINT unique_topic_order UNIQUE(lesson_id, "order")
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_topics_lesson ON lesson_topics(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_topics_tenant ON lesson_topics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lesson_topics_type ON lesson_topics(content_type);
CREATE INDEX IF NOT EXISTS idx_lesson_topics_required ON lesson_topics(is_required) WHERE is_required = true;

-- JSONB index for content queries
CREATE INDEX IF NOT EXISTS idx_lesson_topics_content ON lesson_topics USING GIN (content);

-- Comments
COMMENT ON TABLE lesson_topics IS 'Individual content blocks within lessons';
COMMENT ON COLUMN lesson_topics.content_type IS 'Type of content: video, text, pdf, quiz, assignment, link, embed, download';
COMMENT ON COLUMN lesson_topics.content IS 'Type-specific content structure (see documentation for schemas)';
COMMENT ON COLUMN lesson_topics.is_required IS 'Whether topic must be completed for lesson progress';

-- Example content structures:
-- video: {"url": "https://...", "provider": "youtube|vimeo|custom", "thumbnail": "..."}
-- text: {"html": "<p>...</p>", "plaintext": "..."}
-- pdf: {"file_url": "https://...", "filename": "...", "size": 1234567}
-- quiz: {"questions": [...], "passing_score": 80, "time_limit": 30}
-- assignment: {"instructions": "...", "due_date": "2024-01-01", "max_score": 100, "rubric": {...}}
-- link: {"url": "https://...", "title": "...", "description": "..."}
-- embed: {"embed_code": "<iframe>...</iframe>", "provider": "..."}

-- ============================================================================
-- TABLE: user_progress
-- ============================================================================
-- Tracks student progress through lessons and topics

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES lesson_topics(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'in_progress', 'completed')
  ),
  progress_percentage INTEGER DEFAULT 0 CHECK (
    progress_percentage >= 0 AND progress_percentage <= 100
  ),
  time_spent_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique progress record per user/lesson/topic
  CONSTRAINT unique_user_progress UNIQUE(user_id, lesson_id, topic_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_enrollment ON user_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_tenant ON user_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed_at) WHERE completed_at IS NOT NULL;

-- Comments
COMMENT ON TABLE user_progress IS 'Student progress tracking for lessons and topics';
COMMENT ON COLUMN user_progress.progress_percentage IS 'Progress percentage (0-100)';
COMMENT ON COLUMN user_progress.time_spent_seconds IS 'Total time spent on this content in seconds';

-- ============================================================================
-- TABLE: assignments
-- ============================================================================
-- Assessment system for courses

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES lesson_topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (
    type IN ('quiz', 'essay', 'project', 'file_upload', 'peer_review', 'discussion')
  ),
  questions JSONB, -- For quizzes (array of question objects)
  max_score INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  attempts_allowed INTEGER DEFAULT 1,
  due_date TIMESTAMPTZ,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  is_required BOOLEAN DEFAULT true,
  instructions TEXT,
  rubric JSONB, -- Grading rubric
  attachments JSONB, -- Reference files
  auto_grade BOOLEAN DEFAULT false, -- Auto-grade quizzes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_lesson ON assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_topic ON assignments(topic_id);
CREATE INDEX IF NOT EXISTS idx_assignments_tenant ON assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(type);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_required ON assignments(is_required) WHERE is_required = true;

-- JSONB indexes
CREATE INDEX IF NOT EXISTS idx_assignments_questions ON assignments USING GIN (questions);
CREATE INDEX IF NOT EXISTS idx_assignments_rubric ON assignments USING GIN (rubric);

-- Comments
COMMENT ON TABLE assignments IS 'Assessments and assignments for courses';
COMMENT ON COLUMN assignments.type IS 'quiz, essay, project, file_upload, peer_review, discussion';
COMMENT ON COLUMN assignments.questions IS 'Quiz questions array (for type=quiz)';
COMMENT ON COLUMN assignments.rubric IS 'Grading rubric structure';
COMMENT ON COLUMN assignments.auto_grade IS 'Whether to automatically grade (quizzes only)';

-- ============================================================================
-- TABLE: assignment_submissions
-- ============================================================================
-- Student submissions for assignments

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  answers JSONB, -- Quiz answers or essay content
  files JSONB, -- Uploaded files metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'submitted' CHECK (
    status IN ('draft', 'submitted', 'grading', 'graded', 'returned', 'resubmit')
  ),
  late BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_tenant ON assignment_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON assignment_submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted ON assignment_submissions(submitted_at);

-- JSONB indexes
CREATE INDEX IF NOT EXISTS idx_submissions_answers ON assignment_submissions USING GIN (answers);

-- Comments
COMMENT ON TABLE assignment_submissions IS 'Student submissions for assignments';
COMMENT ON COLUMN assignment_submissions.attempt_number IS 'Attempt number (for multiple attempts allowed)';
COMMENT ON COLUMN assignment_submissions.answers IS 'Quiz answers or content submitted';
COMMENT ON COLUMN assignment_submissions.files IS 'Uploaded files metadata array';
COMMENT ON COLUMN assignment_submissions.late IS 'Whether submission was late';

-- ============================================================================
-- TABLE: certificates
-- ============================================================================
-- Course and program completion certificates

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  template_id TEXT,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure certificate has either course or program
  CONSTRAINT certificate_source CHECK (
    (course_id IS NOT NULL AND program_id IS NULL) OR
    (course_id IS NULL AND program_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_program ON certificates(program_id);
CREATE INDEX IF NOT EXISTS idx_certificates_tenant ON certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued ON certificates(issued_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);

-- JSONB index
CREATE INDEX IF NOT EXISTS idx_certificates_metadata ON certificates USING GIN (metadata);

-- Comments
COMMENT ON TABLE certificates IS 'Course and program completion certificates';
COMMENT ON COLUMN certificates.certificate_number IS 'Unique certificate identifier (e.g., CERT-XXXX-YYYY)';
COMMENT ON COLUMN certificates.template_id IS 'Certificate template identifier';
COMMENT ON COLUMN certificates.pdf_url IS 'URL to generated PDF certificate';
COMMENT ON COLUMN certificates.metadata IS 'Additional certificate data (grade, credits, etc.)';

-- ============================================================================
-- TABLE: lesson_attendance
-- ============================================================================
-- Attendance tracking for live lessons

CREATE TABLE IF NOT EXISTS lesson_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'absent' CHECK (
    status IN ('present', 'absent', 'late', 'excused')
  ),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one attendance record per user per lesson
  CONSTRAINT unique_lesson_attendance UNIQUE(lesson_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_lesson ON lesson_attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON lesson_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON lesson_attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON lesson_attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON lesson_attendance(joined_at);

-- Comments
COMMENT ON TABLE lesson_attendance IS 'Attendance tracking for live lessons';
COMMENT ON COLUMN lesson_attendance.status IS 'present, absent, late, excused';
COMMENT ON COLUMN lesson_attendance.duration_minutes IS 'Total time attended in minutes';

-- ============================================================================
-- TABLE: discussions
-- ============================================================================
-- Course and lesson discussion forums

CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  is_instructor_post BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure discussion has either course or lesson context
  CONSTRAINT discussion_context CHECK (
    course_id IS NOT NULL OR lesson_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discussions_course ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_lesson ON discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent ON discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_tenant ON discussions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discussions_pinned ON discussions(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_discussions_created ON discussions(created_at DESC);

-- Comments
COMMENT ON TABLE discussions IS 'Course and lesson discussion forums';
COMMENT ON COLUMN discussions.parent_id IS 'Parent discussion for threaded replies';
COMMENT ON COLUMN discussions.is_pinned IS 'Pinned to top of discussion list';
COMMENT ON COLUMN discussions.is_resolved IS 'Marked as resolved (for questions)';
COMMENT ON COLUMN discussions.is_instructor_post IS 'Posted by course instructor';

-- ============================================================================
-- TABLE: discussion_likes
-- ============================================================================
-- Track user likes on discussions

CREATE TABLE IF NOT EXISTS discussion_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One like per user per discussion
  CONSTRAINT unique_discussion_like UNIQUE(discussion_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion ON discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user ON discussion_likes(user_id);

-- ============================================================================
-- TABLE: announcements
-- ============================================================================
-- Course and program announcements

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notify_students BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure announcement has context (course or program)
  CONSTRAINT announcement_context CHECK (
    course_id IS NOT NULL OR program_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_course ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_program ON announcements(program_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expires_at);

-- Comments
COMMENT ON TABLE announcements IS 'Course and program announcements';
COMMENT ON COLUMN announcements.priority IS 'low, medium, high, urgent';
COMMENT ON COLUMN announcements.notify_students IS 'Send notification to enrolled students';

-- ============================================================================
-- MODIFY EXISTING TABLES
-- ============================================================================

-- Add module relationship to lessons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'module_id'
  ) THEN
    ALTER TABLE lessons ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE SET NULL;
    CREATE INDEX idx_lessons_module ON lessons(module_id);
  END IF;
END $$;

-- Add content blocks for drag-and-drop canvas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'content_blocks'
  ) THEN
    ALTER TABLE lessons ADD COLUMN content_blocks JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add published status to lessons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE lessons ADD COLUMN is_published BOOLEAN DEFAULT false;
    CREATE INDEX idx_lessons_published ON lessons(is_published) WHERE is_published = true;
  END IF;
END $$;

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function: Calculate course progress for a user
CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_total_topics INTEGER;
  v_completed_topics INTEGER;
BEGIN
  -- Count total required topics in course
  SELECT COUNT(DISTINCT lt.id) INTO v_total_topics
  FROM lesson_topics lt
  JOIN lessons l ON lt.lesson_id = l.id
  WHERE l.course_id = p_course_id
    AND lt.is_required = true
    AND l.is_published = true;

  -- Count completed required topics by user
  SELECT COUNT(DISTINCT up.topic_id) INTO v_completed_topics
  FROM user_progress up
  JOIN lesson_topics lt ON up.topic_id = lt.id
  JOIN lessons l ON lt.lesson_id = l.id
  WHERE up.user_id = p_user_id
    AND l.course_id = p_course_id
    AND up.status = 'completed'
    AND lt.is_required = true
    AND l.is_published = true;

  -- Return percentage (0 if no topics)
  IF v_total_topics = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((v_completed_topics::NUMERIC / v_total_topics::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_course_progress IS 'Calculate percentage completion of course for user';

-- Function: Calculate module progress for a user
CREATE OR REPLACE FUNCTION calculate_module_progress(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_total_topics INTEGER;
  v_completed_topics INTEGER;
BEGIN
  -- Count total required topics in module
  SELECT COUNT(DISTINCT lt.id) INTO v_total_topics
  FROM lesson_topics lt
  JOIN lessons l ON lt.lesson_id = l.id
  WHERE l.module_id = p_module_id
    AND lt.is_required = true
    AND l.is_published = true;

  -- Count completed required topics by user
  SELECT COUNT(DISTINCT up.topic_id) INTO v_completed_topics
  FROM user_progress up
  JOIN lesson_topics lt ON up.topic_id = lt.id
  JOIN lessons l ON lt.lesson_id = l.id
  WHERE up.user_id = p_user_id
    AND l.module_id = p_module_id
    AND up.status = 'completed'
    AND lt.is_required = true
    AND l.is_published = true;

  IF v_total_topics = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((v_completed_topics::NUMERIC / v_total_topics::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-issue certificate on course completion
CREATE OR REPLACE FUNCTION auto_issue_certificate()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_progress INTEGER;
  v_cert_number TEXT;
  v_course_title TEXT;
  v_tenant_id UUID;
BEGIN
  -- Get course ID and tenant from topic
  SELECT l.course_id, l.tenant_id INTO v_course_id, v_tenant_id
  FROM lessons l
  JOIN lesson_topics lt ON l.id = lt.lesson_id
  WHERE lt.id = NEW.topic_id;

  -- Calculate progress
  v_progress := calculate_course_progress(NEW.user_id, v_course_id);

  -- If 100% complete, issue certificate
  IF v_progress = 100 THEN
    -- Generate unique certificate number
    v_cert_number := 'CERT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

    -- Get course title
    SELECT title INTO v_course_title FROM courses WHERE id = v_course_id;

    -- Insert certificate (ignore if already exists)
    INSERT INTO certificates (
      tenant_id,
      user_id,
      course_id,
      certificate_number,
      title,
      description,
      issued_at
    )
    SELECT
      v_tenant_id,
      NEW.user_id,
      v_course_id,
      v_cert_number,
      'Certificate of Completion: ' || v_course_title,
      'Successfully completed all required course materials',
      NOW()
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-issue certificate on topic completion
DROP TRIGGER IF EXISTS trigger_auto_certificate ON user_progress;
CREATE TRIGGER trigger_auto_certificate
AFTER UPDATE ON user_progress
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.topic_id IS NOT NULL)
EXECUTE FUNCTION auto_issue_certificate();

-- Function: Update discussion reply count
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE discussions
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE discussions
    SET replies_count = replies_count - 1
    WHERE id = OLD.parent_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update reply count
DROP TRIGGER IF EXISTS trigger_update_reply_count ON discussions;
CREATE TRIGGER trigger_update_reply_count
AFTER INSERT OR DELETE ON discussions
FOR EACH ROW
EXECUTE FUNCTION update_discussion_reply_count();

-- Function: Update discussion likes count
CREATE OR REPLACE FUNCTION update_discussion_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussions
    SET likes_count = likes_count + 1
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussions
    SET likes_count = likes_count - 1
    WHERE id = OLD.discussion_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update likes count
DROP TRIGGER IF EXISTS trigger_update_likes_count ON discussion_likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON discussion_likes
FOR EACH ROW
EXECUTE FUNCTION update_discussion_likes_count();

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Triggers to auto-update updated_at column
DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_topics_updated_at ON lesson_topics;
CREATE TRIGGER update_lesson_topics_updated_at BEFORE UPDATE ON lesson_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_attendance_updated_at ON lesson_attendance;
CREATE TRIGGER update_lesson_attendance_updated_at BEFORE UPDATE ON lesson_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discussions_updated_at ON discussions;
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON discussions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all LMS tables
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: modules
-- ============================================================================

-- Admins and instructors can manage all modules in their tenant
CREATE POLICY "Admin/Instructor can manage modules" ON modules
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- Students can view published modules in courses they're enrolled in
CREATE POLICY "Students can view published modules" ON modules
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND is_published = true
    AND course_id IN (
      SELECT course_id FROM enrollments
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- ============================================================================
-- RLS POLICIES: lesson_topics
-- ============================================================================

-- Admins and instructors can manage all topics
CREATE POLICY "Admin/Instructor can manage topics" ON lesson_topics
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- Students can view topics in lessons they have access to
CREATE POLICY "Students can view topics" ON lesson_topics
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.is_published = true
        AND l.is_published = true
        AND m.course_id IN (
          SELECT course_id FROM enrollments
          WHERE user_id = auth.uid()
            AND status = 'active'
            AND tenant_id = current_setting('app.current_tenant_id')::uuid
        )
    )
  );

-- ============================================================================
-- RLS POLICIES: user_progress
-- ============================================================================

-- Users can manage their own progress
CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND user_id = auth.uid()
  );

-- Admins and instructors can view all progress in their tenant
CREATE POLICY "Admin/Instructor can view all progress" ON user_progress
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- ============================================================================
-- RLS POLICIES: assignments
-- ============================================================================

-- Admins and instructors can manage assignments
CREATE POLICY "Admin/Instructor can manage assignments" ON assignments
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- Students can view assignments in courses they're enrolled in
CREATE POLICY "Students can view assignments" ON assignments
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      lesson_id IN (
        SELECT l.id FROM lessons l
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id IN (
          SELECT course_id FROM enrollments
          WHERE user_id = auth.uid()
            AND status = 'active'
            AND tenant_id = current_setting('app.current_tenant_id')::uuid
        )
      )
      OR topic_id IN (
        SELECT lt.id FROM lesson_topics lt
        JOIN lessons l ON lt.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id IN (
          SELECT course_id FROM enrollments
          WHERE user_id = auth.uid()
            AND status = 'active'
            AND tenant_id = current_setting('app.current_tenant_id')::uuid
        )
      )
    )
  );

-- ============================================================================
-- RLS POLICIES: assignment_submissions
-- ============================================================================

-- Users can manage their own submissions
CREATE POLICY "Users can manage own submissions" ON assignment_submissions
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND user_id = auth.uid()
  );

-- Admins and instructors can view and grade all submissions
CREATE POLICY "Admin/Instructor can manage submissions" ON assignment_submissions
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- ============================================================================
-- RLS POLICIES: certificates
-- ============================================================================

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates" ON certificates
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND user_id = auth.uid()
  );

-- Admins and instructors can view all certificates
CREATE POLICY "Admin/Instructor can view certificates" ON certificates
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- System can insert certificates (for auto-generation)
CREATE POLICY "System can issue certificates" ON certificates
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
  );

-- ============================================================================
-- RLS POLICIES: lesson_attendance
-- ============================================================================

-- Users can view their own attendance
CREATE POLICY "Users can view own attendance" ON lesson_attendance
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND user_id = auth.uid()
  );

-- Admins and instructors can manage all attendance
CREATE POLICY "Admin/Instructor can manage attendance" ON lesson_attendance
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- ============================================================================
-- RLS POLICIES: discussions
-- ============================================================================

-- All enrolled users can view discussions
CREATE POLICY "Enrolled users can view discussions" ON discussions
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      course_id IN (
        SELECT course_id FROM enrollments
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND tenant_id = current_setting('app.current_tenant_id')::uuid
      )
      OR lesson_id IN (
        SELECT l.id FROM lessons l
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id IN (
          SELECT course_id FROM enrollments
          WHERE user_id = auth.uid()
            AND status = 'active'
            AND tenant_id = current_setting('app.current_tenant_id')::uuid
        )
      )
    )
  );

-- Enrolled users can create discussions
CREATE POLICY "Enrolled users can create discussions" ON discussions
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND author_id = auth.uid()
    AND (
      course_id IN (
        SELECT course_id FROM enrollments
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND tenant_id = current_setting('app.current_tenant_id')::uuid
      )
      OR lesson_id IN (
        SELECT l.id FROM lessons l
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id IN (
          SELECT course_id FROM enrollments
          WHERE user_id = auth.uid()
            AND status = 'active'
            AND tenant_id = current_setting('app.current_tenant_id')::uuid
        )
      )
    )
  );

-- Users can update/delete their own discussions
CREATE POLICY "Users can manage own discussions" ON discussions
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND author_id = auth.uid()
  );

CREATE POLICY "Users can delete own discussions" ON discussions
  FOR DELETE
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND author_id = auth.uid()
  );

-- Admins and instructors can manage all discussions
CREATE POLICY "Admin/Instructor can manage discussions" ON discussions
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- ============================================================================
-- RLS POLICIES: discussion_likes
-- ============================================================================

-- Users can manage their own likes
CREATE POLICY "Users can manage own likes" ON discussion_likes
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: announcements
-- ============================================================================

-- Admins and instructors can manage announcements
CREATE POLICY "Admin/Instructor can manage announcements" ON announcements
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (is_tenant_admin() OR is_tenant_instructor())
  );

-- Students can view published announcements in their courses/programs
CREATE POLICY "Students can view announcements" ON announcements
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND is_published = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      course_id IN (
        SELECT course_id FROM enrollments
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND tenant_id = current_setting('app.current_tenant_id')::uuid
      )
      OR program_id IN (
        SELECT program_id FROM enrollments
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND tenant_id = current_setting('app.current_tenant_id')::uuid
      )
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lesson_topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assignment_submissions TO authenticated;
GRANT SELECT, INSERT ON certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lesson_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON discussions TO authenticated;
GRANT SELECT, INSERT, DELETE ON discussion_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON announcements TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Log schema completion
DO $$
BEGIN
  RAISE NOTICE 'LMS Schema created successfully!';
  RAISE NOTICE 'Tables: modules, lesson_topics, user_progress, assignments, assignment_submissions, certificates, lesson_attendance, discussions, discussion_likes, announcements';
  RAISE NOTICE 'Functions: calculate_course_progress, calculate_module_progress, auto_issue_certificate';
  RAISE NOTICE 'RLS policies applied to all tables';
  RAISE NOTICE 'Run this script in your Supabase SQL editor';
END $$;

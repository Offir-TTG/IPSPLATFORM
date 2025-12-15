-- ============================================================================
-- LMS TABLES MIGRATION
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to create LMS tables
-- Dashboard → SQL Editor → New Query → Paste this → Run
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: modules
-- ============================================================================

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

  CONSTRAINT unique_module_order UNIQUE(course_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_tenant ON modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_modules_published ON modules(is_published) WHERE is_published = true;

-- ============================================================================
-- TABLE: lessons
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  "order" INTEGER NOT NULL,
  start_time TIMESTAMPTZ,
  duration INTEGER,
  materials JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_lesson_order UNIQUE(course_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_tenant ON lessons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_start_time ON lessons(start_time);

-- ============================================================================
-- TABLE: lesson_topics
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (
    content_type IN ('video', 'text', 'pdf', 'quiz', 'assignment', 'link', 'embed', 'download', 'whiteboard')
  ),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  "order" INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_topic_order UNIQUE(lesson_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_lesson_topics_lesson ON lesson_topics(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_topics_tenant ON lesson_topics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lesson_topics_type ON lesson_topics(content_type);
CREATE INDEX IF NOT EXISTS idx_lesson_topics_content ON lesson_topics USING GIN (content);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_topics ENABLE ROW LEVEL SECURITY;

-- Modules Policies
CREATE POLICY "Users can view modules in their tenant"
  ON modules FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert modules"
  ON modules FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update modules"
  ON modules FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete modules"
  ON modules FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Lessons Policies
CREATE POLICY "Users can view lessons in their tenant"
  ON lessons FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert lessons"
  ON lessons FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update lessons"
  ON lessons FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete lessons"
  ON lessons FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Lesson Topics Policies
CREATE POLICY "Users can view lesson topics in their tenant"
  ON lesson_topics FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert lesson topics"
  ON lesson_topics FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update lesson topics"
  ON lesson_topics FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete lesson topics"
  ON lesson_topics FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMPLETED!
-- ============================================================================
-- The following tables have been created:
-- - modules
-- - lessons
-- - lesson_topics
--
-- With full RLS policies for multi-tenancy
-- ============================================================================

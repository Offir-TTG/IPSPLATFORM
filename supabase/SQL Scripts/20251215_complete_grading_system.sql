-- =====================================================
-- COMPLETE GRADING SYSTEM SCHEMA
-- =====================================================
-- This script creates all tables needed for a full grading system:
-- 1. Links courses to grading scales
-- 2. Grade categories (weighted components like "Homework 20%")
-- 3. Grade items (individual assignments/exams)
-- 4. Student grades

-- =====================================================
-- 1. ADD GRADING SCALE TO COURSES
-- =====================================================

-- Add grading_scale_id to courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS grading_scale_id UUID REFERENCES grading_scales(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_grading_scale_id ON courses(grading_scale_id);

COMMENT ON COLUMN courses.grading_scale_id IS 'The grading scale used for this course';

-- =====================================================
-- 2. GRADE CATEGORIES TABLE
-- =====================================================
-- Grade categories define weighted components of a course
-- Example: Homework (20%), Quizzes (15%), Exams (65%)

CREATE TABLE IF NOT EXISTS grade_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Category details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),

  -- Drop lowest scores
  drop_lowest INTEGER DEFAULT 0 CHECK (drop_lowest >= 0),

  -- Display
  display_order INTEGER DEFAULT 0,
  color_code VARCHAR(7),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_category_name_per_course UNIQUE (course_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grade_categories_tenant ON grade_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_course ON grade_categories(course_id);

-- RLS Policies
ALTER TABLE grade_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view grade categories for their tenant" ON grade_categories;
CREATE POLICY "Users can view grade categories for their tenant" ON grade_categories
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage grade categories" ON grade_categories;
CREATE POLICY "Admins can manage grade categories" ON grade_categories
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- 3. GRADE ITEMS TABLE
-- =====================================================
-- Grade items are individual assignments, quizzes, exams, etc.

CREATE TABLE IF NOT EXISTS grade_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES grade_categories(id) ON DELETE SET NULL,

  -- Item details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Points
  max_points DECIMAL(10,2) NOT NULL CHECK (max_points > 0),

  -- Dates
  due_date TIMESTAMP WITH TIME ZONE,
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,

  -- Settings
  is_published BOOLEAN DEFAULT false,
  is_extra_credit BOOLEAN DEFAULT false,
  allow_late_submission BOOLEAN DEFAULT true,

  -- Display
  display_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grade_items_tenant ON grade_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grade_items_course ON grade_items(course_id);
CREATE INDEX IF NOT EXISTS idx_grade_items_category ON grade_items(category_id);
CREATE INDEX IF NOT EXISTS idx_grade_items_due_date ON grade_items(due_date);

-- RLS Policies
ALTER TABLE grade_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view published grade items for their tenant" ON grade_items;
CREATE POLICY "Users can view published grade items for their tenant" ON grade_items
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      is_published = true
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'instructor')
      )
    )
  );

DROP POLICY IF EXISTS "Admins and instructors can manage grade items" ON grade_items;
CREATE POLICY "Admins and instructors can manage grade items" ON grade_items
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- =====================================================
-- 4. STUDENT GRADES TABLE
-- =====================================================
-- Stores individual student grades for each grade item

CREATE TABLE IF NOT EXISTS student_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  grade_item_id UUID NOT NULL REFERENCES grade_items(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Grade details
  points_earned DECIMAL(10,2),
  percentage DECIMAL(5,2),
  letter_grade VARCHAR(10),

  -- Status
  status VARCHAR(50) DEFAULT 'not_submitted', -- not_submitted, submitted, graded, late, excused
  is_excused BOOLEAN DEFAULT false,
  is_late BOOLEAN DEFAULT false,

  -- Submission
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES users(id),

  -- Feedback
  feedback TEXT,
  private_notes TEXT, -- Only visible to instructors

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_student_grade_per_item UNIQUE (grade_item_id, student_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_grades_tenant ON student_grades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_item ON student_grades(grade_item_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_student ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_status ON student_grades(status);

-- RLS Policies
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own grades" ON student_grades;
CREATE POLICY "Students can view their own grades" ON student_grades
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
      AND tenant_id = student_grades.tenant_id
    )
  );

DROP POLICY IF EXISTS "Admins and instructors can manage student grades" ON student_grades;
CREATE POLICY "Admins and instructors can manage student grades" ON student_grades
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- =====================================================
-- 5. CALCULATED GRADES VIEW
-- =====================================================
-- View to calculate final grades for students in courses

CREATE OR REPLACE VIEW student_course_grades AS
SELECT
  sg.tenant_id,
  gi.course_id,
  sg.student_id,
  (u.first_name || ' ' || u.last_name) as student_name,
  c.title as course_title,

  -- Overall grade calculation (simple average for now)
  ROUND(
    AVG(
      CASE
        WHEN sg.is_excused THEN NULL
        WHEN sg.points_earned IS NULL THEN NULL
        ELSE (sg.points_earned / NULLIF(gi.max_points, 0)) * 100
      END
    ), 2
  ) as final_percentage,

  -- Count stats
  COUNT(DISTINCT gi.id) as total_items,
  COUNT(DISTINCT CASE WHEN sg.status = 'graded' THEN gi.id END) as graded_items,
  COUNT(DISTINCT CASE WHEN sg.status = 'not_submitted' THEN gi.id END) as missing_items,
  COUNT(DISTINCT CASE WHEN sg.is_late THEN gi.id END) as late_items,

  -- Metadata
  MAX(sg.updated_at) as last_updated

FROM student_grades sg
JOIN grade_items gi ON sg.grade_item_id = gi.id
JOIN users u ON sg.student_id = u.id
JOIN courses c ON gi.course_id = c.id
WHERE gi.is_published = true
GROUP BY sg.tenant_id, gi.course_id, sg.student_id, u.first_name, u.last_name, c.title;

-- Grant access to view
GRANT SELECT ON student_course_grades TO authenticated;

-- =====================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all grading tables
DROP TRIGGER IF EXISTS update_grade_categories_updated_at ON grade_categories;
CREATE TRIGGER update_grade_categories_updated_at
  BEFORE UPDATE ON grade_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grade_items_updated_at ON grade_items;
CREATE TRIGGER update_grade_items_updated_at
  BEFORE UPDATE ON grade_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_grades_updated_at ON student_grades;
CREATE TRIGGER update_student_grades_updated_at
  BEFORE UPDATE ON student_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate student's grade in a category
CREATE OR REPLACE FUNCTION calculate_category_grade(
  p_student_id UUID,
  p_category_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_grade DECIMAL(5,2);
  v_drop_lowest INTEGER;
BEGIN
  -- Get drop_lowest setting
  SELECT drop_lowest INTO v_drop_lowest
  FROM grade_categories
  WHERE id = p_category_id;

  -- Calculate grade (excluding dropped scores)
  SELECT ROUND(
    AVG(
      CASE
        WHEN sg.is_excused THEN NULL
        WHEN sg.points_earned IS NULL THEN 0
        ELSE (sg.points_earned / gi.max_points) * 100
      END
    ), 2
  ) INTO v_grade
  FROM student_grades sg
  JOIN grade_items gi ON sg.grade_item_id = gi.id
  WHERE sg.student_id = p_student_id
    AND gi.category_id = p_category_id
    AND gi.is_published = true
    AND NOT sg.is_excused
  ORDER BY (sg.points_earned / gi.max_points) DESC
  OFFSET v_drop_lowest;

  RETURN COALESCE(v_grade, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get letter grade from percentage
CREATE OR REPLACE FUNCTION get_letter_grade(
  p_percentage DECIMAL(5,2),
  p_grading_scale_id UUID
)
RETURNS VARCHAR(10) AS $$
DECLARE
  v_grade_label VARCHAR(10);
BEGIN
  SELECT grade_label INTO v_grade_label
  FROM grade_ranges
  WHERE grading_scale_id = p_grading_scale_id
    AND p_percentage >= min_percentage
    AND p_percentage <= max_percentage
  LIMIT 1;

  RETURN COALESCE(v_grade_label, 'N/A');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Complete grading system schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables created:';
  RAISE NOTICE '  - courses.grading_scale_id (link to grading scales)';
  RAISE NOTICE '  - grade_categories (weighted components)';
  RAISE NOTICE '  - grade_items (assignments, quizzes, exams)';
  RAISE NOTICE '  - student_grades (individual student scores)';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Views created:';
  RAISE NOTICE '  - student_course_grades (calculated final grades)';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Functions created:';
  RAISE NOTICE '  - calculate_category_grade()';
  RAISE NOTICE '  - get_letter_grade()';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS policies applied to all tables';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Next steps:';
  RAISE NOTICE '  1. Run the translations SQL file';
  RAISE NOTICE '  2. Update TypeScript types';
  RAISE NOTICE '  3. Create UI pages and API routes';
END $$;

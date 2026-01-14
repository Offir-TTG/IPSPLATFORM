-- ============================================================================
-- GRADING SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Comprehensive school-like grading system for the LMS
-- Features:
-- - Configurable grading scales (letter grades, percentages, custom)
-- - Grade categories (assignments, exams, participation, etc.)
-- - Weighted grade calculation
-- - Course-level and assignment-level grading
-- - Grade history and tracking
-- - GPA calculation support
-- - Multi-tenancy with RLS
-- ============================================================================

-- ============================================================================
-- TABLE: grading_scales
-- ============================================================================
-- Define grading scales at tenant level (e.g., A-F, Pass/Fail, 0-100)

CREATE TABLE IF NOT EXISTS grading_scales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Standard Letter Grade", "Pass/Fail", "Numeric"
  description TEXT,
  scale_type TEXT NOT NULL CHECK (scale_type IN ('letter', 'numeric', 'passfail', 'custom')),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_scale_name_per_tenant UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_grading_scales_tenant ON grading_scales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grading_scales_default ON grading_scales(tenant_id, is_default) WHERE is_default = true;

COMMENT ON TABLE grading_scales IS 'Configurable grading scales for courses';
COMMENT ON COLUMN grading_scales.scale_type IS 'Type of grading scale: letter (A-F), numeric (0-100), passfail, custom';

-- ============================================================================
-- TABLE: grade_ranges
-- ============================================================================
-- Define grade ranges within a grading scale (e.g., A = 90-100, B = 80-89)

CREATE TABLE IF NOT EXISTS grade_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  grading_scale_id UUID NOT NULL REFERENCES grading_scales(id) ON DELETE CASCADE,
  grade_label TEXT NOT NULL, -- e.g., "A", "B+", "Pass", "Excellent"
  min_percentage NUMERIC(5, 2) NOT NULL CHECK (min_percentage >= 0 AND min_percentage <= 100),
  max_percentage NUMERIC(5, 2) NOT NULL CHECK (max_percentage >= 0 AND max_percentage <= 100),
  gpa_value NUMERIC(4, 2), -- For GPA calculation (e.g., 4.0 for A, 3.7 for A-, etc.)
  display_order INTEGER NOT NULL,
  color_code TEXT, -- For UI display (e.g., "#4CAF50" for green)
  is_passing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_valid_range CHECK (min_percentage <= max_percentage),
  CONSTRAINT unique_grade_label_per_scale UNIQUE(grading_scale_id, grade_label)
);

CREATE INDEX IF NOT EXISTS idx_grade_ranges_scale ON grade_ranges(grading_scale_id);
CREATE INDEX IF NOT EXISTS idx_grade_ranges_tenant ON grade_ranges(tenant_id);

COMMENT ON TABLE grade_ranges IS 'Define grade ranges within a grading scale';
COMMENT ON COLUMN grade_ranges.gpa_value IS 'GPA value for this grade (e.g., 4.0 for A, 3.0 for B)';

-- ============================================================================
-- TABLE: grade_categories
-- ============================================================================
-- Define grade categories for weighted grading (e.g., Homework 20%, Exams 50%)

CREATE TABLE IF NOT EXISTS grade_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Homework", "Exams", "Participation", "Final Project"
  description TEXT,
  weight_percentage NUMERIC(5, 2) NOT NULL CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
  drop_lowest INTEGER DEFAULT 0, -- Drop N lowest scores in this category
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_category_per_course UNIQUE(course_id, name)
);

CREATE INDEX IF NOT EXISTS idx_grade_categories_course ON grade_categories(course_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_tenant ON grade_categories(tenant_id);

COMMENT ON TABLE grade_categories IS 'Grade categories for weighted grading within courses';
COMMENT ON COLUMN grade_categories.weight_percentage IS 'Weight of this category in final grade (0-100)';
COMMENT ON COLUMN grade_categories.drop_lowest IS 'Number of lowest scores to drop in this category';

-- ============================================================================
-- TABLE: course_grading_config
-- ============================================================================
-- Configure grading settings at course level

CREATE TABLE IF NOT EXISTS course_grading_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  grading_scale_id UUID NOT NULL REFERENCES grading_scales(id) ON DELETE RESTRICT,
  use_weighted_categories BOOLEAN DEFAULT true,
  passing_percentage NUMERIC(5, 2) DEFAULT 60.00 CHECK (passing_percentage >= 0 AND passing_percentage <= 100),
  allow_extra_credit BOOLEAN DEFAULT false,
  round_final_grades BOOLEAN DEFAULT true,
  show_grades_to_students BOOLEAN DEFAULT true,
  release_grades_date TIMESTAMPTZ, -- Optional: when to release grades to students
  grade_calculation_method TEXT DEFAULT 'weighted_average' CHECK (
    grade_calculation_method IN ('weighted_average', 'total_points', 'custom')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_config_per_course UNIQUE(course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_grading_config_course ON course_grading_config(course_id);
CREATE INDEX IF NOT EXISTS idx_course_grading_config_tenant ON course_grading_config(tenant_id);

COMMENT ON TABLE course_grading_config IS 'Grading configuration for each course';
COMMENT ON COLUMN course_grading_config.grade_calculation_method IS 'Method for calculating final grade: weighted_average, total_points, or custom';

-- ============================================================================
-- TABLE: assignment_grades
-- ============================================================================
-- Store grades for individual assignments (links to assignments table from lms-schema)

CREATE TABLE IF NOT EXISTS assignment_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  grade_category_id UUID REFERENCES grade_categories(id) ON DELETE SET NULL,

  -- Scoring
  points_earned NUMERIC(10, 2),
  points_possible NUMERIC(10, 2) NOT NULL,
  percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN points_possible > 0 THEN (points_earned / points_possible * 100)
      ELSE 0
    END
  ) STORED,

  -- Letter grade (if applicable)
  letter_grade TEXT,

  -- Grading metadata
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  feedback TEXT,
  is_excused BOOLEAN DEFAULT false, -- Excused assignments don't count
  is_extra_credit BOOLEAN DEFAULT false,
  is_late BOOLEAN DEFAULT false,
  late_penalty_applied NUMERIC(5, 2) DEFAULT 0, -- Percentage deducted for lateness

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_grade_per_assignment_user UNIQUE(assignment_id, user_id),
  CONSTRAINT check_points_valid CHECK (points_earned >= 0 AND points_earned <= points_possible * 1.5), -- Allow 150% for extra credit
  CONSTRAINT check_percentage_range CHECK (percentage >= 0 AND percentage <= 150)
);

CREATE INDEX IF NOT EXISTS idx_assignment_grades_assignment ON assignment_grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_grades_user ON assignment_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_grades_course ON assignment_grades(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_grades_category ON assignment_grades(grade_category_id);
CREATE INDEX IF NOT EXISTS idx_assignment_grades_tenant ON assignment_grades(tenant_id);

COMMENT ON TABLE assignment_grades IS 'Individual assignment grades for students';
COMMENT ON COLUMN assignment_grades.is_excused IS 'Excused assignments are not included in grade calculation';
COMMENT ON COLUMN assignment_grades.late_penalty_applied IS 'Percentage deducted from score due to late submission';

-- ============================================================================
-- TABLE: course_grades
-- ============================================================================
-- Store calculated final grades for students in courses

CREATE TABLE IF NOT EXISTS course_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,

  -- Calculated grades
  current_percentage NUMERIC(5, 2), -- Current calculated percentage
  final_percentage NUMERIC(5, 2), -- Final percentage (after course completion)
  letter_grade TEXT,
  gpa_value NUMERIC(4, 2),
  is_passing BOOLEAN,

  -- Category breakdown (JSONB for flexibility)
  category_grades JSONB DEFAULT '[]'::jsonb, -- Array of {category_id, category_name, percentage, weight}

  -- Metadata
  calculation_method TEXT DEFAULT 'weighted_average',
  last_calculated_at TIMESTAMPTZ,
  is_final BOOLEAN DEFAULT false, -- True when course is completed and grade is finalized
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Comments/Notes
  instructor_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_grade_per_course_user UNIQUE(course_id, user_id),
  CONSTRAINT check_percentages_valid CHECK (
    (current_percentage IS NULL OR (current_percentage >= 0 AND current_percentage <= 150)) AND
    (final_percentage IS NULL OR (final_percentage >= 0 AND final_percentage <= 150))
  )
);

CREATE INDEX IF NOT EXISTS idx_course_grades_course ON course_grades(course_id);
CREATE INDEX IF NOT EXISTS idx_course_grades_user ON course_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_course_grades_enrollment ON course_grades(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_grades_tenant ON course_grades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_course_grades_final ON course_grades(is_final) WHERE is_final = true;

COMMENT ON TABLE course_grades IS 'Calculated final grades for students in courses';
COMMENT ON COLUMN course_grades.current_percentage IS 'Current calculated percentage (ongoing)';
COMMENT ON COLUMN course_grades.final_percentage IS 'Final percentage after course completion';
COMMENT ON COLUMN course_grades.category_grades IS 'JSON breakdown of grades by category';

-- ============================================================================
-- TABLE: grade_history
-- ============================================================================
-- Track grade changes for audit purposes

CREATE TABLE IF NOT EXISTS grade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  grade_type TEXT NOT NULL CHECK (grade_type IN ('assignment', 'course')),
  grade_id UUID NOT NULL, -- ID of assignment_grades or course_grades record
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- What changed
  field_changed TEXT NOT NULL, -- e.g., "points_earned", "percentage", "letter_grade"
  old_value TEXT,
  new_value TEXT,

  -- Who changed it
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_reason TEXT,

  -- When
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grade_history_grade ON grade_history(grade_type, grade_id);
CREATE INDEX IF NOT EXISTS idx_grade_history_user ON grade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_grade_history_tenant ON grade_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grade_history_changed_at ON grade_history(changed_at);

COMMENT ON TABLE grade_history IS 'Audit trail for grade changes';
COMMENT ON COLUMN grade_history.grade_type IS 'Type of grade: assignment or course';

-- ============================================================================
-- TABLE: student_gpa
-- ============================================================================
-- Track overall GPA for students across all courses

CREATE TABLE IF NOT EXISTS student_gpa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- GPA calculations
  cumulative_gpa NUMERIC(4, 2),
  semester_gpa NUMERIC(4, 2), -- For current/most recent semester
  total_credits_earned NUMERIC(6, 2) DEFAULT 0,
  total_credits_attempted NUMERIC(6, 2) DEFAULT 0,

  -- Metadata
  last_calculated_at TIMESTAMPTZ,
  calculation_details JSONB DEFAULT '{}'::jsonb, -- Store breakdown by course

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_gpa_per_tenant_user UNIQUE(tenant_id, user_id),
  CONSTRAINT check_gpa_range CHECK (
    (cumulative_gpa IS NULL OR (cumulative_gpa >= 0 AND cumulative_gpa <= 5.0)) AND
    (semester_gpa IS NULL OR (semester_gpa >= 0 AND semester_gpa <= 5.0))
  )
);

CREATE INDEX IF NOT EXISTS idx_student_gpa_user ON student_gpa(user_id);
CREATE INDEX IF NOT EXISTS idx_student_gpa_tenant ON student_gpa(tenant_id);

COMMENT ON TABLE student_gpa IS 'Overall GPA tracking for students';
COMMENT ON COLUMN student_gpa.cumulative_gpa IS 'Cumulative GPA across all completed courses';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_grading_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_gpa ENABLE ROW LEVEL SECURITY;

-- Policies for grading_scales
CREATE POLICY "Users can view grading scales in their tenant"
  ON grading_scales FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Admins can manage grading scales"
  ON grading_scales FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    auth.jwt()->>'role' IN ('admin', 'super_admin')
  );

-- Policies for grade_ranges
CREATE POLICY "Users can view grade ranges in their tenant"
  ON grade_ranges FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Admins can manage grade ranges"
  ON grade_ranges FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    auth.jwt()->>'role' IN ('admin', 'super_admin')
  );

-- Policies for grade_categories
CREATE POLICY "Users can view grade categories in their tenant"
  ON grade_categories FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Instructors and admins can manage grade categories"
  ON grade_categories FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin')
  );

-- Policies for course_grading_config
CREATE POLICY "Users can view course grading config in their tenant"
  ON course_grading_config FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Instructors and admins can manage course grading config"
  ON course_grading_config FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin')
  );

-- Policies for assignment_grades
CREATE POLICY "Students can view their own assignment grades"
  ON assignment_grades FOR SELECT
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin'))
  );

CREATE POLICY "Instructors and admins can manage assignment grades"
  ON assignment_grades FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin')
  );

-- Policies for course_grades
CREATE POLICY "Students can view their own course grades"
  ON course_grades FOR SELECT
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin'))
  );

CREATE POLICY "Instructors and admins can manage course_grades"
  ON course_grades FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin')
  );

-- Policies for grade_history
CREATE POLICY "Students can view their own grade history"
  ON grade_history FOR SELECT
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin'))
  );

CREATE POLICY "Instructors and admins can create grade history"
  ON grade_history FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin')
  );

-- Policies for student_gpa
CREATE POLICY "Students can view their own GPA"
  ON student_gpa FOR SELECT
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'instructor', 'super_admin'))
  );

CREATE POLICY "Admins can manage student GPA"
  ON student_gpa FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid AND
    auth.jwt()->>'role' IN ('admin', 'super_admin')
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grading_scales_updated_at
  BEFORE UPDATE ON grading_scales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grade_categories_updated_at
  BEFORE UPDATE ON grade_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_grading_config_updated_at
  BEFORE UPDATE ON course_grading_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_grades_updated_at
  BEFORE UPDATE ON assignment_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_grades_updated_at
  BEFORE UPDATE ON course_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_gpa_updated_at
  BEFORE UPDATE ON student_gpa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

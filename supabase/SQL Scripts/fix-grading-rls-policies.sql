-- ============================================================================
-- FIX GRADING SYSTEM RLS POLICIES
-- ============================================================================
-- The original policies assume tenant_id and role are in the JWT,
-- but they are actually stored in the users table.
-- This script drops the old policies and creates new ones that work correctly.
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view grading scales in their tenant" ON grading_scales;
DROP POLICY IF EXISTS "Admins can manage grading scales" ON grading_scales;
DROP POLICY IF EXISTS "Users can view grade ranges in their tenant" ON grade_ranges;
DROP POLICY IF EXISTS "Admins can manage grade ranges" ON grade_ranges;
DROP POLICY IF EXISTS "Users can view grade categories in their tenant" ON grade_categories;
DROP POLICY IF EXISTS "Instructors and admins can manage grade categories" ON grade_categories;
DROP POLICY IF EXISTS "Users can view course grading config in their tenant" ON course_grading_config;
DROP POLICY IF EXISTS "Instructors and admins can manage course grading config" ON course_grading_config;

-- ============================================================================
-- NEW POLICIES FOR grading_scales
-- ============================================================================

-- View policy: Users can view grading scales in their tenant
CREATE POLICY "Users can view grading scales in their tenant"
  ON grading_scales FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Insert policy: Admins can create grading scales
CREATE POLICY "Admins can insert grading scales"
  ON grading_scales FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Update policy: Admins can update grading scales
CREATE POLICY "Admins can update grading scales"
  ON grading_scales FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Delete policy: Admins can delete grading scales
CREATE POLICY "Admins can delete grading scales"
  ON grading_scales FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- NEW POLICIES FOR grade_ranges
-- ============================================================================

-- View policy: Users can view grade ranges in their tenant
CREATE POLICY "Users can view grade ranges in their tenant"
  ON grade_ranges FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Insert policy: Admins can create grade ranges
CREATE POLICY "Admins can insert grade ranges"
  ON grade_ranges FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Update policy: Admins can update grade ranges
CREATE POLICY "Admins can update grade ranges"
  ON grade_ranges FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Delete policy: Admins can delete grade ranges
CREATE POLICY "Admins can delete grade ranges"
  ON grade_ranges FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- NEW POLICIES FOR grade_categories
-- ============================================================================

-- View policy: Users can view grade categories in their tenant
CREATE POLICY "Users can view grade categories in their tenant"
  ON grade_categories FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Insert policy: Instructors and admins can create grade categories
CREATE POLICY "Instructors can insert grade categories"
  ON grade_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Update policy: Instructors and admins can update grade categories
CREATE POLICY "Instructors can update grade categories"
  ON grade_categories FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Delete policy: Instructors and admins can delete grade categories
CREATE POLICY "Instructors can delete grade categories"
  ON grade_categories FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- ============================================================================
-- NEW POLICIES FOR course_grading_config
-- ============================================================================

-- View policy: Users can view course grading config in their tenant
CREATE POLICY "Users can view course grading config in their tenant"
  ON course_grading_config FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Insert policy: Instructors and admins can create course grading config
CREATE POLICY "Instructors can insert course grading config"
  ON course_grading_config FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Update policy: Instructors and admins can update course grading config
CREATE POLICY "Instructors can update course grading config"
  ON course_grading_config FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Delete policy: Instructors and admins can delete course grading config
CREATE POLICY "Instructors can delete course grading config"
  ON course_grading_config FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

-- Check all policies on grading tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN (
  'grading_scales',
  'grade_ranges',
  'grade_categories',
  'course_grading_config'
)
ORDER BY tablename, cmd, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Grading system RLS policies fixed successfully!';
  RAISE NOTICE '📋 New policies use the users table to check tenant_id and role';
  RAISE NOTICE '🔐 Policies now support: SELECT, INSERT, UPDATE, DELETE operations';
END $$;

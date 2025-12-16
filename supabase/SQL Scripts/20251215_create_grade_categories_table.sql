-- =====================================================
-- CREATE GRADE CATEGORIES TABLE
-- =====================================================
-- This table stores weighted categories for course grading
-- (e.g., Homework: 20%, Exams: 50%, Participation: 30%)
-- =====================================================

-- Create grade_categories table
CREATE TABLE IF NOT EXISTS grade_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0-100 (percentage)
  drop_lowest INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  color_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT grade_categories_weight_check CHECK (weight >= 0 AND weight <= 100),
  CONSTRAINT grade_categories_drop_lowest_check CHECK (drop_lowest >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_grade_categories_tenant ON grade_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_course ON grade_categories(course_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_display_order ON grade_categories(course_id, display_order);

-- Enable RLS
ALTER TABLE grade_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view grade categories for their tenant" ON grade_categories;
DROP POLICY IF EXISTS "Admins can manage grade categories" ON grade_categories;

-- RLS Policies
CREATE POLICY "Users can view grade categories for their tenant"
  ON grade_categories
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage grade categories"
  ON grade_categories
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT ON grade_categories TO authenticated;
GRANT ALL ON grade_categories TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_grade_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_grade_categories_updated_at ON grade_categories;

CREATE TRIGGER set_grade_categories_updated_at
  BEFORE UPDATE ON grade_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_grade_categories_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Grade categories table created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the translations SQL file: 20251215_grading_complete_translations.sql';
  RAISE NOTICE '2. Start creating grade categories for your courses!';
END $$;

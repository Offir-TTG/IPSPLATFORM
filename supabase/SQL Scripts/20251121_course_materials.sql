-- ============================================================================
-- COURSE MATERIALS TABLE
-- ============================================================================
-- Stores files, documents, PDFs, and other materials that can be attached to courses
-- for students to download and access
-- ============================================================================

-- Create course_materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- mime type (e.g., 'application/pdf', 'application/msword')
  file_size BIGINT NOT NULL, -- Size in bytes
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  category TEXT, -- Optional: 'syllabus', 'reading', 'assignment', 'reference', 'other'
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique ordering within course
  CONSTRAINT unique_material_order UNIQUE(course_id, display_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_tenant ON course_materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_category ON course_materials(category);
CREATE INDEX IF NOT EXISTS idx_course_materials_published ON course_materials(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_course_materials_uploaded_by ON course_materials(uploaded_by);

-- Comments
COMMENT ON TABLE course_materials IS 'Files and documents attached to courses for student access';
COMMENT ON COLUMN course_materials.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN course_materials.file_size IS 'File size in bytes';
COMMENT ON COLUMN course_materials.display_order IS 'Order in which materials are displayed (0-indexed)';
COMMENT ON COLUMN course_materials.category IS 'Optional categorization: syllabus, reading, assignment, reference, other';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and instructors can see all materials in their tenant
CREATE POLICY course_materials_select_policy ON course_materials
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins and instructors can insert materials in their tenant
CREATE POLICY course_materials_insert_policy ON course_materials
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'instructor')
    )
  );

-- Policy: Admins and instructors can update materials in their tenant
CREATE POLICY course_materials_update_policy ON course_materials
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'instructor')
    )
  );

-- Policy: Admins and instructors can delete materials in their tenant
CREATE POLICY course_materials_delete_policy ON course_materials
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'instructor')
    )
  );

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_course_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_materials_updated_at
  BEFORE UPDATE ON course_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_course_materials_updated_at();

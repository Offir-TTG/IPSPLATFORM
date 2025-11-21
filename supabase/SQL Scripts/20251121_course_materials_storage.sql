-- ============================================================================
-- COURSE MATERIALS STORAGE BUCKET SETUP
-- ============================================================================
-- Creates a storage bucket for course materials (PDFs, documents, etc.)
-- with appropriate access policies
-- ============================================================================

-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials',
  'course-materials',
  true, -- Public bucket so students can download materials
  52428800, -- 50MB limit per file
  ARRAY[
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',
    -- Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    -- Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    -- Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Allow authenticated users in tenant to read materials
CREATE POLICY course_materials_storage_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
  );

-- Policy: Allow admins and instructors to upload materials
CREATE POLICY course_materials_storage_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'instructor')
    )
  );

-- Policy: Allow admins and instructors to update materials
CREATE POLICY course_materials_storage_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'instructor')
    )
  );

-- Policy: Allow admins and instructors to delete materials
CREATE POLICY course_materials_storage_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'instructor')
    )
  );

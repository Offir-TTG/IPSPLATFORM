-- Add image_url column to courses table if it doesn't exist
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create a storage bucket for course images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view course images" ON storage.objects;
CREATE POLICY "Anyone can view course images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-images');

DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;
CREATE POLICY "Authenticated users can upload course images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-images'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can update course images" ON storage.objects;
CREATE POLICY "Authenticated users can update course images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-images'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can delete course images" ON storage.objects;
CREATE POLICY "Authenticated users can delete course images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-images'
  AND auth.role() = 'authenticated'
);

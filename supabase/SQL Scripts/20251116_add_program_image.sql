-- Add image_url column to programs table if it doesn't exist
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create a storage bucket for program images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-images', 'program-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view program images" ON storage.objects;
CREATE POLICY "Anyone can view program images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'program-images');

DROP POLICY IF EXISTS "Authenticated users can upload program images" ON storage.objects;
CREATE POLICY "Authenticated users can upload program images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can update program images" ON storage.objects;
CREATE POLICY "Authenticated users can update program images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can delete program images" ON storage.objects;
CREATE POLICY "Authenticated users can delete program images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);
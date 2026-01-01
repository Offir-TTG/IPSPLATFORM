-- ============================================================================
-- SIMPLE FIX: Disable RLS on Public Storage Bucket
-- ============================================================================
-- This script disables RLS on the public storage bucket to allow uploads
-- This is appropriate for public assets like logos
-- ============================================================================

-- Update the bucket to disable RLS
UPDATE storage.buckets
SET public = true
WHERE id = 'public';

-- Optionally, if RLS needs to stay enabled, run this instead:
-- (Comment out the above and uncomment below)

/*
-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'logos'
);

-- Create policy to allow public read access to logos
CREATE POLICY "Public read access for logos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'public'
);

-- Create policy to allow authenticated users to update their logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'logos'
);

-- Create policy to allow authenticated users to delete their logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'logos'
);
*/

SELECT 'Public bucket RLS disabled - uploads should work now!' as status;

-- ============================================================================
-- Storage Policies for Public Bucket
-- ============================================================================
-- This script adds RLS policies to allow authenticated users to upload
-- and manage files in the public storage bucket
-- ============================================================================

-- Drop existing policies if they exist (ignore errors if they don't)
DROP POLICY IF EXISTS "Allow authenticated uploads to public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from public bucket" ON storage.objects;

-- Allow authenticated users to insert into public bucket
CREATE POLICY "Allow authenticated uploads to public bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Allow public read access
CREATE POLICY "Allow public reads from public bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated updates to public bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'public');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated deletes from public bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'public');

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%public bucket%'
ORDER BY policyname;

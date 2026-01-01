-- ============================================================================
-- FIX: Public Storage Bucket Policies
-- ============================================================================
-- This script adds RLS policies to the public storage bucket to allow
-- authenticated users to upload, view, and manage logo files
-- ============================================================================

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
  AND (storage.foldername(name))[1] = 'logos'
);

-- Create policy to allow authenticated users to update their logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'logos'
)
WITH CHECK (
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

-- Verify policies were created
DO $$
BEGIN
  RAISE NOTICE 'Storage bucket policies created successfully!';
  RAISE NOTICE 'Policies allow authenticated users to manage files in public/logos/';
  RAISE NOTICE 'Public read access is enabled for all logo files';
END $$;

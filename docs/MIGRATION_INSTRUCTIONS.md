# Migration Instructions for Image Storage

## Manual Migration Steps

Since Supabase CLI is not linked, you need to run the migration manually in your Supabase Dashboard.

### Step 1: Add image_url Column to Programs Table

1. Go to your Supabase Dashboard
2. Navigate to the **SQL Editor**
3. Run this SQL command:

```sql
-- Add image_url column to programs table if it doesn't exist
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Step 2: Create Storage Bucket for Program Images

Run this SQL to create the storage bucket:

```sql
-- Create a storage bucket for program images
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-images', 'program-images', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Set Up RLS Policies for Storage

Run these commands to set up the necessary security policies:

```sql
-- Allow anyone to view program images
CREATE POLICY IF NOT EXISTS "Anyone can view program images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'program-images');

-- Allow authenticated users to upload program images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload program images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update program images
CREATE POLICY IF NOT EXISTS "Authenticated users can update program images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete program images
CREATE POLICY IF NOT EXISTS "Authenticated users can delete program images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);
```

### Step 4: Configure Storage Settings

1. Go to **Storage** section in Supabase Dashboard
2. Click on the `program-images` bucket
3. Verify these settings:
   - **Public**: ✅ Enabled (for public read access)
   - **Max file size**: 5MB
   - **Allowed MIME types**: `image/*`

### Step 5: Verify the Setup

1. Check that the `image_url` column appears in your programs table
2. Check that the `program-images` bucket appears in Storage
3. Try uploading an image through the program dialog to test

## Troubleshooting

### If images are not persisting:

1. **Check Storage Bucket**: Ensure the `program-images` bucket exists
2. **Check RLS Policies**: Verify all 4 policies are created
3. **Check Console Errors**: Look for any errors in browser console
4. **Check Network Tab**: Verify the upload request succeeds

### If you get CORS errors:

1. Go to **Settings** > **API** in Supabase Dashboard
2. Add your domain to the CORS allowed origins:
   - `http://localhost:3000` (for development)
   - Your production domain

### If uploads fail with permission errors:

1. Ensure you're logged in (authenticated)
2. Check that your user role has the necessary permissions
3. Verify the RLS policies are correctly set up

## Testing the Implementation

1. Open the Programs page in admin panel
2. Click "New Program"
3. Fill in the program details
4. Click the upload area to select an image
5. Save the program
6. Refresh the page and verify the image persists
7. Edit the program and verify the image is still there

## Success Indicators

✅ Image preview shows after selection
✅ Image uploads successfully on save
✅ Image URL is stored in database
✅ Image persists after page refresh
✅ Success toast appears after save
✅ Error messages show for failed uploads

## Additional Notes

- Images are stored with unique timestamps to prevent conflicts
- Old images are automatically deleted when replaced
- The system supports PNG, JPG, and GIF formats
- Maximum file size is 5MB by default

If you continue to have issues, please check:
1. Supabase service status
2. Your project's storage quota
3. Browser console for detailed error messages
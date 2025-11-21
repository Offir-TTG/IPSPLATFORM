# Image Upload Troubleshooting Guide

## Quick Diagnosis Steps

### 1. Check Browser Console
Open your browser's developer console (F12) and look for any error messages when uploading an image. The enhanced logging will show:
- File details (name, size, type)
- Authentication status
- Upload progress
- Specific error messages

### 2. Common Issues and Solutions

#### Issue: "Storage bucket 'program-images' not found"
**Solution:** The storage bucket doesn't exist in Supabase.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Storage** section
3. Click **New bucket**
4. Create a bucket with:
   - Name: `program-images`
   - Public: ✅ (Check this box)
   - Click **Create bucket**

#### Issue: "Permission denied" or 403 errors
**Solution:** RLS policies are not configured correctly.

1. Go to **Storage** → `program-images` bucket
2. Click on **Policies** tab
3. Add the following policies:

**Policy 1: Public Read Access**
```sql
-- Allow anyone to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'program-images');
```

**Policy 2: Authenticated Upload**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);
```

**Policy 3: Authenticated Update**
```sql
-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);
```

**Policy 4: Authenticated Delete**
```sql
-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);
```

#### Issue: "Authentication required" or session errors
**Solution:** User session has expired or is invalid.

1. Log out and log back in
2. Check if cookies are enabled in your browser
3. Clear browser cache and cookies for your domain
4. Verify your Supabase environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### Issue: "File size exceeds 5MB limit"
**Solution:** The uploaded file is too large.

1. Compress the image before uploading
2. Use an image optimization tool
3. Consider using a different image format (JPEG instead of PNG)

#### Issue: Image uploads but doesn't display
**Solution:** The URL might be incorrect or CORS issues.

1. Check the Network tab in browser DevTools
2. Verify the image URL is correct by opening it in a new tab
3. Check CORS settings in Supabase:
   - Go to **Settings** → **API**
   - Add your domain to allowed origins

## Manual Database Check

If the image_url column is missing from the programs table:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query:
```sql
-- Check if image_url column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'programs'
AND column_name = 'image_url';
```

3. If no results, add the column:
```sql
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

## Testing the Upload Function

### Test 1: Check Authentication
1. Open browser console
2. Try uploading an image
3. Look for: "Session user: [email]" in the logs

### Test 2: Check Storage Access
1. Go to Supabase Dashboard → Storage
2. Try manually uploading a file to the `program-images` bucket
3. If this fails, the bucket configuration is incorrect

### Test 3: Check File Processing
1. Select a small image (< 1MB)
2. Watch the console for:
   - "Starting image upload for program: [id]"
   - "File details: {name, size, type}"
   - "Uploading file to path: programs/[filename]"
   - "Public URL generated: [url]"

## Environment Variable Checklist

Ensure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key] # Only if using server-side operations
```

## Browser Console Commands for Testing

You can run these commands in the browser console to test:

```javascript
// Check if Supabase client is initialized
console.log(window.supabase);

// Check current session
const { data: { session } } = await window.supabase.auth.getSession();
console.log('Current session:', session);

// Test bucket access
const { data, error } = await window.supabase.storage.from('program-images').list();
console.log('Bucket access test:', { data, error });
```

## Still Not Working?

1. **Check Supabase Status**: Visit [status.supabase.com](https://status.supabase.com)
2. **Review Supabase Logs**: Dashboard → Logs → Storage Logs
3. **Check Network Tab**: Look for failed requests to Supabase
4. **Verify Project Status**: Ensure your Supabase project is not paused
5. **Check Storage Quota**: Dashboard → Settings → Billing (ensure you haven't exceeded storage limits)

## Contact Support

If none of the above solutions work:
1. Gather all error messages from the browser console
2. Note your Supabase project reference
3. Check the specific time when the error occurred
4. Contact Supabase support with these details

## Prevention Tips

1. **Regular Testing**: Test image upload after any authentication changes
2. **Monitor Storage**: Keep track of storage usage in Supabase Dashboard
3. **Session Management**: Implement proper session refresh logic
4. **Error Boundaries**: Add error boundaries in React to catch upload failures gracefully
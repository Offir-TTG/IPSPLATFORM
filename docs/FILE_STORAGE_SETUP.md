# File Storage Setup Guide

## Overview
This platform uses Supabase Storage for handling file uploads including images, documents, and recordings.

## Storage Solutions Implemented

### 1. Supabase Storage (Currently Implemented)
- **Bucket**: `program-images` - Stores program cover images
- **Access**: Public read, authenticated write
- **File Types**: Images (PNG, JPG, GIF)
- **Max Size**: Configurable (default 5MB)

### Setup Steps

#### 1. Run Migration
The migration file `20251116_add_program_image.sql` will:
- Add `image_url` column to programs table
- Create storage bucket `program-images`
- Set up RLS policies for secure access

Run the migration:
```bash
npx supabase db push
```

#### 2. Configure Supabase Storage
1. Go to your Supabase Dashboard
2. Navigate to Storage section
3. Verify `program-images` bucket exists
4. Check bucket settings:
   - Public: Yes (for public read access)
   - Max file size: 5MB (adjustable)
   - Allowed MIME types: image/*

#### 3. Environment Variables
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## How It Works

### Upload Flow
1. User selects file in UI
2. File is converted to preview using FileReader
3. On save, file uploads to Supabase Storage
4. Public URL is stored in database
5. Old images are deleted when replaced

### Storage Structure
```
program-images/
  └── programs/
      ├── program-id-timestamp.jpg
      ├── program-id-timestamp.png
      └── ...
```

## Adding More Storage Types

### For Course Materials
```typescript
// Create bucket
CREATE STORAGE BUCKET 'course-materials';

// Usage
const { data, error } = await supabase.storage
  .from('course-materials')
  .upload(`courses/${courseId}/${fileName}`, file);
```

### For User Avatars
```typescript
// Create bucket
CREATE STORAGE BUCKET 'avatars';

// Usage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`users/${userId}.png`, file);
```

### For Recordings
```typescript
// Create bucket
CREATE STORAGE BUCKET 'recordings';

// Usage with larger files
const { data, error } = await supabase.storage
  .from('recordings')
  .upload(`recordings/${sessionId}.mp4`, file, {
    cacheControl: '3600',
    upsert: true
  });
```

## Best Practices

### 1. File Size Limits
- Images: 5MB
- Documents: 10MB
- Videos: 100MB (consider streaming for larger)

### 2. File Validation
```typescript
const validateFile = (file: File) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

  if (file.size > maxSize) {
    throw new Error('File too large');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
};
```

### 3. Image Optimization
Consider using image optimization services:
- Cloudinary for automatic optimization
- Next.js Image component for optimized loading
- WebP format for better compression

### 4. CDN Configuration
Supabase Storage includes CDN by default. For better performance:
- Use image transformations: `?width=200&height=200`
- Implement lazy loading
- Use responsive images

## Alternative Storage Options

### AWS S3
```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});

const uploadToS3 = async (file: File) => {
  const params = {
    Bucket: 'your-bucket',
    Key: `programs/${Date.now()}-${file.name}`,
    Body: file,
    ContentType: file.type
  };

  return s3.upload(params).promise();
};
```

### Cloudinary
```typescript
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'your-preset');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  return res.json();
};
```

## Troubleshooting

### Issue: Images not persisting
- Check Supabase Storage bucket exists
- Verify RLS policies are correct
- Ensure file upload completes before saving to DB

### Issue: Large files failing
- Increase timeout in Supabase settings
- Implement chunked upload for large files
- Consider direct upload from client

### Issue: CORS errors
- Configure CORS in Supabase Storage settings
- Add your domain to allowed origins

## Security Considerations

1. **File Type Validation**: Always validate on server
2. **Size Limits**: Enforce both client and server side
3. **Access Control**: Use RLS policies appropriately
4. **Virus Scanning**: Consider adding for user uploads
5. **Rate Limiting**: Implement upload limits per user

## Monitoring

Track storage usage:
```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size
FROM storage.objects
GROUP BY bucket_id;
```

## Clean-up Strategy

Implement regular cleanup for orphaned files:
```typescript
// Run periodically
const cleanupOrphanedFiles = async () => {
  // Get all file URLs from database
  const { data: programs } = await supabase
    .from('programs')
    .select('image_url');

  // Get all files from storage
  const { data: files } = await supabase.storage
    .from('program-images')
    .list('programs');

  // Delete files not in database
  // Implementation details...
};
```
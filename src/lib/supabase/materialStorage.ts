import { supabase } from '@/lib/supabase/client';

/**
 * Upload a course material file to Supabase Storage
 * @param file - The file to upload
 * @param courseId - The course ID the material belongs to
 * @returns Public URL of the uploaded file
 */
export async function uploadCourseMaterial(file: File, courseId: string): Promise<string | null> {
  try {
    console.log('Starting material upload for course:', courseId);
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      console.error('File size exceeds 50MB limit');
      throw new Error('File size exceeds 50MB limit');
    }

    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }

    let activeSession = session;

    if (!activeSession) {
      console.log('No active session found, attempting to refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        console.error('Failed to refresh session:', refreshError);
        throw new Error('Authentication required. Please log in again.');
      }
      activeSession = refreshData.session;
      console.log('Session refreshed successfully');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${courseId}-${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `materials/${fileName}`;

    console.log('Uploading file to path:', filePath);
    console.log('Session user:', activeSession?.user?.email);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't allow overwriting
        contentType: file.type
      });

    if (error) {
      console.error('Supabase storage upload error:', {
        message: error.message,
        statusCode: (error as any).statusCode,
        error: error
      });

      // More specific error messages
      if ((error as any).statusCode === 404) {
        throw new Error('Storage bucket "course-materials" not found. Please create it in Supabase Dashboard.');
      } else if ((error as any).statusCode === 403) {
        throw new Error('Permission denied. Please check storage policies.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }

    console.log('File uploaded successfully:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-materials')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Upload error caught:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error; // Re-throw to let the caller handle it
  }
}

/**
 * Delete a course material file from Supabase Storage
 * @param fileUrl - The public URL of the file to delete
 * @returns true if deletion was successful
 */
export async function deleteCourseMaterial(fileUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('course-materials');

    if (bucketIndex === -1) return false;

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('course-materials')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file type icon name based on MIME type
 * @param mimeType - The MIME type of the file
 * @returns Icon name for the file type
 */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('application/pdf')) return 'file-pdf';
  if (mimeType.startsWith('application/msword') || mimeType.includes('wordprocessingml')) return 'file-word';
  if (mimeType.startsWith('application/vnd.ms-excel') || mimeType.includes('spreadsheetml')) return 'file-excel';
  if (mimeType.startsWith('application/vnd.ms-powerpoint') || mimeType.includes('presentationml')) return 'file-powerpoint';
  if (mimeType.startsWith('image/')) return 'file-image';
  if (mimeType.startsWith('video/')) return 'file-video';
  if (mimeType.startsWith('audio/')) return 'file-audio';
  if (mimeType.startsWith('text/')) return 'file-text';
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return 'file-archive';
  return 'file';
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns File extension (e.g., "pdf")
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'FILE';
}

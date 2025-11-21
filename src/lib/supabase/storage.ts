import { supabase } from '@/lib/supabase/client';

export async function uploadProgramImage(file: File, programId?: string): Promise<string | null> {
  try {
    console.log('Starting image upload for program:', programId || 'new');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File size exceeds 5MB limit');
      throw new Error('File size exceeds 5MB limit');
    }

    // Check if user is authenticated - try getSession first as it's more reliable
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }

    let activeSession = session;

    if (!activeSession) {
      console.log('No active session found, attempting to refresh...');
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        console.error('Failed to refresh session:', refreshError);
        throw new Error('Authentication required. Please log in again.');
      }
      activeSession = refreshData.session;
      console.log('Session refreshed successfully');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${programId || 'temp'}-${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `programs/${fileName}`;

    console.log('Uploading file to path:', filePath);
    console.log('Session user:', activeSession?.user?.email);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('program-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
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
        throw new Error('Storage bucket "program-images" not found. Please create it in Supabase Dashboard.');
      } else if ((error as any).statusCode === 403) {
        throw new Error('Permission denied. Please check storage policies.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }

    console.log('File uploaded successfully:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('program-images')
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

export async function deleteProgramImage(imageUrl: string): Promise<boolean> {
  try {

    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('program-images');

    if (bucketIndex === -1) return false;

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('program-images')
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
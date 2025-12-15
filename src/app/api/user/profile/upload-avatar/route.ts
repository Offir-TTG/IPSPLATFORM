import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// POST /api/user/profile/upload-avatar - Upload user profile avatar
export const POST = withAuth(async (
  request: NextRequest,
  user: any
) => {
  try {
    console.log('Server-side avatar upload started for user:', user.email);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (2MB limit for avatars)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // IMPORTANT: Create client AFTER cookies have been accessed by withAuth middleware
    // This ensures the auth session is properly maintained
    const supabase = await createClient();

    // Verify user authentication for storage
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error('Auth verification failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication failed for storage access' },
        { status: 401 }
      );
    }

    console.log('Authenticated user for storage:', authUser.id, 'Expected:', user.id);

    if (authUser.id !== user.id) {
      console.error('User ID mismatch! Auth:', authUser.id, 'vs', user.id);
      return NextResponse.json(
        { success: false, error: 'User authentication mismatch' },
        { status: 401 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Supabase Storage with server client
    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Storage upload error:', error);

      // More specific error messages
      if ((error as any).statusCode === 404) {
        return NextResponse.json(
          { success: false, error: 'Storage bucket "user-avatars" not found. Please create it in Supabase Dashboard.' },
          { status: 404 }
        );
      } else if ((error as any).statusCode === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please check storage policies.' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: `Upload failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    console.log('File uploaded successfully:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', publicUrl);

    // Update user's avatar_url in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user avatar_url:', updateError);
      // Don't fail the request - image is uploaded, just log the error
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'user.avatar_uploaded',
      details: {
        fileName: fileName,
        filePath: filePath,
        fileSize: file.size,
        fileType: file.type,
        publicUrl: publicUrl,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload avatar'
      },
      { status: 500 }
    );
  }
}, ['student', 'instructor', 'admin']);

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// POST /api/programs/upload-image - Upload a program image
export const POST = withAuth(async (
  request: NextRequest,
  user: any
) => {
  try {
    console.log('Server-side image upload started for user:', user.email);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const programId = formData.get('programId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
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

    const supabase = await createClient();

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${programId || 'temp'}-${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `programs/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Supabase Storage with server client
    const { data, error } = await supabase.storage
      .from('program-images')
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
          { success: false, error: 'Storage bucket "program-images" not found. Please create it in Supabase Dashboard.' },
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
      .from('program-images')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', publicUrl);

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'program.image_uploaded',
      details: {
        programId: programId || 'temp',
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
        error: error instanceof Error ? error.message : 'Failed to upload image'
      },
      { status: 500 }
    );
  }
}, ['admin', 'instructor']);

// DELETE /api/programs/upload-image - Delete a program image
export const DELETE = withAuth(async (
  request: NextRequest,
  user: any
) => {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'No image URL provided' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('program-images');

    if (bucketIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('program-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'program.image_deleted',
      details: {
        imageUrl: imageUrl,
        filePath: filePath,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image'
      },
      { status: 500 }
    );
  }
}, ['admin']);
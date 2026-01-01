import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

// POST - Upload logo
export async function POST(request: NextRequest) {
  try {
    console.log('[Logo Upload] Starting upload process...');

    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      console.log('[Logo Upload] Auth failed');
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    console.log('[Logo Upload] Auth successful, tenant:', auth.tenant.id);
    const { tenant } = auth;
    const supabase = await createClient();

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('[Logo Upload] File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size
    });

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 2MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenant.id}_${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[Logo Upload] Uploading to storage:', {
      bucket: 'public',
      path: filePath,
      size: buffer.length,
      contentType: file.type
    });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    console.log('[Logo Upload] Upload result:', { uploadData, uploadError });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      return NextResponse.json(
        { success: false, error: uploadError.message || 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('public').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while uploading the logo' },
      { status: 500 }
    );
  }
}

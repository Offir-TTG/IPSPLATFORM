import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/admin/tenant/users/[id]/upload-avatar
//
// Admin-side avatar upload — an admin uploads a profile image on behalf
// of another user in the same tenant.
//
// Authorization:
//   - Caller must be authenticated.
//   - Caller must hold 'owner' or 'admin' role in the target user's tenant.
//   - Target user must belong to the caller's tenant (no cross-tenant
//     uploads even if a stale id is passed).
//
// Storage layout mirrors the user-side endpoint: `user-avatars/<userId>/<file>`.
// Writes via the admin client (service role) because the storage policy
// is keyed to `auth.uid()` matching the path prefix — and here that uid
// is the admin's, not the target user's.
// ============================================================================

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const targetUserId = params.id;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'User id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Authn
    const {
      data: { user: callingUser },
    } = await supabase.auth.getUser();
    if (!callingUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Tenant context
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Authz — caller must be admin in this tenant
    const { data: callerTenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', callingUser.id)
      .single();

    if (!callerTenantUser || !['owner', 'admin'].includes(callerTenantUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Use the admin client to look up the target user — RLS on
    // tenant_users is self-scoped, so the cookie client wouldn't see
    // other users in the same tenant.
    const adminClient = createAdminClient();
    const { data: targetTenantUser } = await adminClient
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', targetUserId)
      .single();

    if (!targetTenantUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Upload to storage under the TARGET user's namespace so the file
    // belongs to that user even though the admin uploaded it.
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `${targetUserId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from('user-avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Admin avatar upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from('user-avatars').getPublicUrl(filePath);

    const { error: updateError } = await adminClient
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Failed to update target user avatar_url:', updateError);
      // File is in storage; just log so admin sees the issue.
    }

    // Audit log — calling admin acted on the target user.
    await logAuditEvent({
      tenantId: tenant.id,
      userId: callingUser.id,
      userEmail: callingUser.email || 'unknown',
      action: 'admin.user.avatar_uploaded',
      details: {
        targetUserId,
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type,
        publicUrl,
      },
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }).catch((e) => console.error('audit log failed', e));

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('Admin avatar upload fatal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

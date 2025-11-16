import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';

// DELETE - Revoke invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Verify user is admin in this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Verify invitation belongs to current tenant
    const { data: invitation } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single();

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 });
    }

    // Update invitation status to revoked
    const { error: updateError } = await supabase
      .from('tenant_invitations')
      .update({ status: 'revoked' })
      .eq('id', id);

    if (updateError) {
      console.error('Error revoking invitation:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to revoke invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while revoking invitation' },
      { status: 500 }
    );
  }
}

// PATCH - Resend invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Verify user is admin in this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Verify invitation belongs to current tenant and is pending
    const { data: invitation } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .eq('status', 'pending')
      .single();

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found or already processed' },
        { status: 404 }
      );
    }

    // Generate new token and extend expiration
    const newToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Update invitation
    const { error: updateError } = await supabase
      .from('tenant_invitations')
      .update({
        token: newToken,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error resending invitation:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to resend invitation' },
        { status: 500 }
      );
    }

    // TODO: Send invitation email
    // For now, return the new invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/accept?token=${newToken}`;

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      invitationUrl, // Remove this in production after email is implemented
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while resending invitation' },
      { status: 500 }
    );
  }
}

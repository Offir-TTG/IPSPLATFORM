import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// POST /api/user/profile/change-password - Change user password
export const POST = withAuth(async (
  request: NextRequest,
  user: any
) => {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      // Log failed password change attempt
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: 'password.change_failed',
        eventType: 'UPDATE',
        eventCategory: 'SECURITY',
        resourceType: 'users',
        resourceId: user.id,
        description: 'Failed password change attempt - incorrect current password',
        status: 'failure',
        riskLevel: 'medium',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: 'password.change_failed',
        eventType: 'UPDATE',
        eventCategory: 'SECURITY',
        resourceType: 'users',
        resourceId: user.id,
        description: `Failed to update password: ${updateError.message}`,
        status: 'failure',
        riskLevel: 'high',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { error: updateError.message },
      });

      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Update password_last_changed in users table
    await supabase
      .from('users')
      .update({ password_last_changed: new Date().toISOString() })
      .eq('id', user.id);

    // Log successful password change
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'password.changed',
      eventType: 'UPDATE',
      eventCategory: 'SECURITY',
      resourceType: 'users',
      resourceId: user.id,
      description: 'Password changed successfully',
      status: 'success',
      riskLevel: 'low',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['student', 'instructor', 'admin']);

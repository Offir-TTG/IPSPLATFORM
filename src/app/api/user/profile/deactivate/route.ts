import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

// POST /api/user/profile/deactivate - Deactivate user account (soft delete)
export const POST = withAuth(async (
  request: NextRequest,
  user: any
) => {
  try {
    const supabase = await createClient();

    // Set user as inactive instead of deleting
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Account deactivation error:', updateError);

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: 'account.deactivation_failed',
        eventType: 'UPDATE',
        eventCategory: 'SECURITY',
        resourceType: 'users',
        resourceId: user.id,
        description: `Failed to deactivate account: ${updateError.message}`,
        status: 'failure',
        riskLevel: 'medium',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { error: updateError.message },
      });

      return NextResponse.json(
        { success: false, error: 'Failed to deactivate account' },
        { status: 500 }
      );
    }

    // Log successful account deactivation
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'account.deactivated',
      eventType: 'UPDATE',
      eventCategory: 'SECURITY',
      resourceType: 'users',
      resourceId: user.id,
      description: 'User account deactivated (soft delete)',
      status: 'success',
      riskLevel: 'high',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        deactivation_reason: 'user_requested',
        can_reactivate: true,
      },
    });

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate account error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['student', 'instructor', 'admin']);

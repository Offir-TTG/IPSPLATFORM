import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelEnrollment } from '@/lib/payments/enrollmentService';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// POST /api/admin/enrollments/:id/cancel - Cancel an enrollment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { reason, refund_amount } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    // Verify enrollment exists
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, user_id, product_id, total_amount, paid_amount')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Cancel enrollment
    await cancelEnrollment(
      params.id,
      userData.tenant_id,
      reason,
      user.id,
      refund_amount
    );

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'enrollment.cancelled',
      details: {
        enrollmentId: params.id,
        enrolledUserId: enrollment.user_id,
        reason,
        refundAmount: refund_amount || 0,
        paidAmount: enrollment.paid_amount,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Enrollment cancelled successfully',
      refund_amount: refund_amount || 0,
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/enrollments/:id/cancel:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

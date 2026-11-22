import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelEnrollment, CancelEnrollmentError } from '@/lib/payments/enrollmentService';
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

    const result = await cancelEnrollment(
      params.id,
      userData.tenant_id,
      reason,
      user.id,
      refund_amount,
      user.email,
    );

    // Cancelled, but the money didn't go back: say so plainly, so the admin
    // doesn't tell the client a refund is on its way.
    if (result.refundError) {
      return NextResponse.json(
        {
          error: `The enrollment was cancelled, but the refund failed: ${result.refundError}. Refunded so far: ${result.refunded.toFixed(2)}. Finish the refund from the payments page.`,
          cancelled: true,
          ...result,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment cancelled successfully',
      refund_amount: result.refunded,
      ...result,
    });

  } catch (error: any) {
    if (error instanceof CancelEnrollmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error in POST /api/admin/enrollments/:id/cancel:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

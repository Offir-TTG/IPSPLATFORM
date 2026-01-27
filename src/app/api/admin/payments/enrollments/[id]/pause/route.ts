import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pauseEnrollmentPayments } from '@/lib/payments/scheduleManager';
export const dynamic = 'force-dynamic';

// POST /api/admin/payments/enrollments/:id/pause - Pause enrollment payments
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
      .select('role, tenant_id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    const adminName = `${userData.first_name} ${userData.last_name}`.trim() || 'Admin';

    // Pause payments
    const result = await pauseEnrollmentPayments(
      params.id,
      userData.tenant_id,
      user.id,
      adminName,
      reason
    );return NextResponse.json({
      success: true,
      pausedCount: result.pausedCount,
      message: `Paused ${result.pausedCount} payment(s) successfully`,
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/payments/enrollments/:id/pause:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

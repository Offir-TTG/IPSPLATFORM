import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resumeEnrollmentPayments } from '@/lib/payments/scheduleManager';
export const dynamic = 'force-dynamic';

// POST /api/admin/payments/enrollments/:id/resume - Resume enrollment payments
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
    const { new_start_date } = body;

    const adminName = `${userData.first_name} ${userData.last_name}`.trim() || 'Admin';

    // Resume payments
    const result = await resumeEnrollmentPayments(
      params.id,
      userData.tenant_id,
      user.id,
      adminName,
      new_start_date ? new Date(new_start_date) : undefined
    );return NextResponse.json({
      success: true,
      resumedCount: result.resumedCount,
      schedules: result.schedules,
      message: `Resumed ${result.resumedCount} payment(s) successfully`,
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/payments/enrollments/:id/resume:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

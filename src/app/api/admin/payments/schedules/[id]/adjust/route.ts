import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adjustScheduleDate } from '@/lib/payments/scheduleManager';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// POST /api/admin/payments/schedules/:id/adjust - Adjust payment date
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
    const { new_date, reason } = body;

    if (!new_date || !reason) {
      return NextResponse.json(
        { error: 'new_date and reason are required' },
        { status: 400 }
      );
    }

    const adminName = `${userData.first_name} ${userData.last_name}`.trim() || 'Admin';

    // Adjust schedule
    const schedule = await adjustScheduleDate(
      params.id,
      userData.tenant_id,
      new Date(new_date),
      user.id,
      adminName,
      reason
    );

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'schedule.adjusted',
      details: {
        scheduleId: params.id,
        oldDate: schedule.adjustment_history[schedule.adjustment_history.length - 1]?.old_date,
        newDate: new_date,
        reason,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      schedule,
      message: 'Payment date adjusted successfully',
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/payments/schedules/:id/adjust:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

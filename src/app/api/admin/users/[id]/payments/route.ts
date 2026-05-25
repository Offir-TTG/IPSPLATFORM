import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/payments
// Returns:
//   upcoming: payment_schedules with status='pending' or 'failed' (anything
//             still owed), with overdue flag for past-due rows.
//   history:  payments rows (actual settled transactions), most recent first.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerRow || !['admin', 'super_admin'].includes(callerRow.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // First pull the user's enrollment IDs in one query (payments has no
    // user_id column — everything joins through enrollment_id).
    const { data: enrollments, error: enrErr } = await adminClient
      .from('enrollments')
      .select('id, product:products ( title )')
      .eq('user_id', params.id);

    if (enrErr) {
      console.error('enrollments lookup failed:', enrErr);
      return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 });
    }

    const enrollmentIds = (enrollments ?? []).map((e: any) => e.id);
    const productTitleByEnrollment = new Map<string, string>(
      (enrollments ?? []).map((e: any) => [
        e.id,
        e.product?.title ?? '',
      ])
    );

    if (enrollmentIds.length === 0) {
      return NextResponse.json({ upcoming: [], history: [] });
    }

    const [{ data: upcomingRaw, error: upErr }, { data: historyRaw, error: hErr }] = await Promise.all([
      adminClient
        .from('payment_schedules')
        .select('id, enrollment_id, amount, currency, scheduled_date, status, payment_type, payment_number, retry_count, next_retry_date')
        .in('enrollment_id', enrollmentIds)
        .in('status', ['pending', 'processing', 'failed', 'paused', 'adjusted'])
        .order('scheduled_date', { ascending: true }),
      adminClient
        .from('payments')
        .select('id, enrollment_id, amount, currency, status, payment_type, paid_at, created_at, refunded_amount, stripe_payment_intent_id')
        .in('enrollment_id', enrollmentIds)
        .order('created_at', { ascending: false }),
    ]);

    if (upErr) console.error('payment_schedules query failed:', upErr);
    if (hErr) console.error('payments query failed:', hErr);

    const now = Date.now();
    const upcoming = (upcomingRaw ?? []).map((p: any) => ({
      ...p,
      product_title: productTitleByEnrollment.get(p.enrollment_id) ?? '',
      is_overdue: p.status === 'pending' && new Date(p.scheduled_date).getTime() < now,
    }));

    const history = (historyRaw ?? []).map((p: any) => ({
      ...p,
      product_title: productTitleByEnrollment.get(p.enrollment_id) ?? '',
    }));

    return NextResponse.json({ upcoming, history });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/payments:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

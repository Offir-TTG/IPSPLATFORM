import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/payments
//   ?up_page=1&up_per_page=20&hist_page=1&hist_per_page=20
//
// Two sections, each paginated independently:
//   upcoming: payment_schedules with non-terminal status (still owed),
//             newest scheduled date first; overdue flag for past-due rows.
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

    const { searchParams } = new URL(request.url);
    const upPage = Math.max(1, parseInt(searchParams.get('up_page') || '1', 10));
    const upPer = Math.min(100, Math.max(1, parseInt(searchParams.get('up_per_page') || '20', 10)));
    const histPage = Math.max(1, parseInt(searchParams.get('hist_page') || '1', 10));
    const histPer = Math.min(100, Math.max(1, parseInt(searchParams.get('hist_per_page') || '20', 10)));

    const adminClient = createAdminClient();

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
      (enrollments ?? []).map((e: any) => [e.id, e.product?.title ?? '']),
    );

    if (enrollmentIds.length === 0) {
      return NextResponse.json({
        upcoming: { rows: [], total: 0, page: upPage, per_page: upPer },
        history: { rows: [], total: 0, page: histPage, per_page: histPer },
      });
    }

    const upFrom = (upPage - 1) * upPer;
    const upTo = upFrom + upPer - 1;
    const histFrom = (histPage - 1) * histPer;
    const histTo = histFrom + histPer - 1;

    const [
      { data: upcomingRaw, count: upcomingTotal },
      { data: historyRaw, count: historyTotal },
    ] = await Promise.all([
      adminClient
        .from('payment_schedules')
        .select(
          'id, enrollment_id, amount, currency, scheduled_date, status, payment_type, payment_number, retry_count, next_retry_date',
          { count: 'exact' },
        )
        .in('enrollment_id', enrollmentIds)
        .in('status', ['pending', 'processing', 'failed', 'paused', 'adjusted'])
        .order('scheduled_date', { ascending: true })
        .range(upFrom, upTo),
      adminClient
        .from('payments')
        .select(
          'id, enrollment_id, amount, currency, status, payment_type, paid_at, created_at, refunded_amount, stripe_payment_intent_id',
          { count: 'exact' },
        )
        .in('enrollment_id', enrollmentIds)
        .order('created_at', { ascending: false })
        .range(histFrom, histTo),
    ]);

    const now = Date.now();
    const upcomingRows = (upcomingRaw ?? []).map((p: any) => ({
      ...p,
      product_title: productTitleByEnrollment.get(p.enrollment_id) ?? '',
      is_overdue: p.status === 'pending' && new Date(p.scheduled_date).getTime() < now,
    }));

    const historyRows = (historyRaw ?? []).map((p: any) => ({
      ...p,
      product_title: productTitleByEnrollment.get(p.enrollment_id) ?? '',
    }));

    return NextResponse.json({
      upcoming: { rows: upcomingRows, total: upcomingTotal ?? 0, page: upPage, per_page: upPer },
      history: { rows: historyRows, total: historyTotal ?? 0, page: histPage, per_page: histPer },
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/payments:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

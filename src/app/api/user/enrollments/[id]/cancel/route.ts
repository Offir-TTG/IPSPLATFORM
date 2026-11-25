import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { cancelEnrollment, CancelEnrollmentError } from '@/lib/payments/enrollmentService';
import { enrollmentsWithMoney, OPEN_STATUSES } from '@/lib/payments/openEnrollment';
import { notifyTeam, ADMIN_ROLES } from '@/lib/messaging/teamAlerts';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/enrollments/[id]/cancel  { reason?: string }
 *
 * A client says "not for me" on an enrollment waiting in "להשלמה". Only the
 * owner's own OPEN enrollment (draft / pending) with nothing paid; an active
 * membership uses stop / pause in Billing. The cancellation goes back to
 * whoever owns the enrollment: the admin who created it, or every admin of
 * the school when the client started it. Who and why are kept in
 * payment_metadata (cancelled_by, cancellation_reason, cancelled_by_client),
 * like an admin's cancel.
 */
export const POST = withAuth(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> | { id: string } }) => {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';

    const db = createAdminClient();
    const { data: enrollment, error } = await db
      .from('enrollments')
      .select('id, tenant_id, user_id, product_id, status, created_by, enrollment_type')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'The enrollment could not be read' }, { status: 500 });
    if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    if (!(OPEN_STATUSES as readonly string[]).includes(enrollment.status)) {
      return NextResponse.json({ error: 'Only an enrollment that is not finished can be cancelled here', code: 'not_open' }, { status: 409 });
    }
    const paid = await enrollmentsWithMoney(db, [enrollment.id]);
    if (paid.has(enrollment.id)) {
      return NextResponse.json({ error: 'Something was already paid in this enrollment, so the school has to cancel it', code: 'paid' }, { status: 409 });
    }

    try {
      await cancelEnrollment(enrollment.id, enrollment.tenant_id, reason, user.id, 0, user.email ?? null, {
        cancelled_by_client: true,
      });
    } catch (e) {
      if (e instanceof CancelEnrollmentError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error('[client cancel] failed:', (e as Error)?.message);
      return NextResponse.json({ error: 'The enrollment could not be cancelled' }, { status: 500 });
    }

    // The owner: the admin who created it (if still an admin), else every admin.
    const [{ data: client }, { data: product }, { data: creator }] = await Promise.all([
      db.from('users').select('first_name, last_name, email').eq('id', user.id).maybeSingle(),
      db.from('products').select('title').eq('id', enrollment.product_id).maybeSingle(),
      enrollment.created_by
        ? db.from('users').select('id, role').eq('id', enrollment.created_by).eq('tenant_id', enrollment.tenant_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const owner = creator && (ADMIN_ROLES as readonly string[]).includes((creator as any).role) ? [(creator as any).id as string] : undefined;
    const who = `${client?.first_name ?? ''} ${client?.last_name ?? ''}`.trim() || client?.email || '';
    const what = product?.title ?? '';
    await notifyTeam({
      tenantId: enrollment.tenant_id,
      kind: 'enrollment_cancelled_by_client',
      onlyAdminIds: owner,
      actionUrl: `/admin/enrollments?enrollment=${enrollment.id}`,
      he: {
        title: `${who || 'לקוח'} ביטל/ה את ההרשמה`,
        body: [
          what ? `ההרשמה: ${what}.` : '',
          reason ? `הסיבה שנכתבה: ${reason}` : 'לא נכתבה סיבה.',
          'לא חויב דבר. אפשר לפתוח הרשמה חדשה ולשלוח קישור, או להשאיר סגור.',
        ]
          .filter(Boolean)
          .join('\n\n'),
        actionLabel: 'להרשמה',
      },
      en: {
        title: `${who || 'A client'} cancelled their enrollment`,
        body: [
          what ? `Enrollment: ${what}.` : '',
          reason ? `Reason given: ${reason}` : 'No reason given.',
          'Nothing was charged. You can open a new enrollment and send a link, or leave it closed.',
        ]
          .filter(Boolean)
          .join('\n\n'),
        actionLabel: 'Open enrollment',
      },
      metadata: { enrollment_id: enrollment.id },
    });

    return NextResponse.json({ success: true });
  },
  ['student', 'instructor', 'admin', 'super_admin']
);

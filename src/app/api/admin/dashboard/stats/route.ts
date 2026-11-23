import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard/stats?from=<ISO>&to=<ISO>
 *
 * Everything the admin home page shows, in one call:
 * - what needs the admin today (disputes, late payments, unfinished
 *   enrollments, coaching requests, new intake forms, emails that failed)
 * - four key numbers, today's lessons and coaching sessions, money by
 *   month, enrollment steps, how full each program is, recent activity,
 *   and whether the connected services look healthy.
 *
 * `from` / `to` are the start and end of "today" in the admin's own time
 * zone (the browser sends them); without them the server's day is used.
 *
 * The admin is checked with their own session; the reads then use the
 * service client, always filtered to the admin's tenant.
 */

const OPEN_SCHEDULE = ['pending', 'processing', 'adjusted', 'paused', 'failed', 'overdue'];
const DAY = 24 * 60 * 60 * 1000;

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
};
const fullName = (u?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null) =>
  u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || '' : '';

export async function GET(request: NextRequest) {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: me } = await auth.from('users').select('role, tenant_id, first_name').eq('id', user.id).single();
    if (!me || !['admin', 'super_admin'].includes(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const tenantId: string = me.tenant_id;
    const db = createAdminClient();

    const now = new Date();
    const sp = request.nextUrl.searchParams;
    const parsedFrom = new Date(sp.get('from') ?? '');
    const parsedTo = new Date(sp.get('to') ?? '');
    const dayStart = Number.isNaN(parsedFrom.getTime())
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : parsedFrom;
    const dayEnd = Number.isNaN(parsedTo.getTime()) ? new Date(dayStart.getTime() + DAY) : parsedTo;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const in30 = new Date(now.getTime() + 30 * DAY);
    const weekAgo = new Date(now.getTime() - 7 * DAY);
    const dayAgo = new Date(now.getTime() - DAY);
    const threeDaysAgo = new Date(now.getTime() - 3 * DAY);

    // ── Currency (platform setting wins over language) ────────────────
    let currency = 'ILS';
    const { data: currencySetting } = await db
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'platform.currency.default')
      .maybeSingle();
    if (currencySetting?.setting_value) {
      const code = String(currencySetting.setting_value).replace(/^"|"$/g, '').trim();
      if (code) currency = code;
    }

    // ── Load everything in parallel ───────────────────────────────────
    const [
      schedulesRes,
      enrollmentsRes,
      productsRes,
      programsRes,
      disputesRes,
      requestsRes,
      intakeRes,
      emailsRes,
      refundsRes,
      lessonsRes,
      coachingRes,
      paymentsRes,
      integrationsRes,
      cronRes,
    ] = await Promise.all([
      db.from('payment_schedules')
        .select('id, enrollment_id, amount, status, scheduled_date, paid_date, updated_at')
        .eq('tenant_id', tenantId),
      db.from('enrollments')
        .select('id, user_id, product_id, status, payment_status, signature_status, signature_waived, payment_waived, wizard_profile_data, invitation_sent_at, enrolled_at, created_at')
        .eq('tenant_id', tenantId),
      db.from('products').select('id, title, requires_signature').eq('tenant_id', tenantId),
      db.from('programs').select('id, name, max_students, product_id, is_active').eq('tenant_id', tenantId),
      db.from('payment_disputes')
        .select('id, amount, evidence_due_date')
        .eq('tenant_id', tenantId)
        .eq('status', 'needs_response'),
      db.from('coaching_requests')
        .select('id, parent_user_id, created_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'new'),
      db.from('intake_responses')
        .select('id, child_id, submitted_at')
        .eq('tenant_id', tenantId)
        .gte('submitted_at', weekAgo.toISOString())
        .order('submitted_at', { ascending: false }),
      db.from('email_queue')
        .select('id, failed_at, bounce_type')
        .eq('tenant_id', tenantId)
        .eq('status', 'failed')
        .gte('failed_at', weekAgo.toISOString()),
      db.from('payments')
        .select('refunded_amount')
        .eq('tenant_id', tenantId)
        .gte('refunded_at', monthStart.toISOString()),
      db.from('lessons')
        .select('id, title, start_time, course_id, zoom_start_url, zoom_join_url')
        .eq('tenant_id', tenantId)
        .gte('start_time', dayStart.toISOString())
        .lt('start_time', dayEnd.toISOString())
        .order('start_time'),
      db.from('coaching_sessions')
        .select('id, starts_at, enrollment_id, child_id, coach_id, zoom_start_url')
        .eq('tenant_id', tenantId)
        .eq('status', 'booked')
        .gte('starts_at', dayStart.toISOString())
        .lt('starts_at', dayEnd.toISOString())
        .order('starts_at'),
      db.from('payments')
        .select('id, amount, paid_at, user_id, enrollment_id, status')
        .eq('tenant_id', tenantId)
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: false })
        .limit(6),
      db.from('integrations').select('integration_key, is_enabled, tenant_id').or(`tenant_id.eq.${tenantId},tenant_id.is.null`),
      db.from('cron_runs').select('id, status').gte('started_at', dayAgo.toISOString()).neq('status', 'success'),
    ]);

    const schedules = schedulesRes.data ?? [];
    const enrollments = enrollmentsRes.data ?? [];
    const products = productsRes.data ?? [];
    const productById = new Map(products.map((p) => [p.id, p]));

    // ── Money ─────────────────────────────────────────────────────────
    const paidBetween = (from: Date, to: Date) =>
      schedules
        .filter((s) => s.status === 'paid' && s.paid_date && new Date(s.paid_date) >= from && new Date(s.paid_date) < to)
        .reduce((sum, s) => sum + num(s.amount), 0);
    const collectedThisMonth = paidBetween(monthStart, nextMonthStart);
    const collectedLastMonth = paidBetween(lastMonthStart, monthStart);

    const open = schedules.filter((s) => OPEN_SCHEDULE.includes(s.status));
    const upcoming = open.filter((s) => {
      const d = new Date(s.scheduled_date);
      return d >= now && d <= in30;
    });
    const isLate = (s: (typeof schedules)[number]) =>
      s.status === 'failed' || s.status === 'overdue' || (s.status === 'pending' && new Date(s.scheduled_date) < now);
    const late = schedules.filter(isLate);

    const months: Array<{ month: string; amount: number; expected?: boolean }> = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({
        month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        amount: paidBetween(start, end),
      });
    }
    months.push({
      month: `${nextMonthStart.getFullYear()}-${String(nextMonthStart.getMonth() + 1).padStart(2, '0')}`,
      amount: open
        .filter((s) => {
          const d = new Date(s.scheduled_date);
          return d >= nextMonthStart && d < nextMonthEnd;
        })
        .reduce((sum, s) => sum + num(s.amount), 0),
      expected: true,
    });

    // ── Enrollments ───────────────────────────────────────────────────
    const active = enrollments.filter((e) => e.status === 'active');
    const activeStudents = new Set(active.map((e) => e.user_id)).size;
    const activeByProduct = new Map<string, number>();
    for (const e of active) if (e.product_id) activeByProduct.set(e.product_id, (activeByProduct.get(e.product_id) ?? 0) + 1);

    const created = (e: (typeof enrollments)[number], from: Date, to: Date) => {
      const d = new Date(e.created_at);
      return d >= from && d < to;
    };
    const newThisMonth = enrollments.filter((e) => e.status !== 'draft' && created(e, monthStart, nextMonthStart)).length;
    const newLastMonth = enrollments.filter((e) => e.status !== 'draft' && created(e, lastMonthStart, monthStart)).length;

    const needsSignature = (e: (typeof enrollments)[number]) =>
      Boolean(productById.get(e.product_id)?.requires_signature) && !e.signature_waived;
    const signed = (e: (typeof enrollments)[number]) =>
      e.status === 'active' || !needsSignature(e) || e.signature_status === 'completed';
    const paid = (e: (typeof enrollments)[number]) =>
      e.status === 'active' || e.payment_waived || ['paid', 'partial'].includes(e.payment_status ?? '');

    const thisMonthFlow = enrollments.filter(
      (e) => e.status !== 'cancelled' && e.status !== 'draft' && created(e, monthStart, nextMonthStart),
    );
    const steps = {
      sent: thisMonthFlow.length,
      details: thisMonthFlow.filter((e) => e.status === 'active' || e.wizard_profile_data).length,
      signed: thisMonthFlow.filter((e) => (e.status === 'active' || e.wizard_profile_data) && signed(e)).length,
      active: thisMonthFlow.filter((e) => e.status === 'active').length,
    };

    // Unfinished: link sent 3+ days ago, still not done.
    const stuckAll = enrollments
      .filter((e) => e.status === 'pending')
      .filter((e) => new Date(e.invitation_sent_at ?? e.created_at) < threeDaysAgo)
      .map((e) => ({
        e,
        reason: !e.wizard_profile_data
          ? ('details' as const)
          : !signed(e)
            ? ('signature' as const)
            : !paid(e)
              ? ('payment' as const)
              : ('details' as const),
        days: Math.floor((now.getTime() - new Date(e.invitation_sent_at ?? e.created_at).getTime()) / DAY),
      }))
      .sort((a, b) => b.days - a.days);

    // ── People we need names for ──────────────────────────────────────
    const requests = requestsRes.data ?? [];
    const paymentsRows = paymentsRes.data ?? [];
    const coaching = coachingRes.data ?? [];
    const lessons = lessonsRes.data ?? [];

    const courseIds = Array.from(new Set(lessons.map((l) => l.course_id).filter(Boolean)));
    const { data: courses } = courseIds.length
      ? await db.from('courses').select('id, title, instructor_id, product_id, program_id').in('id', courseIds)
      : { data: [] as Array<{ id: string; title: string; instructor_id: string | null; product_id: string | null; program_id: string | null }> };
    const courseById = new Map((courses ?? []).map((c) => [c.id, c]));
    const programs = programsRes.data ?? [];
    const programById = new Map(programs.map((p) => [p.id, p]));

    const enrollmentById = new Map(enrollments.map((e) => [e.id, e]));
    const childIds = Array.from(new Set(coaching.map((c) => c.child_id).filter(Boolean))) as string[];
    const { data: children } = childIds.length
      ? await db.from('children').select('id, first_name, last_name').in('id', childIds)
      : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
    const childById = new Map((children ?? []).map((c) => [c.id, c]));

    const userIds = new Set<string>();
    stuckAll.slice(0, 5).forEach(({ e }) => e.user_id && userIds.add(e.user_id));
    requests.forEach((r) => userIds.add(r.parent_user_id));
    paymentsRows.forEach((p) => p.user_id && userIds.add(p.user_id));
    coaching.forEach((c) => {
      userIds.add(c.coach_id);
      const enr = enrollmentById.get(c.enrollment_id);
      if (enr?.user_id) userIds.add(enr.user_id);
    });
    (courses ?? []).forEach((c) => c.instructor_id && userIds.add(c.instructor_id));
    const recentlyEnrolled = enrollments
      .filter((e) => e.enrolled_at && new Date(e.enrolled_at) >= weekAgo)
      .sort((a, b) => +new Date(b.enrolled_at!) - +new Date(a.enrolled_at!))
      .slice(0, 6);
    recentlyEnrolled.forEach((e) => e.user_id && userIds.add(e.user_id));
    const failedRecently = schedules
      .filter((s) => s.status === 'failed' && new Date(s.updated_at) >= weekAgo)
      .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
      .slice(0, 6);
    failedRecently.forEach((s) => {
      const enr = enrollmentById.get(s.enrollment_id);
      if (enr?.user_id) userIds.add(enr.user_id);
    });

    const { data: people } = userIds.size
      ? await db.from('users').select('id, first_name, last_name, email').in('id', Array.from(userIds))
      : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null }> };
    const personById = new Map((people ?? []).map((p) => [p.id, p]));
    const nameOf = (id?: string | null) => fullName(id ? personById.get(id) : null);

    // ── Attention ─────────────────────────────────────────────────────
    const disputes = disputesRes.data ?? [];
    const nextDue = disputes
      .map((d) => d.evidence_due_date)
      .filter(Boolean)
      .sort()[0] ?? null;
    const intake = intakeRes.data ?? [];
    const emails = emailsRes.data ?? [];

    const attention = {
      disputes: { count: disputes.length, amount: disputes.reduce((s, d) => s + num(d.amount), 0), dueDate: nextDue },
      late: { count: late.length, amount: late.reduce((s, x) => s + num(x.amount), 0) },
      unfinished: {
        count: stuckAll.length,
        signature: stuckAll.filter((x) => x.reason === 'signature').length,
        payment: stuckAll.filter((x) => x.reason === 'payment').length,
        details: stuckAll.filter((x) => x.reason === 'details').length,
      },
      coachingRequests: { count: requests.length },
      intake: { count: intake.length, childId: intake[0]?.child_id ?? null },
      emails: { count: emails.length },
    };

    // ── Today ─────────────────────────────────────────────────────────
    const studentsFor = (courseId: string) => {
      const c = courseById.get(courseId);
      if (!c) return 0;
      const ids = new Set<string>();
      if (c.product_id) ids.add(c.product_id);
      const prog = c.program_id ? programById.get(c.program_id) : null;
      if (prog?.product_id) ids.add(prog.product_id);
      return Array.from(ids).reduce((s, id) => s + (activeByProduct.get(id) ?? 0), 0);
    };
    const today = [
      ...lessons.map((l) => {
        const c = courseById.get(l.course_id);
        return {
          kind: 'lesson' as const,
          id: l.id,
          startsAt: l.start_time,
          title: c ? `${c.title} · ${l.title}` : l.title,
          host: c?.instructor_id ? nameOf(c.instructor_id) : '',
          students: studentsFor(l.course_id),
          zoomUrl: l.zoom_start_url || l.zoom_join_url || null,
          href: `/admin/lms/courses/${l.course_id}`,
        };
      }),
      ...coaching.map((s) => {
        const enr = enrollmentById.get(s.enrollment_id);
        const child = s.child_id ? childById.get(s.child_id) : null;
        return {
          kind: 'coaching' as const,
          id: s.id,
          startsAt: s.starts_at,
          title: fullName(child) || nameOf(enr?.user_id),
          host: nameOf(s.coach_id),
          paid: enr ? paid(enr) : false,
          zoomUrl: s.zoom_start_url || null,
          href: s.child_id ? `/admin/coaching/children/${s.child_id}` : '/admin/coaching',
        };
      }),
    ].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

    // ── Programs ──────────────────────────────────────────────────────
    const programRows = programs
      .filter((p) => p.is_active)
      .map((p) => ({
        id: p.id,
        name: p.name,
        max: p.max_students ?? null,
        students: p.product_id ? activeByProduct.get(p.product_id) ?? 0 : 0,
      }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 6);

    // ── Activity ──────────────────────────────────────────────────────
    const activity = [
      ...paymentsRows
        .filter((p) => p.status !== 'failed')
        .map((p) => {
          const enr = p.enrollment_id ? enrollmentById.get(p.enrollment_id) : null;
          return {
            kind: 'paid' as const,
            at: p.paid_at as string,
            who: nameOf(p.user_id ?? enr?.user_id),
            amount: num(p.amount),
            what: enr ? productById.get(enr.product_id)?.title ?? '' : '',
          };
        }),
      ...recentlyEnrolled.map((e) => ({
        kind: 'enrolled' as const,
        at: e.enrolled_at as string,
        who: nameOf(e.user_id),
        amount: 0,
        what: productById.get(e.product_id)?.title ?? '',
      })),
      ...requests.map((r) => ({
        kind: 'request' as const,
        at: r.created_at,
        who: nameOf(r.parent_user_id),
        amount: 0,
        what: '',
      })),
      ...failedRecently.map((s) => {
        const enr = enrollmentById.get(s.enrollment_id);
        return {
          kind: 'failed' as const,
          at: s.updated_at,
          who: nameOf(enr?.user_id),
          amount: num(s.amount),
          what: enr ? productById.get(enr.product_id)?.title ?? '' : '',
        };
      }),
    ]
      .filter((a) => a.at)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 6);

    // ── Health ────────────────────────────────────────────────────────
    const integrations = integrationsRes.data ?? [];
    const enabled = (...keys: string[]) =>
      integrations.some((i) => keys.includes(i.integration_key) && i.is_enabled);
    const sendingProblems = emails.filter((e) => !e.bounce_type && e.failed_at && new Date(e.failed_at) >= dayAgo).length;
    const health = {
      stripe: enabled('stripe') ? 'ok' : 'off',
      email: !enabled('resend') ? 'off' : sendingProblems > 0 ? 'problem' : 'ok',
      docusign: enabled('docusign') ? 'ok' : 'off',
      video: enabled('zoom', 'daily') ? 'ok' : 'off',
      jobsFailed: (cronRes.data ?? []).length,
    };

    return NextResponse.json({
      firstName: me.first_name ?? '',
      currency: { code: currency },
      attention,
      kpis: {
        collectedThisMonth,
        collectedLastMonth,
        expected30: upcoming.reduce((s, x) => s + num(x.amount), 0),
        expected30Count: upcoming.length,
        activeStudents,
        activePrograms: programs.filter((p) => p.is_active).length,
        newThisMonth,
        newLastMonth,
      },
      today,
      money: {
        months,
        refundedThisMonth: (refundsRes.data ?? []).reduce((s, p) => s + num(p.refunded_amount), 0),
        stillOwed: open.reduce((s, x) => s + num(x.amount), 0),
      },
      enrollments: {
        steps,
        stuck: stuckAll.slice(0, 5).map(({ e, reason, days }) => ({
          id: e.id,
          name: nameOf(e.user_id),
          product: productById.get(e.product_id)?.title ?? '',
          reason,
          days,
        })),
      },
      programs: programRows,
      activity,
      health,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

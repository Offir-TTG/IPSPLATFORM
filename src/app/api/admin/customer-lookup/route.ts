import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Customer-lookup endpoint for the IParentingSchool CRM.
 *
 * Contract:
 *   GET /api/admin/customer-lookup?email=<email>
 *   Authorization: Bearer <CRM_LOOKUP_SECRET>
 *
 * Returns:
 *   {
 *     is_customer:       boolean,
 *     total_paid:        number,
 *     currency:          string | null,
 *     last_purchase_at:  ISO string | null,
 *     purchases: [
 *       { product_name, product_type, amount, currency, paid_at }
 *     ]
 *   }
 *
 * Auth: shared-secret bearer token in the env var CRM_LOOKUP_SECRET
 * (same value set on the IParentingSchool side). Service-role Supabase
 * access is used internally because the caller has no Supabase session.
 *
 * Scope: a person counts as a customer when they have any enrollment
 * with payment_status in ('paid', 'completed') and paid_amount > 0.
 * The endpoint is intentionally narrow — only purchase data for the
 * given email — so it doesn't grow into a general user-lookup API.
 */

// IPSPlatform's `products` table was rebuilt by the 20251124
// "restructure products pure content" migration. Current columns are
// `title` and `type` (NOT `name`/`product_name` or `product_type`).
// Two earlier guesses both 42703'd in production — see the file
// header for the canonical schema.
type EnrollmentRow = {
  id: string;
  product_id: string;
  total_amount: number | null;
  paid_amount: number | null;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
  products:
    | {
        id: string;
        title: string | null;
        type: string | null;
      }
    | Array<{
        id: string;
        title: string | null;
        type: string | null;
      }>
    | null;
};

export async function GET(request: NextRequest) {
  const secret = process.env.CRM_LOOKUP_SECRET;
  if (!secret) {
    // Refuse to leak data if the operator forgot to set the secret in
    // env — fail closed.
    return NextResponse.json(
      { error: 'CRM_LOOKUP_SECRET is not configured' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawEmail = request.nextUrl.searchParams.get('email');
  if (!rawEmail || !rawEmail.includes('@')) {
    return NextResponse.json(
      { error: 'email query parameter is required' },
      { status: 400 },
    );
  }
  const email = rawEmail.trim().toLowerCase();

  const supabase = createAdminClient();

  // Find every user row whose email matches. Most tenants will have at
  // most one match, but we don't assume uniqueness across tenants.
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .ilike('email', email);
  const origin = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
  const keap = await keapSummary(supabase, email, origin);

  if (usersError) {
    console.error('[customer-lookup] users query failed:', usersError);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
  if (!users || users.length === 0) {
    return NextResponse.json({
      is_customer: false,
      total_paid: 0,
      currency: null,
      last_purchase_at: null,
      purchases: [],
      keap,
    });
  }

  const userIds = users.map((u) => u.id);

  // Pull every enrollment for the matched users — no payment_status
  // filter. The CRM card needs to distinguish "registered but not
  // paid" from "no relationship at all", so we don't silently drop
  // pending/partial/overdue rows here. (The earlier filter also had
  // a real bug: `'completed'` is an `enrollments.status` value, not
  // an `enrollments.payment_status` value, and was therefore never
  // matching anything regardless.)
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select(
      `
        id,
        product_id,
        total_amount,
        paid_amount,
        currency,
        status,
        payment_status,
        enrolled_at,
        created_at,
        updated_at,
        next_payment_date,
        payment_plan_id,
        products:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          session_count,
          crm_tag_slugs,
          course:courses!products_course_id_fkey (course_type)
        )
      `,
    )
    .in('user_id', userIds);

  if (enrollmentsError) {
    console.error(
      '[customer-lookup] enrollments query failed:',
      enrollmentsError,
    );
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  const rows = (enrollments ?? []) as EnrollmentRow[];

  // The richer card on the CRM contact: each enrollment's payments, its
  // plan in plain words, the next charge, what is still owed and the
  // CRM tags it brought. Read in bulk, never one query per row.
  const ids = rows.map((r) => r.id);
  const [{ data: schedules }, { data: tagRows }, { data: planRows }] = await Promise.all([
    ids.length
      ? supabase.from('payment_schedules').select('enrollment_id, payment_number, payment_type, amount, currency, scheduled_date, status, paid_date').in('enrollment_id', ids).order('scheduled_date')
      : Promise.resolve({ data: [] as any[] }),
    ids.length ? supabase.from('enrollments').select('id, crm_tag_slugs').in('id', ids).then((r) => (r.error ? { data: [] as any[] } : r)) : Promise.resolve({ data: [] as any[] }),
    supabase.from('payment_plans').select('id, plan_type, subscription_frequency').in('id', rows.map((r: any) => r.payment_plan_id).filter(Boolean)),
  ]);
  const schedulesOf = new Map<string, any[]>();
  for (const s of schedules ?? []) schedulesOf.set(s.enrollment_id, [...(schedulesOf.get(s.enrollment_id) ?? []), s]);
  const tagsOf = new Map<string, string[]>((tagRows ?? []).map((r: any) => [r.id, r.crm_tag_slugs ?? []]));
  const planOf = new Map<string, any>((planRows ?? []).map((p: any) => [p.id, p]));

  // Build per-enrollment records + roll-ups. "Customer" still means
  // "paid something" (paid_amount > 0); "Registered" means "any
  // enrollment row exists, even if unpaid". The card uses both flags
  // to pick the right copy.
  let totalPaid = 0;
  let currency: string | null = null;
  let lastPurchaseAt: string | null = null;
  const purchases = rows
    .map((r) => {
      const product = Array.isArray(r.products) ? r.products[0] : r.products;
      const paid = Number(r.paid_amount ?? 0);
      const total = Number(r.total_amount ?? 0);
      totalPaid += paid;
      if (!currency && r.currency) currency = r.currency;
      // Use updated_at as the "paid at" signal only if there's any
      // payment; for unpaid rows fall back to enrollment date so the
      // sort still has something meaningful to order by.
      const paidAt = paid > 0 ? r.updated_at || r.created_at : null;
      if (paidAt && (!lastPurchaseAt || paidAt > lastPurchaseAt)) {
        lastPurchaseAt = paidAt;
      }
      return {
        // Response field names stay `product_name` / `product_type`
        // — that's the public contract consumed by the CRM detail
        // page's Customer status card.
        product_name: product?.title ?? '(unnamed product)',
        product_type: product?.type ?? null,
        amount: paid,
        total_amount: total,
        currency: r.currency ?? currency ?? '',
        // pending / partial / paid / overdue
        payment_status: r.payment_status ?? 'pending',
        // draft / pending / active / suspended / cancelled / completed
        status: r.status ?? 'pending',
        // When admin wants to ask "when did they sign up?" rather than
        // "when did they pay?" — distinct from paid_at.
        enrolled_at: r.enrolled_at ?? r.created_at,
        paid_at: paidAt,
        ...details(r, product, schedulesOf.get(r.id) ?? [], tagsOf.get(r.id), planOf.get((r as any).payment_plan_id), origin),
      };
    })
    // Most-recent first. Paid rows sort by paid_at, unpaid by
    // enrolled_at — both fall through the same comparator since paid_at
    // is null for unpaid rows.
    .sort((a, b) => {
      const aKey = a.paid_at ?? a.enrolled_at;
      const bKey = b.paid_at ?? b.enrolled_at;
      return aKey < bKey ? 1 : -1;
    });

  return NextResponse.json({
    // "Customer" is reserved for paid commitment — at least one
    // payment hit the books, regardless of whether the plan is
    // complete. Use `is_registered` to detect "they signed up but
    // haven't paid yet" rows.
    is_customer: totalPaid > 0,
    is_registered: purchases.length > 0,
    total_paid: totalPaid,
    currency,
    last_purchase_at: lastPurchaseAt,
    purchases,
    customer_since: rows.map((r) => r.enrolled_at ?? r.created_at).filter(Boolean).sort()[0] ?? null,
    portal_url: users.length === 1 ? `${origin}/admin/users/${users[0].id}` : null,
    keap,
  });
}

/**
 * One enrollment's detail for the CRM card: its payments, its plan (kind,
 * how often, how many, how many paid), the next charge and what is owed.
 */
function details(r: any, product: any, list: any[], ownTags: string[] | undefined, plan: any, origin: string) {
  const live = list.filter((s) => s.status !== 'cancelled');
  const paidRows = live.filter((s) => s.status === 'paid');
  const owedRows = live.filter((s) => ['pending', 'adjusted', 'failed', 'processing'].includes(s.status));
  const types = new Set(live.map((s) => s.payment_type));
  const kind = types.has('subscription')
    ? 'subscription'
    : types.has('session') || product?.type === 'session_pack'
      ? 'per_session'
      : types.has('deposit')
        ? 'deposit'
        : types.has('installment')
          ? 'installments'
          : Number(r.total_amount ?? 0) <= 0
            ? 'free'
            : 'one_time';
  const installments = live.filter((s) => s.payment_type === 'installment');
  const nextOwed = owedRows[0];
  const lastSub = [...paidRows].reverse().find((s) => s.payment_type === 'subscription');
  const membershipNext = kind === 'subscription' && !nextOwed && r.next_payment_date && r.status !== 'cancelled' ? { date: r.next_payment_date, amount: Number(lastSub?.amount ?? 0) } : null;
  const fromProduct = Array.isArray(product?.crm_tag_slugs) ? product.crm_tag_slugs : [];
  // The service's type, by the same rule the client portal uses to show it
  // (src/app/(user)/dashboard/homeData.ts): a membership is a club, a
  // lecture course or lecture product is a lecture, then the product type.
  const course = Array.isArray(product?.course) ? product.course[0] : product?.course;
  const serviceType =
    kind === 'subscription'
      ? 'club'
      : course?.course_type === 'lecture' || product?.type === 'lecture'
        ? 'lecture'
        : product?.type === 'program'
          ? 'program'
          : product?.type === 'bundle'
            ? 'bundle'
            : product?.type === 'session_pack'
              ? 'personal_guidance'
              : 'course';
  return {
    enrollment_id: r.id,
    service_type: serviceType,
    url: `${origin}/admin/enrollments?enrollment=${r.id}`,
    plan: {
      kind,
      frequency: plan?.subscription_frequency ?? (kind === 'subscription' ? 'monthly' : null),
      installments: installments.length || null,
      installments_paid: installments.filter((s) => s.status === 'paid').length,
      sessions: kind === 'per_session' ? Number(product?.session_count) || null : null,
      sessions_paid: kind === 'per_session' ? paidRows.length : null,
      per_amount: kind === 'subscription' ? Number(lastSub?.amount ?? live[0]?.amount ?? 0) : null,
    },
    payments: live.map((s) => ({
      number: s.payment_number,
      type: s.payment_type,
      amount: Number(s.amount ?? 0),
      currency: s.currency ?? r.currency ?? null,
      date: s.paid_date ?? s.scheduled_date,
      status: s.status === 'paid' ? 'paid' : s.status === 'failed' ? 'failed' : s.status === 'refunded' ? 'refunded' : 'scheduled',
    })),
    next_charge: nextOwed ? { date: nextOwed.scheduled_date, amount: Number(nextOwed.amount ?? 0) } : membershipNext,
    still_owed: kind === 'subscription' || kind === 'per_session' ? 0 : Math.max(0, Number(r.total_amount ?? 0) - Number(r.paid_amount ?? 0)),
    tags: ownTags && ownTags.length ? ownTags : fromProduct,
  };
}

/** The person's old Keap orders (Payments → Keap history), as one line. */
async function keapSummary(supabase: ReturnType<typeof createAdminClient>, email: string, origin: string) {
  const { data, error } = await supabase.from('keap_orders').select('total_paid, refund_total, order_date, currency').ilike('email', email);
  if (error || !data?.length) return null;
  const years = data.map((o: any) => (o.order_date ? new Date(o.order_date).getFullYear() : null)).filter(Boolean) as number[];
  return {
    orders: data.length,
    total_paid: Math.round(data.reduce((sum: number, o: any) => sum + Number(o.total_paid ?? 0) - Number(o.refund_total ?? 0), 0) * 100) / 100,
    currency: data[0].currency ?? 'USD',
    first_year: years.length ? Math.min(...years) : null,
    last_year: years.length ? Math.max(...years) : null,
    url: `${origin}/admin/payments/keap-history?q=${encodeURIComponent(email)}`,
  };
}

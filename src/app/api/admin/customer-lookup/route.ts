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
        products:products!enrollments_product_id_fkey (
          id,
          title,
          type
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
  });
}

/**
 * Coaching packages (parent coaching and child coaching), built on product
 * enrollments: a package is an enrollment in a session-pack product. Parent
 * coaching has no child on the enrollment; child coaching has one (or the
 * child's details waiting until a new parent's account exists).
 *
 * Pay as you go: nothing is charged at enrollment (the card is saved); each
 * session the team marks as held is charged at once. Sessions are scheduled
 * outside the system, so "held" records the session and charges it.
 *
 * The team can offer more sessions on a package (coaching_offers). The client
 * approves in the portal; nothing is charged on approval and no new contract
 * is signed. A gift is added at once. Every function is scoped to the
 * admin's tenant; the routes check the caller is a tenant admin first.
 */
import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { chargeHeldSession, priceOfHeldSession } from '@/lib/payments/perSession';
import { getStripeClient } from '@/lib/payments/getStripeClient';
import { deliverMessage } from '@/lib/messaging/deliver';
import { chaserForEvent } from '@/lib/messaging/store';
import { fireEvent } from '@/lib/messaging/engine';

type Fail = { ok: false; status: number; error: string };
const fail = (status: number, error: string): Fail => ({ ok: false, status, error });
const nameOf = (u: any) => (u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || '' : '');
const ageOf = (birthYear: number | null | undefined) => (birthYear ? new Date().getFullYear() - birthYear : null);
const COUNTED = ['done', 'late_cancelled', 'no_show'];
const FAILED = ['failed', 'overdue'];
const one = <T,>(x: T | T[] | null | undefined): T | null => (Array.isArray(x) ? x[0] ?? null : x ?? null);

export type PackageKind = 'parent' | 'child';
export type PackageStatus = 'active' | 'wait_sign' | 'wait_card' | 'wait_intake' | 'ended' | 'cancelled';
export type PaymentState = 'charged' | 'failed' | 'card_saved' | 'no_card' | 'free';

/** The product's coaching kind as set on the product (metadata), if any. */
export function productKind(product: any): PackageKind | null {
  const k = product?.metadata?.coaching_kind;
  return k === 'parent' || k === 'child' ? k : null;
}

/** The price of one session: the per-session plan's, the product's own, or the total split. */
function basePrice(product: any, plan: any): number {
  if (plan?.plan_type === 'per_session' && Number(plan.session_amount) > 0) return Number(plan.session_amount);
  if (Number(product?.payment_plan?.session_amount) > 0) return Number(product.payment_plan.session_amount);
  const count = Number(product?.session_count) || 0;
  return count > 0 ? Math.round((Number(product?.price ?? 0) / count) * 100) / 100 : Number(product?.price ?? 0);
}

/** Everything the list and the drawer need, for some or all of a tenant's packages. */
async function loadPackages(tenantId: string, onlyId?: string) {
  const db = createAdminClient();
  const { data: products } = await db.from('products').select('*').eq('tenant_id', tenantId).eq('type', 'session_pack');
  const productIds = (products ?? []).map((p: any) => p.id);
  if (!productIds.length) return { db, rows: [] as any[] };

  let q = db
    .from('enrollments')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('product_id', productIds)
    .in('status', ['draft', 'pending', 'active', 'suspended', 'completed', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(500);
  if (onlyId) q = q.eq('id', onlyId);
  const { data: enrollments, error } = await q;
  if (error) throw new Error(error.message);
  const list = enrollments ?? [];
  if (!list.length) return { db, rows: [] as any[] };

  const ids = list.map((e: any) => e.id);
  const pick = (k: string) => [...new Set(list.map((e: any) => e[k]).filter(Boolean))] as string[];
  const planIds = pick('payment_plan_id');
  const [users, children, plans, sessions, offers, schedules, intakes, forms] = await Promise.all([
    db.from('users').select('id, first_name, last_name, email, phone').in('id', [...pick('user_id'), ...pick('coach_id')]),
    pick('child_id').length ? db.from('children').select('id, first_name, last_name, birth_year').in('id', pick('child_id')) : Promise.resolve({ data: [] as any[] }),
    planIds.length ? db.from('payment_plans').select('*').in('id', planIds) : Promise.resolve({ data: [] as any[] }),
    db.from('coaching_sessions').select('id, enrollment_id, coach_id, starts_at, status').in('enrollment_id', ids).order('starts_at', { ascending: true }),
    db.from('coaching_offers').select('*').in('enrollment_id', ids).order('created_at', { ascending: true }),
    db.from('payment_schedules').select('id, enrollment_id, coaching_session_id, status, amount, currency, paid_date, last_error').in('enrollment_id', ids).eq('payment_type', 'session'),
    db.from('intake_responses').select('enrollment_id, submitted_at').in('enrollment_id', ids),
    db.from('intake_forms').select('product_id').eq('tenant_id', tenantId).eq('is_active', true),
  ]);
  const by = (rows: any[] | null | undefined) => new Map((rows ?? []).map((r: any) => [r.id, r]));
  const productById = by(products), userById = by(users.data), childById = by(children.data), planById = by(plans.data);
  const group = (rows: any[] | null | undefined, key = 'enrollment_id') => {
    const m = new Map<string, any[]>();
    for (const r of rows ?? []) m.set(r[key], [...(m.get(r[key]) ?? []), r]);
    return m;
  };
  const sessionsBy = group(sessions.data), offersBy = group(offers.error ? [] : offers.data), schedulesBy = group(schedules.data);
  const intakeBy = new Map((intakes.data ?? []).map((r: any) => [r.enrollment_id, r]));
  const formProducts = new Set((forms.data ?? []).map((f: any) => f.product_id ?? '*'));

  const rows = list.map((e: any) => {
    const product = productById.get(e.product_id);
    const plan = e.payment_plan_id ? planById.get(e.payment_plan_id) : null;
    const parent = e.user_id ? userById.get(e.user_id) : null;
    const child = e.child_id ? childById.get(e.child_id) : null;
    const pendingChild = e.payment_metadata?.pending_child ?? null;
    const kind: PackageKind = e.child_id || pendingChild ? 'child' : 'parent';
    const own = sessionsBy.get(e.id) ?? [];
    const offersOwn = offersBy.get(e.id) ?? [];
    const charges = schedulesBy.get(e.id) ?? [];
    const approvedExtra = offersOwn.filter((o: any) => o.status === 'approved').reduce((n: number, o: any) => n + (Number(o.sessions) || 0), 0);
    const total = (Number(product?.session_count) || 0) + approvedExtra;
    const used = own.filter((s: any) => COUNTED.includes(s.status)).length;
    const price = basePrice(product, plan);
    const free = !!e.payment_waived;
    const hasCard = !!e.stripe_setup_intent_id;
    const needsSign = !!product?.requires_signature && !e.signature_waived;
    const signed = e.signature_status === 'completed';
    const chosenForm = e.payment_metadata?.intake_form_id;
    const hasIntakeForm = chosenForm === 'none' ? false : chosenForm ? true : formProducts.has(e.product_id) || formProducts.has('*');
    const intake = intakeBy.get(e.id) ?? null;

    let status: PackageStatus;
    if (e.status === 'cancelled') status = 'cancelled';
    else if (e.status === 'completed') status = 'ended';
    else if (e.status === 'draft' || e.status === 'pending') status = needsSign && !signed ? 'wait_sign' : 'wait_card';
    else status = hasIntakeForm && !intake ? 'wait_intake' : 'active';

    const paid = charges.filter((c: any) => c.status === 'paid');
    const failedCharge = charges.some((c: any) => FAILED.includes(c.status));
    const payment: PaymentState = free ? 'free' : failedCharge ? 'failed' : paid.length ? 'charged' : hasCard && e.status === 'active' ? 'card_saved' : e.status === 'active' ? 'card_saved' : 'no_card';

    return {
      e,
      product,
      plan,
      parent,
      child,
      pendingChild,
      kind,
      own,
      offers: offersOwn,
      charges,
      intake,
      hasIntakeForm,
      needsSign,
      signed,
      summary: {
        enrollment_id: e.id as string,
        kind,
        status,
        child_name: child ? `${child.first_name}${child.last_name ? ' ' + child.last_name : ''}` : pendingChild?.first_name ?? null,
        child_age: ageOf(child?.birth_year ?? pendingChild?.birth_year),
        parent_name: parent ? nameOf(parent) : `${e.wizard_profile_data?.first_name ?? ''} ${e.wizard_profile_data?.last_name ?? ''}`.trim(),
        parent_email: parent?.email ?? e.wizard_profile_data?.email ?? null,
        product_title: product?.title ?? '',
        price_per_session: price,
        currency: String(e.currency || product?.currency || 'USD'),
        coach_name: e.coach_id ? nameOf(userById.get(e.coach_id)) : null,
        coach_id: e.coach_id ?? null,
        sessions_used: used,
        sessions_total: total,
        payment,
        sessions_charged: paid.length,
        charged_total: Math.round(paid.reduce((n: number, c: any) => n + Number(c.amount || 0), 0) * 100) / 100,
        // The package total (sessions × price, raised when added sessions are approved).
        package_total: Number(e.total_amount ?? 0),
        pending_offer: offersOwn.find((o: any) => o.status === 'pending') ? true : false,
        created_at: e.created_at as string,
      },
    };
  });
  return { db, rows, userById };
}

// ─── List ──────────────────────────────────────────────────────────────

export async function listPackages(tenantId: string) {
  try {
    const { rows } = await loadPackages(tenantId);
    const packages = rows.map((r) => r.summary);
    const waiting = (s: PackageStatus) => s === 'wait_sign' || s === 'wait_card' || s === 'wait_intake';
    return {
      ok: true as const,
      packages,
      stats: {
        active: packages.filter((p) => p.status === 'active').length,
        waiting: packages.filter((p) => waiting(p.status)).length,
        almost_done: packages.filter((p) => p.status === 'active' && p.sessions_total > 0 && p.sessions_total - p.sessions_used <= 1).length,
        failed: packages.filter((p) => p.payment === 'failed' && p.status !== 'cancelled').length,
      },
    };
  } catch (e) {
    return fail(500, e instanceof Error ? e.message : String(e));
  }
}

// ─── Drawer ────────────────────────────────────────────────────────────

/** The saved card (brand, last 4, date) from the enrollment's Stripe setup. */
async function savedCard(tenantId: string, setupIntentId: string | null) {
  if (!setupIntentId) return null;
  try {
    const { stripe } = await getStripeClient(tenantId);
    const si: any = await stripe.setupIntents.retrieve(setupIntentId, { expand: ['payment_method'] });
    if (si.status !== 'succeeded') return null;
    const card = si.payment_method?.card;
    return { brand: card?.brand ? String(card.brand) : null, last4: card?.last4 ?? null, saved_at: new Date(si.created * 1000).toISOString() };
  } catch {
    return null;
  }
}

export async function getPackage(tenantId: string, enrollmentId: string) {
  try {
    const { rows, userById } = await loadPackages(tenantId, enrollmentId);
    const r = rows[0];
    if (!r) return fail(404, 'Package not found');
    const card = r.e.payment_waived ? null : await savedCard(tenantId, r.e.stripe_setup_intent_id);
    const chargeBySession = new Map(r.charges.map((c: any) => [c.coaching_session_id, c]));
    const held = r.own.filter((s: any) => COUNTED.includes(s.status));
    const pending = r.offers.find((o: any) => o.status === 'pending') ?? null;
    return {
      ok: true as const,
      ...r.summary,
      parent_id: r.e.user_id ?? null,
      child_id: r.e.child_id ?? null,
      enrollment_token: r.e.enrollment_token ?? null,
      sent_at: r.e.invitation_sent_at ?? null,
      needs_signature: r.needsSign,
      signed: r.signed,
      has_contract: !!r.e.docusign_envelope_id && r.signed,
      card,
      has_intake_form: r.hasIntakeForm,
      intake_submitted_at: r.intake?.submitted_at ?? null,
      free: !!r.e.payment_waived,
      sessions: held
        .map((s: any, i: number) => {
          const c: any = chargeBySession.get(s.id);
          return {
            id: s.id,
            number: i + 1,
            held_at: s.starts_at,
            status: s.status,
            coach_name: s.coach_id ? nameOf(userById?.get(s.coach_id)) : null,
            charge: c ? { status: c.status, amount: Number(c.amount), error: c.last_error ?? null } : null,
          };
        })
        .reverse(),
      pending_offer: pending
        ? { id: pending.id, sessions: pending.sessions, session_amount: Number(pending.session_amount), message: pending.message, created_at: pending.created_at }
        : null,
      offers: r.offers.map((o: any) => ({ id: o.id, sessions: o.sessions, session_amount: Number(o.session_amount), is_gift: o.is_gift, status: o.status, created_at: o.created_at, decided_at: o.decided_at })),
    };
  } catch (e) {
    return fail(500, e instanceof Error ? e.message : String(e));
  }
}

// ─── Sessions held ─────────────────────────────────────────────────────

/** What the next held session costs (shown on the button before charging). */
export async function nextSessionPrice(tenantId: string, enrollmentId: string) {
  const { rows } = await loadPackages(tenantId, enrollmentId);
  const r = rows[0];
  if (!r) return null;
  const n = r.own.filter((s: any) => s.status === 'done').length + 1;
  const base = { amount: r.summary.price_per_session, sessionCount: Number(r.product?.session_count) || 0 };
  return r.e.payment_waived ? 0 : priceOfHeldSession(enrollmentId, n, base);
}

/**
 * The team marks that a session took place: it is recorded (dated now, with
 * the package's coach) and charged to the saved card straight away.
 */
export async function recordHeldSession(tenantId: string, adminId: string, enrollmentId: string) {
  const db = createAdminClient();
  const { data: e } = await db.from('enrollments').select('id, status, child_id, coach_id, product_id').eq('id', enrollmentId).eq('tenant_id', tenantId).maybeSingle();
  if (!e) return fail(404, 'Package not found');
  if (e.status !== 'active') return fail(409, 'The client has not finished the enrollment yet');
  if (!e.coach_id) return fail(409, 'Choose a coach for this package first');
  const { data: product } = await db.from('products').select('session_duration_minutes').eq('id', e.product_id).maybeSingle();
  const start = new Date();
  const end = new Date(start.getTime() + (Number(product?.session_duration_minutes) || 50) * 60_000);
  const { data: s, error } = await db
    .from('coaching_sessions')
    .insert({
      tenant_id: tenantId,
      enrollment_id: e.id,
      child_id: e.child_id ?? null,
      coach_id: e.coach_id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: 'done',
      booked_by: adminId,
    })
    .select('id')
    .single();
  if (error || !s) return fail(500, error?.message ?? 'The session was not saved');
  const charge = await chargeHeldSession(tenantId, s.id);
  return { ok: true as const, session_id: s.id, charge };
}

/** Charges a held session again after a failed charge. */
export async function retrySessionCharge(tenantId: string, sessionId: string) {
  const charge = await chargeHeldSession(tenantId, sessionId);
  return charge.ok ? { ok: true as const, charge } : fail(402, charge.error);
}

// ─── Offers: adding sessions ───────────────────────────────────────────

export async function createOffer(
  tenantId: string,
  adminId: string,
  enrollmentId: string,
  input: { sessions?: unknown; session_amount?: unknown; is_gift?: unknown; message?: unknown; request_id?: unknown },
) {
  const sessions = Number(input.sessions);
  if (!Number.isInteger(sessions) || sessions < 1 || sessions > 100) return fail(400, 'Choose how many sessions to add (1 to 100)');
  const gift = input.is_gift === true;
  const amount = gift ? 0 : Math.round(Number(input.session_amount) * 100) / 100;
  if (!gift && !(amount > 0)) return fail(400, 'Write the price per session');
  const message = typeof input.message === 'string' ? input.message.trim().slice(0, 1000) || null : null;
  const db = createAdminClient();
  const { data: e } = await db.from('enrollments').select('id, status').eq('id', enrollmentId).eq('tenant_id', tenantId).maybeSingle();
  if (!e) return fail(404, 'Package not found');
  if (!['active', 'suspended', 'completed'].includes(e.status)) return fail(409, 'Sessions can be added once the client has finished the enrollment');
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('coaching_offers')
    .insert({
      tenant_id: tenantId,
      enrollment_id: e.id,
      sessions,
      session_amount: amount,
      is_gift: gift,
      message,
      request_id: typeof input.request_id === 'string' ? input.request_id : null,
      // A gift needs no approval.
      status: gift ? 'approved' : 'pending',
      decided_at: gift ? now : null,
      decided_by: gift ? adminId : null,
      created_by: adminId,
    })
    .select('id, status')
    .single();
  if (error) return error.code === '23505' ? fail(409, 'There is already an offer waiting for the client. Cancel it first.') : fail(500, error.message);
  // A package that had ended comes back to life with the gift.
  if (gift && e.status === 'completed') await db.from('enrollments').update({ status: 'active' }).eq('id', e.id);
  if (typeof input.request_id === 'string') {
    await db.from('coaching_requests').update({ status: 'handled', handled_by: adminId, handled_at: now }).eq('id', input.request_id).eq('tenant_id', tenantId);
  }
  if (!gift) await notifyOffer(tenantId, adminId, e.id, sessions);
  return { ok: true as const, offer_id: data.id, status: data.status };
}

/** Tells the client in the portal (Hebrew only) that sessions wait for approval. */
async function notifyOffer(tenantId: string, adminId: string, enrollmentId: string, sessions: number) {
  try {
    const db = createAdminClient();
    const { data: e } = await db.from('enrollments').select('user_id, child_id').eq('id', enrollmentId).maybeSingle();
    if (!e?.user_id) return;
    const { data: child } = e.child_id ? await db.from('children').select('first_name').eq('id', e.child_id).maybeSingle() : { data: null };
    // The automatic reminder "More sessions offered" decides (words, email, on/off).
    const reminder = await chaserForEvent(db, tenantId, 'coaching.offer');
    if (reminder !== 'missing') {
      if (reminder?.status === 'active') {
        await fireEvent(tenantId, 'coaching.offer', [{
          subjectType: 'enrollment',
          subjectId: enrollmentId,
          userId: e.user_id,
          context: { child: child?.first_name ?? '', childId: e.child_id ?? undefined, enrollmentId, sessions },
        }]);
      }
      return;
    }
    await deliverMessage({
      tenantId,
      userId: e.user_id,
      source: 'coaching',
      category: 'lesson',
      email: false,
      priority: 'high',
      title: child?.first_name ? `הוצעו ${sessions} מפגשים נוספים עבור ${child.first_name}` : `הוצעו לך ${sessions} מפגשים נוספים`,
      body: 'לא נגבה כלום באישור. כל מפגש נגבה רק כשהוא מתקיים, ואין צורך לחתום שוב.',
      actionUrl: e.child_id ? `/children/${e.child_id}` : `/coaching/${enrollmentId}?tab=package`,
      actionLabel: 'לאישור',
      metadata: { kind: 'coaching_offer', enrollment_id: enrollmentId },
      createdBy: adminId,
    }, db);
  } catch (error) {
    console.error('[coaching] offer notification failed', error);
  }
}

export async function cancelOffer(tenantId: string, adminId: string, offerId: string) {
  const { data, error } = await createAdminClient()
    .from('coaching_offers')
    .update({ status: 'cancelled', decided_at: new Date().toISOString(), decided_by: adminId })
    .eq('id', offerId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();
  if (error) return fail(500, error.message);
  return data ? { ok: true as const } : fail(409, 'This offer is no longer waiting');
}

/** The client approves or declines an offer on their own package (portal). */
export async function decideOffer(userId: string, offerId: string, approve: boolean) {
  const db = createAdminClient();
  const { data: offer } = await db.from('coaching_offers').select('id, enrollment_id, status, sessions, session_amount, is_gift').eq('id', offerId).maybeSingle();
  if (!offer) return fail(404, 'Offer not found');
  const { data: e } = await db.from('enrollments').select('id, user_id, status, total_amount').eq('id', offer.enrollment_id).maybeSingle();
  if (!e || e.user_id !== userId) return fail(404, 'Offer not found');
  if (offer.status !== 'pending') return fail(409, 'This offer is no longer waiting');
  const { error } = await db
    .from('coaching_offers')
    .update({ status: approve ? 'approved' : 'declined', decided_at: new Date().toISOString(), decided_by: userId })
    .eq('id', offer.id)
    .eq('status', 'pending');
  if (error) return fail(500, error.message);
  if (approve) {
    // The package total grows by the added sessions at the offer's price; a
    // package that had ended is active again.
    const added = offer.is_gift ? 0 : Math.round(Number(offer.sessions) * Number(offer.session_amount) * 100) / 100;
    await db
      .from('enrollments')
      .update({
        total_amount: Math.round((Number(e.total_amount ?? 0) + added) * 100) / 100,
        ...(e.status === 'completed' ? { status: 'active' } : {}),
      })
      .eq('id', e.id);
  }
  return { ok: true as const };
}

// ─── Package actions ───────────────────────────────────────────────────

export async function cancelPackage(tenantId: string, enrollmentId: string) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('enrollments')
    .update({ status: 'cancelled', cancelled_at: now })
    .eq('id', enrollmentId)
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')
    .select('id')
    .maybeSingle();
  if (error) return fail(500, error.message);
  if (!data) return fail(409, 'This package is already cancelled');
  await db.from('coaching_offers').update({ status: 'cancelled', decided_at: now }).eq('enrollment_id', enrollmentId).eq('status', 'pending');
  return { ok: true as const };
}

/** The signed contract (PDF) from DocuSign. */
export async function contractPdf(tenantId: string, enrollmentId: string) {
  const db = createAdminClient();
  const { data: e } = await db.from('enrollments').select('docusign_envelope_id, signature_status').eq('id', enrollmentId).eq('tenant_id', tenantId).maybeSingle();
  if (!e?.docusign_envelope_id || e.signature_status !== 'completed') return fail(404, 'No signed contract');
  const { getDocuSignClientByTenantId } = await import('@/lib/docusign/client');
  const client = await getDocuSignClientByTenantId(tenantId);
  return { ok: true as const, pdf: await client.downloadDocuments(e.docusign_envelope_id) };
}

/** The intake answers of a package, for the drawer. */
export async function packageIntake(tenantId: string, enrollmentId: string) {
  const { data } = await createAdminClient()
    .from('intake_responses')
    .select('questions, answers, submitted_at')
    .eq('enrollment_id', enrollmentId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  return data ? { ok: true as const, ...data } : fail(404, 'No intake answers yet');
}

// ─── "Open a package": finding the client ──────────────────────────────

/** Clients by name, email or phone. */
export async function searchClients(tenantId: string, q: string) {
  const term = q.trim().replace(/[%,()]/g, ' ').trim();
  if (term.length < 2) return { ok: true as const, clients: [] };
  const like = `%${term}%`;
  const parts = term.split(/\s+/).filter(Boolean);
  const db = createAdminClient();
  let query = db.from('users').select('id, first_name, last_name, email, phone').eq('tenant_id', tenantId).limit(12);
  query = parts.length > 1
    ? query.ilike('first_name', `%${parts[0]}%`).ilike('last_name', `%${parts.slice(1).join(' ')}%`)
    : query.or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
  const { data, error } = await query;
  if (error) return fail(500, error.message);
  return { ok: true as const, clients: (data ?? []).map((u: any) => ({ id: u.id, name: nameOf(u), email: u.email, phone: u.phone ?? null })) };
}

/** A client's children and the coaching they already have, for step 2. */
export async function clientCoaching(tenantId: string, parentId: string) {
  const db = createAdminClient();
  const [{ data: children }, { rows }] = await Promise.all([
    db.from('children').select('id, first_name, last_name, birth_year').eq('tenant_id', tenantId).eq('parent_user_id', parentId).is('archived_at', null).order('created_at'),
    loadPackages(tenantId),
  ]);
  const mine = rows.filter((r) => r.e.user_id === parentId && !['cancelled', 'ended'].includes(r.summary.status));
  return {
    ok: true as const,
    in_parent_coaching: mine.some((r) => r.kind === 'parent'),
    children: (children ?? []).map((c: any) => {
      const pack = mine.find((r) => r.e.child_id === c.id);
      return {
        id: c.id,
        name: `${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`,
        age: ageOf(c.birth_year),
        coaching: pack ? { used: pack.summary.sessions_used, total: pack.summary.sessions_total } : null,
      };
    }),
  };
}

/** The intake form for a package: a form id, 'none', or null (the product's own / the general one). */
export async function setPackageIntakeForm(tenantId: string, enrollmentId: string, formId: unknown) {
  const db = createAdminClient();
  const value = formId === 'none' ? 'none' : typeof formId === 'string' && formId ? formId : null;
  if (value && value !== 'none') {
    const { data: form } = await db.from('intake_forms').select('id').eq('id', value).eq('tenant_id', tenantId).eq('is_active', true).maybeSingle();
    if (!form) return fail(400, 'Choose an intake form from the list');
  }
  const { data: e } = await db.from('enrollments').select('id, payment_metadata').eq('id', enrollmentId).eq('tenant_id', tenantId).maybeSingle();
  if (!e) return fail(404, 'Package not found');
  const { data: answered } = await db.from('intake_responses').select('id').eq('enrollment_id', e.id).maybeSingle();
  if (answered) return fail(409, 'The client already filled in the intake form');
  const meta = { ...((e.payment_metadata as any) ?? {}) };
  if (value) meta.intake_form_id = value;
  else delete meta.intake_form_id;
  const { error } = await db.from('enrollments').update({ payment_metadata: meta }).eq('id', e.id);
  return error ? fail(500, error.message) : { ok: true as const };
}

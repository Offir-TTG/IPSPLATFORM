/**
 * Admin side of child coaching: requests, coaching packs per child, sessions
 * (mark done / no-show, book, move, cancel on the parent's behalf), coach
 * hours and time off, and the intake form. Every function is scoped to the
 * admin's tenant; the routes check the caller is a tenant admin first.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { DEFAULT_FALLBACK_TIMEZONE, formatInTimezone } from '@/lib/datetime/timezone';
import { cleanQuestions, type IntakeQuestion } from './intake';
import { chargeHeldSession } from '@/lib/payments/perSession';

type Fail = { ok: false; status: number; error: string };
const fail = (status: number, error: string): Fail => ({ ok: false, status, error });
const nameOf = (u: any) => (u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || '' : '');
const ageOf = (birthYear: number | null | undefined) => (birthYear ? new Date().getFullYear() - birthYear : null);
const COUNTED = ['done', 'late_cancelled', 'no_show'];

// ─── Requests ──────────────────────────────────────────────────────────

export async function listCoachingRequests(tenantId: string, status: 'new' | 'in_progress' | 'handled' = 'new') {
  const db = createAdminClient();
  const read = (cols: string) =>
    db.from('coaching_requests').select(cols).eq('tenant_id', tenantId).eq('status', status).order('created_at', { ascending: status !== 'handled' }).limit(200);
  // The type and package columns come with the coaching packages update; older rows are child requests.
  let { data: requests, error } = (await read('id, parent_user_id, child_id, note, status, created_at, handled_at, kind, enrollment_id, sessions_requested')) as { data: any[] | null; error: any };
  if (error) ({ data: requests, error } = (await read('id, parent_user_id, child_id, note, status, created_at, handled_at')) as { data: any[] | null; error: any });
  if (error) return fail(500, error.message);
  const packIds = [...new Set((requests ?? []).map((r: any) => r.enrollment_id).filter(Boolean))] as string[];
  const { data: packRows } = packIds.length
    ? await db.from('enrollments').select('id, product_id, coach_id, child_id').in('id', packIds)
    : { data: [] as any[] };
  const { data: packProducts } = (packRows ?? []).length
    ? await db.from('products').select('id, title, session_count').in('id', [...new Set((packRows ?? []).map((p: any) => p.product_id))])
    : { data: [] as any[] };
  const { data: packSessions } = packIds.length ? await db.from('coaching_sessions').select('enrollment_id, status').in('enrollment_id', packIds) : { data: [] as any[] };
  const { data: packOffers } = packIds.length ? await db.from('coaching_offers').select('enrollment_id, sessions, status').in('enrollment_id', packIds) : { data: [] as any[] };
  const coachIds = [...new Set((packRows ?? []).map((p: any) => p.coach_id).filter(Boolean))] as string[];
  const { data: packCoaches } = coachIds.length ? await db.from('users').select('id, first_name, last_name, email').in('id', coachIds) : { data: [] as any[] };
  const packInfo = (id: string | null) => {
    const p = (packRows ?? []).find((x: any) => x.id === id);
    if (!p) return null;
    const product = (packProducts ?? []).find((x: any) => x.id === p.product_id);
    const extra = (packOffers ?? []).filter((o: any) => o.enrollment_id === p.id && o.status === 'approved').reduce((n: number, o: any) => n + Number(o.sessions || 0), 0);
    return {
      enrollment_id: p.id,
      kind: p.child_id ? 'child' : 'parent',
      title: product?.title ?? '',
      used: (packSessions ?? []).filter((s: any) => s.enrollment_id === p.id && COUNTED.includes(s.status)).length,
      total: (Number(product?.session_count) || 0) + extra,
      coach_name: p.coach_id ? nameOf((packCoaches ?? []).find((c: any) => c.id === p.coach_id)) : null,
    };
  };
  // What each parent already has (for "already in parent coaching, Noa in child coaching").
  const parentIdsAll = [...new Set((requests ?? []).map((r: any) => r.parent_user_id))];
  const { data: parentPacks } = parentIdsAll.length
    ? await db.from('enrollments').select('user_id, child_id, product:products!enrollments_product_id_fkey(type)').in('user_id', parentIdsAll).in('status', ['pending', 'active', 'suspended'])
    : { data: [] as any[] };
  const coachingOfParent = (id: string) => {
    const mine = (parentPacks ?? []).filter((p: any) => p.user_id === id && (Array.isArray(p.product) ? p.product[0] : p.product)?.type === 'session_pack');
    return { parent: mine.some((p: any) => !p.child_id), child_ids: mine.map((p: any) => p.child_id).filter(Boolean) as string[] };
  };
  const parentIds = parentIdsAll;
  const otherChildIds = (parentPacks ?? []).map((p: any) => p.child_id).filter(Boolean);
  const childIds = [...new Set([...(requests ?? []).map((r: any) => r.child_id).filter(Boolean), ...otherChildIds])] as string[];
  const [{ data: parents }, { data: children }, { data: packs }, counts] = await Promise.all([
    parentIds.length ? db.from('users').select('id, first_name, last_name, email, phone').in('id', parentIds) : Promise.resolve({ data: [] as any[] }),
    childIds.length ? db.from('children').select('id, first_name, last_name, birth_year').in('id', childIds) : Promise.resolve({ data: [] as any[] }),
    childIds.length ? db.from('enrollments').select('child_id').in('child_id', childIds).in('status', ['pending', 'active', 'suspended']) : Promise.resolve({ data: [] as any[] }),
    Promise.all(['new', 'in_progress'].map((s) =>
      db.from('coaching_requests').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', s),
    )),
  ]);
  const parentById = new Map((parents ?? []).map((p: any) => [p.id, p]));
  const childById = new Map((children ?? []).map((c: any) => [c.id, c]));
  const withPack = new Set((packs ?? []).map((p: any) => p.child_id));
  return {
    ok: true as const,
    counts: { new: counts[0].count ?? 0, in_progress: counts[1].count ?? 0 },
    requests: (requests ?? []).map((r: any) => {
      const p = parentById.get(r.parent_user_id);
      const c = r.child_id ? childById.get(r.child_id) : null;
      const has = coachingOfParent(r.parent_user_id);
      return {
        id: r.id,
        status: r.status,
        kind: (r.kind === 'more_sessions' ? 'more_sessions' : 'child') as 'child' | 'more_sessions',
        sessions_requested: r.sessions_requested ?? null,
        pack: packInfo(r.enrollment_id ?? null),
        parent_has: {
          parent_coaching: has.parent,
          children: has.child_ids.map((id) => childById.get(id)?.first_name).filter(Boolean) as string[],
        },
        note: r.note,
        created_at: r.created_at,
        parent: p ? { id: p.id, name: nameOf(p), email: p.email, phone: p.phone ?? null } : null,
        child: c ? { id: c.id, name: `${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`, age: ageOf(c.birth_year) } : null,
        has_active_pack: !!(r.child_id && withPack.has(r.child_id)),
      };
    }),
  };
}

export async function setRequestStatus(tenantId: string, adminId: string, requestId: string, status: 'new' | 'in_progress' | 'handled') {
  if (!['new', 'in_progress', 'handled'].includes(status)) return fail(400, 'Unknown status');
  const { data, error } = await createAdminClient()
    .from('coaching_requests')
    .update({ status, handled_by: status === 'handled' ? adminId : null, handled_at: status === 'handled' ? new Date().toISOString() : null })
    .eq('id', requestId)
    .eq('tenant_id', tenantId)
    .select('id')
    .maybeSingle();
  if (error) return fail(500, error.message);
  return data ? { ok: true as const } : fail(404, 'Request not found');
}

// ─── Choices for "open a pack" ─────────────────────────────────────────

export async function coachingChoices(tenantId: string) {
  const db = createAdminClient();
  const [{ data: products }, { data: coaches }, { data: hours }] = await Promise.all([
    db.from('products').select('*').eq('tenant_id', tenantId).eq('type', 'session_pack').eq('is_active', true).order('title'),
    db.from('users').select('id, first_name, last_name, email, role').eq('tenant_id', tenantId).in('role', ['instructor', 'admin']).order('first_name'),
    db.from('coach_availability').select('coach_id, start_time, end_time').eq('tenant_id', tenantId),
  ]);
  const planIds = [...new Set((products ?? []).map((p: any) => p.default_payment_plan_id).filter(Boolean))] as string[];
  const [{ data: plans }, { data: forms }] = await Promise.all([
    planIds.length ? db.from('payment_plans').select('id, plan_type, session_amount').in('id', planIds) : Promise.resolve({ data: [] as any[] }),
    db.from('intake_forms').select('product_id').eq('tenant_id', tenantId).eq('is_active', true),
  ]);
  const planById = new Map((plans ?? []).map((p: any) => [p.id, p]));
  const formFor = new Set((forms ?? []).map((f: any) => f.product_id ?? '*'));
  /** One session's price: the per-session plan's, the product's own, or the total split. */
  const sessionPrice = (p: any) => {
    const plan: any = p.default_payment_plan_id ? planById.get(p.default_payment_plan_id) : null;
    if (plan?.plan_type === 'per_session' && Number(plan.session_amount) > 0) return Number(plan.session_amount);
    if (Number(p.payment_plan?.session_amount) > 0) return Number(p.payment_plan.session_amount);
    return p.session_count ? Math.round((Number(p.price ?? 0) / p.session_count) * 100) / 100 : Number(p.price ?? 0);
  };
  const weeklyMinutes = new Map<string, number>();
  for (const h of hours ?? []) {
    const [sh, sm] = String(h.start_time).split(':').map(Number);
    const [eh, em] = String(h.end_time).split(':').map(Number);
    weeklyMinutes.set(h.coach_id, (weeklyMinutes.get(h.coach_id) ?? 0) + (eh * 60 + em - (sh * 60 + sm)));
  }
  return {
    ok: true as const,
    products: (products ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      price: Number(p.price ?? 0),
      currency: p.currency ?? 'USD',
      session_count: p.session_count ?? null,
      session_minutes: p.session_duration_minutes ?? 50,
      payment_plan_id: p.default_payment_plan_id ?? null,
      // Parent or child coaching, as set on the product (none = shown for both).
      kind: p.metadata?.coaching_kind === 'parent' || p.metadata?.coaching_kind === 'child' ? p.metadata.coaching_kind : null,
      price_per_session: sessionPrice(p),
      per_session: p.payment_model === 'per_session' || (planById.get(p.default_payment_plan_id) as any)?.plan_type === 'per_session',
      requires_signature: !!p.requires_signature,
      has_intake: formFor.has(p.id) || formFor.has('*'),
      // CRM tags the client's contact gets when the enrollment is completed.
      crm_tag_slugs: Array.isArray(p.crm_tag_slugs) ? p.crm_tag_slugs : [],
    })),
    coaches: (coaches ?? []).map((c: any) => ({
      id: c.id,
      name: nameOf(c),
      role: c.role,
      weekly_hours: Math.round(((weeklyMinutes.get(c.id) ?? 0) / 60) * 10) / 10,
    })),
  };
}

// ─── Children in coaching ──────────────────────────────────────────────

export async function listCoachingPacks(tenantId: string) {
  const db = createAdminClient();
  const { data: packs, error } = await db
    .from('enrollments')
    .select('id, user_id, child_id, coach_id, product_id, status, payment_metadata, wizard_profile_data, created_at')
    .eq('tenant_id', tenantId)
    .or('child_id.not.is.null,payment_metadata->pending_child.not.is.null')
    .in('status', ['draft', 'pending', 'active', 'suspended', 'completed'])
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) return fail(500, error.message);
  const ids = (k: string) => [...new Set((packs ?? []).map((p: any) => p[k]).filter(Boolean))] as string[];
  const enrollmentIds = (packs ?? []).map((p) => p.id);
  const [{ data: users }, { data: children }, { data: products }, { data: sessions }] = await Promise.all([
    db.from('users').select('id, first_name, last_name, email').in('id', [...ids('user_id'), ...ids('coach_id')]),
    ids('child_id').length ? db.from('children').select('id, first_name, last_name, birth_year').in('id', ids('child_id')) : Promise.resolve({ data: [] as any[] }),
    ids('product_id').length ? db.from('products').select('id, title, session_count').in('id', ids('product_id')) : Promise.resolve({ data: [] as any[] }),
    enrollmentIds.length ? db.from('coaching_sessions').select('enrollment_id, status, starts_at').in('enrollment_id', enrollmentIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const by = (rows: any[] | null) => new Map((rows ?? []).map((r: any) => [r.id, r]));
  const userById = by(users), childById = by(children), productById = by(products);
  const now = Date.now();
  return {
    ok: true as const,
    packs: (packs ?? []).map((p: any) => {
      const own = (sessions ?? []).filter((s: any) => s.enrollment_id === p.id);
      const child = p.child_id ? childById.get(p.child_id) : null;
      const pending = p.payment_metadata?.pending_child;
      const parent = p.user_id ? userById.get(p.user_id) : null;
      const next = own.filter((s: any) => s.status === 'booked' && new Date(s.starts_at).getTime() > now)
        .sort((a: any, b: any) => a.starts_at.localeCompare(b.starts_at))[0];
      return {
        enrollment_id: p.id,
        status: p.status,
        child_name: child ? child.first_name : pending?.first_name ?? '',
        child_age: ageOf(child?.birth_year ?? pending?.birth_year),
        waiting_for_parent_signup: !p.child_id && !!pending,
        parent_name: parent ? nameOf(parent) : `${p.wizard_profile_data?.first_name ?? ''} ${p.wizard_profile_data?.last_name ?? ''}`.trim(),
        coach_name: p.coach_id ? nameOf(userById.get(p.coach_id)) : null,
        product_title: productById.get(p.product_id)?.title ?? '',
        sessions_total: productById.get(p.product_id)?.session_count ?? null,
        sessions_used: own.filter((s: any) => COUNTED.includes(s.status)).length,
        sessions_to_mark: own.filter((s: any) => s.status === 'booked' && new Date(s.starts_at).getTime() < now).length,
        next_session_at: next?.starts_at ?? null,
      };
    }),
  };
}

/** One child's coaching for the admin: pack, coach, sessions, intake answers and payments. */
export async function getCoachingPackForAdmin(tenantId: string, enrollmentId: string) {
  const db = createAdminClient();
  const { data: p } = await db.from('enrollments').select('*').eq('id', enrollmentId).eq('tenant_id', tenantId).maybeSingle();
  if (!p || (!p.child_id && !p.payment_metadata?.pending_child)) return fail(404, 'Coaching not found');
  const [{ data: parent }, { data: coach }, { data: child }, { data: product }, { data: sessions }, { data: intake }, { data: schedules }] = await Promise.all([
    p.user_id ? db.from('users').select('id, first_name, last_name, email, phone').eq('id', p.user_id).maybeSingle() : Promise.resolve({ data: null }),
    p.coach_id ? db.from('users').select('id, first_name, last_name').eq('id', p.coach_id).maybeSingle() : Promise.resolve({ data: null }),
    p.child_id ? db.from('children').select('id, first_name, last_name, birth_year').eq('id', p.child_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from('products').select('*').eq('id', p.product_id).maybeSingle(),
    db.from('coaching_sessions').select('id, starts_at, ends_at, status, zoom_join_url, cancelled_at').eq('enrollment_id', p.id).order('starts_at', { ascending: false }),
    db.from('intake_responses').select('questions, answers, submitted_at, updated_at').eq('enrollment_id', p.id).maybeSingle(),
    db.from('payment_schedules').select('status, amount, scheduled_date').eq('enrollment_id', p.id),
  ]);
  const pending = p.payment_metadata?.pending_child;
  const all = sessions ?? [];
  const now = Date.now();
  const firstHappened = all.some((s: any) => s.status !== 'booked' && s.status !== 'cancelled') || all.some((s: any) => s.status === 'booked' && new Date(s.starts_at).getTime() <= now);
  return {
    ok: true as const,
    enrollment_id: p.id,
    status: p.status,
    child: child
      ? { id: child.id, name: `${child.first_name}${child.last_name ? ' ' + child.last_name : ''}`, age: ageOf(child.birth_year) }
      : { id: null, name: pending?.first_name ?? '', age: ageOf(pending?.birth_year) },
    waiting_for_parent_signup: !p.child_id && !!pending,
    parent: parent ? { id: parent.id, name: nameOf(parent), email: parent.email, phone: parent.phone ?? null } : { id: null, name: `${p.wizard_profile_data?.first_name ?? ''} ${p.wizard_profile_data?.last_name ?? ''}`.trim(), email: p.wizard_profile_data?.email ?? null, phone: null },
    coach: coach ? { id: coach.id, name: nameOf(coach) } : null,
    product: product ? { id: product.id, title: product.title, session_count: product.session_count ?? null, session_minutes: product.session_duration_minutes ?? 50 } : null,
    sessions_used: all.filter((s: any) => COUNTED.includes(s.status)).length,
    sessions_booked: all.filter((s: any) => s.status === 'booked').length,
    sessions: all.map((s: any) => ({ ...s, needs_marking: s.status === 'booked' && new Date(s.starts_at).getTime() < now })),
    intake: intake
      ? { questions: cleanQuestions(intake.questions), answers: intake.answers ?? {}, submitted_at: intake.submitted_at, updated_at: intake.updated_at, locked: firstHappened }
      : null,
    payments: { paid: (schedules ?? []).filter((s: any) => s.status === 'paid').length, total: (schedules ?? []).filter((s: any) => !['cancelled', 'refunded'].includes(s.status)).length },
  };
}

export async function setPackCoach(tenantId: string, enrollmentId: string, coachId: string) {
  const db = createAdminClient();
  const { data: coach } = await db.from('users').select('id, role').eq('id', coachId).eq('tenant_id', tenantId).maybeSingle();
  if (!coach || !['instructor', 'admin', 'super_admin'].includes(coach.role)) return fail(400, 'Choose a coach from the team');
  const { data: booked } = await db.from('coaching_sessions').select('id').eq('enrollment_id', enrollmentId).eq('status', 'booked').gt('starts_at', new Date().toISOString());
  if ((booked ?? []).length) return fail(409, 'Move or cancel the upcoming sessions before changing the coach');
  const { data, error } = await db.from('enrollments').update({ coach_id: coachId }).eq('id', enrollmentId).eq('tenant_id', tenantId).select('id').maybeSingle();
  if (error) return fail(500, error.message);
  return data ? { ok: true as const } : fail(404, 'Coaching not found');
}

// ─── Sessions (staff) ──────────────────────────────────────────────────

/**
 * Tells the parent about a session the team booked, moved or cancelled,
 * through the existing notifications (portal bell; the notification email
 * delivery picks it up too). Hebrew: the portal is Hebrew only. Never blocks
 * the change itself.
 */
async function notifyParent(tenantId: string, adminId: string, sessionId: string, kind: 'booked' | 'moved' | 'cancelled') {
  try {
    const db = createAdminClient();
    const { data: s } = await db.from('coaching_sessions').select('enrollment_id, child_id, starts_at').eq('id', sessionId).maybeSingle();
    if (!s) return;
    const [{ data: p }, { data: child }, { data: tenant }] = await Promise.all([
      db.from('enrollments').select('user_id').eq('id', s.enrollment_id).maybeSingle(),
      s.child_id ? db.from('children').select('first_name').eq('id', s.child_id).maybeSingle() : Promise.resolve({ data: null }),
      db.from('tenants').select('timezone').eq('id', tenantId).maybeSingle(),
    ]);
    if (!p?.user_id) return;
    const tz = tenant?.timezone || DEFAULT_FALLBACK_TIMEZONE;
    const when = formatInTimezone(s.starts_at, tz, { weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }, 'he-IL');
    const name = child?.first_name ?? '';
    const title = kind === 'booked' ? `נקבע מפגש עבור ${name}` : kind === 'moved' ? `המפגש של ${name} הועבר` : `המפגש של ${name} בוטל`;
    const message = kind === 'cancelled' ? `המפגש שהיה קבוע ל${when} בוטל.` : `המפגש נקבע ל${when}.`;
    await db.from('notifications').insert({
      tenant_id: tenantId,
      scope: 'individual',
      target_user_id: p.user_id,
      category: 'announcement',
      priority: 'medium',
      display_style: 'list',
      title,
      message,
      action_url: s.child_id ? `/children/${s.child_id}` : '/dashboard',
      action_label: 'לפרטים',
      metadata: { kind: `coaching_session_${kind}`, session_id: sessionId },
      created_by: adminId,
    });
  } catch (error) {
    console.error('[coaching] parent notification failed', error);
  }
}

/** Took place / no-show for a session whose time has come. */
export async function markSession(tenantId: string, sessionId: string, outcome: 'done' | 'no_show') {
  if (!['done', 'no_show'].includes(outcome)) return fail(400, 'Unknown outcome');
  const db = createAdminClient();
  const { data: s } = await db.from('coaching_sessions').select('id, starts_at, status').eq('id', sessionId).eq('tenant_id', tenantId).maybeSingle();
  if (!s) return fail(404, 'Session not found');
  if (new Date(s.starts_at).getTime() > Date.now()) return fail(409, 'This session has not happened yet');
  if (!['booked', 'done', 'no_show'].includes(s.status)) return fail(409, 'A cancelled session cannot be marked');
  const { error } = await db.from('coaching_sessions').update({ status: outcome, updated_at: new Date().toISOString() }).eq('id', s.id);
  if (error) return fail(500, error.message);
  // Pay as you go: a held session is charged to the saved card now. The
  // session stays held even if the card fails; that charge then follows the
  // usual retry and overdue handling.
  if (outcome === 'done') {
    const charge = await chargeHeldSession(tenantId, s.id);
    return { ok: true as const, charge };
  }
  return { ok: true as const };
}

/** Staff cancel: no 24-hour rule; `counted` decides whether it uses up a session. */
export async function staffCancelSession(tenantId: string, adminId: string, sessionId: string, counted: boolean) {
  const db = createAdminClient();
  const { data, error } = await db
    .from('coaching_sessions')
    .update({ status: counted ? 'late_cancelled' : 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('tenant_id', tenantId)
    .eq('status', 'booked')
    .select('id')
    .maybeSingle();
  if (error) return fail(500, error.message);
  if (!data) return fail(409, 'Only an upcoming session can be cancelled');
  await notifyParent(tenantId, adminId, sessionId, 'cancelled');
  return { ok: true as const };
}

/**
 * Staff book or move: any time, including outside the coach's weekly hours
 * and within 24 hours; only an overlap with another booked session of the
 * coach is refused (by the database).
 */
export async function staffPlaceSession(
  tenantId: string,
  adminId: string,
  input: { enrollment_id: string; starts_at: string; session_id?: string },
) {
  const db = createAdminClient();
  const { data: p } = await db.from('enrollments').select('id, tenant_id, child_id, coach_id, product_id, status').eq('id', input.enrollment_id).eq('tenant_id', tenantId).maybeSingle();
  if (!p || !p.child_id) return fail(404, 'Coaching not found');
  // Sessions come after the parent has enrolled and paid (the wizard).
  if (p.status !== 'active') return fail(409, 'The parent has not finished the enrollment and payment yet');
  if (!p.coach_id) return fail(409, 'Assign a coach first');
  const { data: product } = await db.from('products').select('*').eq('id', p.product_id).maybeSingle();
  const start = new Date(input.starts_at);
  if (isNaN(start.getTime())) return fail(400, 'Choose a time');
  const end = new Date(start.getTime() + (product?.session_duration_minutes ?? 50) * 60_000);
  const values = { starts_at: start.toISOString(), ends_at: end.toISOString(), updated_at: new Date().toISOString() };
  if (input.session_id) {
    const { data, error } = await db.from('coaching_sessions').update(values).eq('id', input.session_id).eq('enrollment_id', p.id).eq('status', 'booked').select('id').maybeSingle();
    if (error) return error.code === '23P01' ? fail(409, 'The coach already has a session at that time') : fail(500, error.message);
    if (!data) return fail(409, 'Only an upcoming session can be moved');
    await notifyParent(tenantId, adminId, data.id, 'moved');
    return { ok: true as const, session_id: data.id };
  }
  if (product?.session_count) {
    const { data: rows } = await db.from('coaching_sessions').select('status').eq('enrollment_id', p.id);
    const taken = (rows ?? []).filter((r: any) => r.status === 'booked' || COUNTED.includes(r.status)).length;
    if (taken >= product.session_count) return fail(409, 'All sessions in this pack are already booked or used');
  }
  const { data, error } = await db
    .from('coaching_sessions')
    .insert({ tenant_id: tenantId, enrollment_id: p.id, child_id: p.child_id, coach_id: p.coach_id, status: 'booked', booked_by: adminId, ...values })
    .select('id')
    .single();
  if (error) return error.code === '23P01' ? fail(409, 'The coach already has a session at that time') : fail(500, error.message);
  await notifyParent(tenantId, adminId, data.id, 'booked');
  return { ok: true as const, session_id: data.id };
}

// ─── Coach hours ───────────────────────────────────────────────────────

export type WeeklyRange = { weekday: number; start_time: string; end_time: string };

export async function getCoachHours(tenantId: string, coachId: string) {
  const db = createAdminClient();
  const [{ data: coach }, { data: hours }, { data: timeOff }, { data: tenant }] = await Promise.all([
    db.from('users').select('id, first_name, last_name, role').eq('id', coachId).eq('tenant_id', tenantId).maybeSingle(),
    db.from('coach_availability').select('weekday, start_time, end_time').eq('coach_id', coachId).eq('tenant_id', tenantId).order('weekday').order('start_time'),
    db.from('coach_time_off').select('id, starts_at, ends_at, note').eq('coach_id', coachId).eq('tenant_id', tenantId).gte('ends_at', new Date().toISOString()).order('starts_at'),
    db.from('tenants').select('timezone').eq('id', tenantId).maybeSingle(),
  ]);
  if (!coach) return fail(404, 'Coach not found');
  const conflicts = await Promise.all((timeOff ?? []).map(async (t: any) => {
    const { count } = await db.from('coaching_sessions').select('id', { count: 'exact', head: true }).eq('coach_id', coachId).eq('status', 'booked').lt('starts_at', t.ends_at).gt('ends_at', t.starts_at);
    return { ...t, booked_sessions: count ?? 0 };
  }));
  return {
    ok: true as const,
    coach: { id: coach.id, name: nameOf(coach) },
    timezone: tenant?.timezone || DEFAULT_FALLBACK_TIMEZONE,
    weekly: (hours ?? []).map((h: any) => ({ weekday: h.weekday, start_time: String(h.start_time).slice(0, 5), end_time: String(h.end_time).slice(0, 5) })),
    time_off: conflicts,
  };
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Replaces the coach's weekly hours. Booked sessions stay where they are. */
export async function saveCoachHours(tenantId: string, coachId: string, weekly: WeeklyRange[]) {
  if (!Array.isArray(weekly) || weekly.length > 70) return fail(400, 'Hours are not valid');
  for (const r of weekly) {
    if (!Number.isInteger(r.weekday) || r.weekday < 0 || r.weekday > 6 || !TIME.test(r.start_time) || !TIME.test(r.end_time) || r.end_time <= r.start_time) {
      return fail(400, 'Each range needs a day and a start before its end');
    }
  }
  for (let d = 0; d < 7; d++) {
    const day = weekly.filter((r) => r.weekday === d).sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (let i = 1; i < day.length; i++) if (day[i].start_time < day[i - 1].end_time) return fail(400, 'Two ranges on the same day overlap');
  }
  const db = createAdminClient();
  const { data: coach } = await db.from('users').select('id').eq('id', coachId).eq('tenant_id', tenantId).maybeSingle();
  if (!coach) return fail(404, 'Coach not found');
  const { error: delError } = await db.from('coach_availability').delete().eq('coach_id', coachId).eq('tenant_id', tenantId);
  if (delError) return fail(500, delError.message);
  if (weekly.length) {
    const { error } = await db.from('coach_availability').insert(weekly.map((r) => ({ tenant_id: tenantId, coach_id: coachId, ...r })));
    if (error) return fail(500, error.message);
  }
  return getCoachHours(tenantId, coachId);
}

export async function addTimeOff(tenantId: string, coachId: string, input: { starts_at: string; ends_at: string; note?: string }) {
  const start = new Date(input.starts_at), end = new Date(input.ends_at);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return fail(400, 'Choose a start before the end');
  const db = createAdminClient();
  const { data: coach } = await db.from('users').select('id').eq('id', coachId).eq('tenant_id', tenantId).maybeSingle();
  if (!coach) return fail(404, 'Coach not found');
  const { error } = await db.from('coach_time_off').insert({ tenant_id: tenantId, coach_id: coachId, starts_at: start.toISOString(), ends_at: end.toISOString(), note: input.note?.slice(0, 200) ?? null });
  return error ? fail(500, error.message) : getCoachHours(tenantId, coachId);
}

export async function removeTimeOff(tenantId: string, coachId: string, timeOffId: string) {
  const { error } = await createAdminClient().from('coach_time_off').delete().eq('id', timeOffId).eq('coach_id', coachId).eq('tenant_id', tenantId);
  return error ? fail(500, error.message) : getCoachHours(tenantId, coachId);
}

// ─── Intake forms ──────────────────────────────────────────────────────

export async function listIntakeForms(tenantId: string) {
  const { data, error } = await createAdminClient()
    .from('intake_forms')
    .select('id, product_id, title, questions, is_active, updated_at')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });
  if (error) return fail(500, error.message);
  return { ok: true as const, forms: (data ?? []).map((f: any) => ({ ...f, questions: cleanQuestions(f.questions) })) };
}

/**
 * Saves a form (new or existing). One active form per product and one
 * general form: saving for a product that already has one replaces it.
 * Intakes already sent keep their own copy of the questions.
 */
export async function saveIntakeForm(
  tenantId: string,
  input: { id?: string; title: string; product_id?: string | null; questions: unknown },
) {
  const title = String(input.title ?? '').trim();
  if (!title) return fail(400, 'The form needs a name');
  const questions: IntakeQuestion[] = cleanQuestions(input.questions);
  if (!questions.length) return fail(400, 'Add at least one question (choice questions need two options)');
  const db = createAdminClient();
  const productId = input.product_id || null;
  if (productId) {
    const { data: product } = await db.from('products').select('id').eq('id', productId).eq('tenant_id', tenantId).maybeSingle();
    if (!product) return fail(400, 'Choose a product of this school');
  }
  // Retire the other active form for the same product (or the general one).
  let retire = db.from('intake_forms').update({ is_active: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('is_active', true);
  retire = productId ? retire.eq('product_id', productId) : retire.is('product_id', null);
  if (input.id) retire = retire.neq('id', input.id);
  const { error: retireError } = await retire;
  if (retireError) return fail(500, retireError.message);

  const values = { tenant_id: tenantId, product_id: productId, title, questions, is_active: true, updated_at: new Date().toISOString() };
  const { data, error } = input.id
    ? await db.from('intake_forms').update(values).eq('id', input.id).eq('tenant_id', tenantId).select('id').maybeSingle()
    : await db.from('intake_forms').insert(values).select('id').single();
  if (error) return fail(500, error.message);
  if (!data) return fail(404, 'Form not found');
  return { ok: true as const, id: data.id };
}

export async function deleteIntakeForm(tenantId: string, formId: string) {
  // Retired, not deleted: sent intakes point at it.
  const { error } = await createAdminClient().from('intake_forms').update({ is_active: false }).eq('id', formId).eq('tenant_id', tenantId);
  return error ? fail(500, error.message) : { ok: true as const };
}

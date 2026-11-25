/**
 * Where the engine finds the cases for each reminder, and how it knows a
 * case is over (the stop conditions). One finder per catalogue event the
 * engine looks for itself (source 'poll'). Read-only, except renewing an
 * expired enrollment link before a reminder sends it.
 *
 * Server only.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { PAYMENT_CONFIG } from '@/lib/payments/config';
import type { CaseContext } from './context';

type Db = ReturnType<typeof createAdminClient>;

export interface Case {
  subjectType: string;
  subjectId: string;
  userId: string;
  anchorAt: Date;
  productId?: string | null;
  context: CaseContext;
}

export interface RunRow {
  id: string;
  tenant_id: string;
  chaser_id: string;
  subject_type: string;
  subject_id: string;
  user_id: string | null;
  anchor_at: string;
  status: string;
  next_position: number;
  next_at: string | null;
  context: CaseContext;
}

export interface FindArgs {
  db: Db;
  tenantId: string;
  now: Date;
  /** Cases that started on or after this (events that already happened). */
  since: Date;
  /** How far ahead to look (events still to come). */
  until: Date;
}

/** A stop reason (one of the catalogue's stop keys), or null to carry on. */
export type CheckResult = { stop: string | null; context?: CaseContext };

export interface SourceDef {
  find(args: FindArgs): Promise<Case[]>;
  check(db: Db, run: RunRow): Promise<CheckResult>;
  /**
   * The case has no stable moment to count from (e.g. "the contract was
   * sent"), so it counts from when the engine first sees it, once per case.
   */
  oncePerCase?: boolean;
  /** Look for new cases only this often (minutes), e.g. Stripe lookups. */
  everyMinutes?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PAID = new Set(['paid', 'completed', 'succeeded']);
const DEAD = new Set(['cancelled', 'canceled', 'waived', 'skipped', 'refunded']);
const ENROLLMENT_LIVE = new Set(['active', 'pending', 'draft', 'suspended']);

function one<T>(x: T | T[] | null | undefined): T | null {
  if (!x) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

function sameMoment(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) < 60_000;
}

// --- course members --------------------------------------------------------

export interface Member {
  userId: string;
  enrollmentId: string;
  productId: string;
}

/** People with an active enrollment in a product linked to the course or to a program containing it. */
export async function courseMembers(db: Db, tenantId: string, courseId: string): Promise<Member[]> {
  const [{ data: course }, { data: links }] = await Promise.all([
    db.from('courses').select('id, program_id').eq('id', courseId).maybeSingle(),
    db.from('program_courses').select('program_id').eq('course_id', courseId),
  ]);
  const programs = [...new Set([course?.program_id, ...(links ?? []).map((l: { program_id: string }) => l.program_id)].filter(Boolean))] as string[];
  const [{ data: byCourse }, { data: byProgram }] = await Promise.all([
    db.from('products').select('id').eq('tenant_id', tenantId).eq('course_id', courseId),
    programs.length ? db.from('products').select('id').eq('tenant_id', tenantId).in('program_id', programs) : Promise.resolve({ data: [] as { id: string }[] }),
  ]);
  const productIds = [...new Set([...(byCourse ?? []), ...(byProgram ?? [])].map((p: { id: string }) => p.id))];
  if (!productIds.length) return [];
  const { data: enrollments } = await db
    .from('enrollments')
    .select('id, user_id, product_id')
    .eq('status', 'active')
    .in('product_id', productIds);
  const seen = new Set<string>();
  const out: Member[] = [];
  for (const e of enrollments ?? []) {
    if (!e.user_id || seen.has(e.user_id)) continue;
    seen.add(e.user_id);
    out.push({ userId: e.user_id, enrollmentId: e.id, productId: e.product_id });
  }
  return out;
}

async function stillMember(db: Db, run: RunRow, courseId: string | undefined): Promise<boolean> {
  if (!courseId || !run.user_id) return true;
  const members = await courseMembers(db, run.tenant_id, courseId);
  return members.some((m) => m.userId === run.user_id);
}

// --- shared payment loading -----------------------------------------------

interface ScheduleRow {
  id: string;
  enrollment_id: string;
  payment_number: number | null;
  amount: number | null;
  currency: string | null;
  scheduled_date: string;
  status: string;
  next_retry_date: string | null;
  retry_count: number | null;
}

async function enrollmentInfo(db: Db, ids: string[]) {
  if (!ids.length) return new Map<string, { user_id: string; status: string; product_id: string; title: string; child_id: string | null }>();
  const { data } = await db
    .from('enrollments')
    .select('id, user_id, status, product_id, child_id, product:products!enrollments_product_id_fkey(title)')
    .in('id', ids);
  return new Map(
    (data ?? []).map((e: any) => [
      e.id,
      { user_id: e.user_id, status: e.status, product_id: e.product_id, title: one<any>(e.product)?.title ?? '', child_id: e.child_id ?? null },
    ]),
  );
}

async function totalPayments(db: Db, enrollmentIds: string[]): Promise<Map<string, number>> {
  if (!enrollmentIds.length) return new Map();
  const { data } = await db.from('payment_schedules').select('enrollment_id').in('enrollment_id', enrollmentIds).neq('status', 'cancelled');
  const m = new Map<string, number>();
  for (const r of data ?? []) m.set(r.enrollment_id, (m.get(r.enrollment_id) ?? 0) + 1);
  return m;
}

function scheduleContext(s: ScheduleRow, e: { title: string; product_id: string }, total: number | undefined, blockAt?: Date): CaseContext {
  return {
    amount: s.amount != null ? Number(s.amount) : undefined,
    currency: s.currency ?? undefined,
    product: e.title,
    productId: e.product_id,
    enrollmentId: s.enrollment_id,
    paymentNo: total && s.payment_number ? `${s.payment_number}/${total}` : s.payment_number ? String(s.payment_number) : undefined,
    nextRetryAt: s.next_retry_date ?? undefined,
    blockAt: (blockAt ?? new Date(new Date(s.scheduled_date).getTime() + PAYMENT_CONFIG.gracePeriodDays * DAY_MS)).toISOString(),
    startsAt: s.scheduled_date,
  };
}

async function scheduleCases(
  db: Db,
  rows: ScheduleRow[],
  anchorOf: (s: ScheduleRow) => Date,
  wantEnrollment: (status: string) => boolean,
): Promise<Case[]> {
  const ids = [...new Set(rows.map((r) => r.enrollment_id))];
  const [info, totals] = await Promise.all([enrollmentInfo(db, ids), totalPayments(db, ids)]);
  const out: Case[] = [];
  for (const s of rows) {
    const e = info.get(s.enrollment_id);
    if (!e?.user_id || !wantEnrollment(e.status)) continue;
    out.push({
      subjectType: 'payment_schedule',
      subjectId: s.id,
      userId: e.user_id,
      anchorAt: anchorOf(s),
      productId: e.product_id,
      context: scheduleContext(s, e, totals.get(s.enrollment_id)),
    });
  }
  return out;
}

async function checkSchedule(db: Db, run: RunRow, anchorField: 'due' | 'block'): Promise<CheckResult> {
  const { data: s } = await db
    .from('payment_schedules')
    .select('id, enrollment_id, status, scheduled_date, next_retry_date, retry_count, amount, currency, payment_number')
    .eq('id', run.subject_id)
    .maybeSingle();
  if (!s) return { stop: 'enrollment_cancelled' };
  if (PAID.has(s.status)) return { stop: 'paid' };
  if (DEAD.has(s.status)) return { stop: 'enrollment_cancelled' };
  const { data: e } = await db.from('enrollments').select('status').eq('id', s.enrollment_id).maybeSingle();
  if (!e || e.status === 'cancelled' || e.status === 'completed') return { stop: 'enrollment_cancelled' };
  // The team moved the date: this run is over, the new date starts its own.
  const anchor = anchorField === 'due' ? s.scheduled_date : new Date(new Date(s.scheduled_date).getTime() + PAYMENT_CONFIG.gracePeriodDays * DAY_MS).toISOString();
  if (!sameMoment(anchor, run.anchor_at)) return { stop: 'rescheduled' };
  return { stop: null, context: { ...run.context, nextRetryAt: s.next_retry_date ?? run.context.nextRetryAt } };
}

// --- the finders -------------------------------------------------------------

export const SOURCES: Record<string, SourceDef> = {
  'lesson.before': {
    async find({ db, tenantId, now, until }) {
      const { data: lessons } = await db
        .from('lessons')
        .select('id, title, course_id, start_time, status, courses(title)')
        .eq('tenant_id', tenantId)
        .gte('start_time', now.toISOString())
        .lte('start_time', until.toISOString())
        .neq('status', 'cancelled');
      const out: Case[] = [];
      for (const l of lessons ?? []) {
        if (!l.course_id || !l.start_time) continue;
        for (const m of await courseMembers(db, tenantId, l.course_id)) {
          out.push({
            subjectType: 'lesson',
            subjectId: l.id,
            userId: m.userId,
            anchorAt: new Date(l.start_time),
            productId: m.productId,
            context: { lesson: l.title, course: one<any>(l.courses)?.title ?? '', courseId: l.course_id, lessonId: l.id, startsAt: l.start_time },
          });
        }
      }
      return out;
    },
    async check(db, run) {
      const { data: l } = await db.from('lessons').select('start_time, status, course_id').eq('id', run.subject_id).maybeSingle();
      if (!l || l.status === 'cancelled' || !sameMoment(l.start_time, run.anchor_at)) return { stop: 'lesson_moved' };
      if (!(await stillMember(db, run, l.course_id))) return { stop: 'enrollment_cancelled' };
      return { stop: null };
    },
  },

  'lesson.absent': {
    async find({ db, tenantId, since }) {
      const { data: rows } = await db
        .from('attendance')
        .select('id, lesson_id, student_id, course_id, attendance_date, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'absent')
        .gte('attendance_date', since.toISOString().slice(0, 10));
      const lessonIds = [...new Set((rows ?? []).map((r: any) => r.lesson_id).filter(Boolean))];
      const { data: lessons } = lessonIds.length
        ? await db.from('lessons').select('id, title, start_time, course_id, courses(title)').in('id', lessonIds)
        : { data: [] as any[] };
      const byId = new Map((lessons ?? []).map((l: any) => [l.id, l]));
      return (rows ?? [])
        .filter((r: any) => r.student_id)
        .map((r: any) => {
          const l: any = byId.get(r.lesson_id);
          const at = l?.start_time ? new Date(l.start_time) : new Date(`${r.attendance_date}T00:00:00Z`);
          return {
            subjectType: 'attendance',
            subjectId: r.id,
            userId: r.student_id,
            anchorAt: at,
            context: { lesson: l?.title ?? '', course: one<any>(l?.courses)?.title ?? '', courseId: r.course_id ?? l?.course_id, lessonId: r.lesson_id, startsAt: l?.start_time },
          };
        });
    },
    async check(db, run) {
      const { data: a } = await db.from('attendance').select('status').eq('id', run.subject_id).maybeSingle();
      return { stop: !a || a.status !== 'absent' ? 'manual' : null };
    },
  },

  'coaching.before': {
    async find({ db, tenantId, now, until }) {
      const { data: sessions } = await db
        .from('coaching_sessions')
        .select('id, enrollment_id, child_id, starts_at, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'booked')
        .gte('starts_at', now.toISOString())
        .lte('starts_at', until.toISOString());
      const info = await enrollmentInfo(db, [...new Set((sessions ?? []).map((s: any) => s.enrollment_id))]);
      const childIds = [...new Set((sessions ?? []).map((s: any) => s.child_id).filter(Boolean))] as string[];
      const { data: kids } = childIds.length ? await db.from('children').select('id, first_name').in('id', childIds) : { data: [] as any[] };
      const kidName = new Map((kids ?? []).map((k: any) => [k.id, k.first_name]));
      const out: Case[] = [];
      for (const s of sessions ?? []) {
        const e = info.get(s.enrollment_id);
        if (!e?.user_id) continue;
        out.push({
          subjectType: 'coaching_session',
          subjectId: s.id,
          userId: e.user_id,
          anchorAt: new Date(s.starts_at),
          productId: e.product_id,
          context: { startsAt: s.starts_at, child: s.child_id ? kidName.get(s.child_id) ?? '' : '', childId: s.child_id ?? undefined, enrollmentId: s.enrollment_id, product: e.title },
        });
      }
      return out;
    },
    async check(db, run) {
      const { data: s } = await db.from('coaching_sessions').select('starts_at, status').eq('id', run.subject_id).maybeSingle();
      if (!s || s.status !== 'booked' || !sameMoment(s.starts_at, run.anchor_at)) return { stop: 'session_changed' };
      return { stop: null };
    },
  },

  'payment.failed': {
    async find({ db, tenantId, since }) {
      const { data } = await db
        .from('payment_schedules')
        .select('id, enrollment_id, payment_number, amount, currency, scheduled_date, status, next_retry_date, retry_count')
        .eq('tenant_id', tenantId)
        .in('status', ['failed', 'overdue'])
        .gte('scheduled_date', since.toISOString());
      return scheduleCases(db, (data ?? []) as ScheduleRow[], (s) => new Date(s.scheduled_date), (st) => ENROLLMENT_LIVE.has(st));
    },
    check: (db, run) => checkSchedule(db, run, 'due'),
  },

  'payment.upcoming': {
    async find({ db, tenantId, now, until }) {
      const { data } = await db
        .from('payment_schedules')
        .select('id, enrollment_id, payment_number, amount, currency, scheduled_date, status, next_retry_date, retry_count')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'scheduled', 'adjusted'])
        .gte('scheduled_date', now.toISOString())
        .lte('scheduled_date', until.toISOString());
      return scheduleCases(db, (data ?? []) as ScheduleRow[], (s) => new Date(s.scheduled_date), (st) => st === 'active');
    },
    check: (db, run) => checkSchedule(db, run, 'due'),
  },

  'payment.before_block': {
    async find({ db, tenantId, now, until }) {
      // Block date = due date + grace period; look for failed payments whose block date is ahead.
      const grace = PAYMENT_CONFIG.gracePeriodDays * DAY_MS;
      const { data } = await db
        .from('payment_schedules')
        .select('id, enrollment_id, payment_number, amount, currency, scheduled_date, status, next_retry_date, retry_count')
        .eq('tenant_id', tenantId)
        .in('status', ['failed', 'overdue', 'pending'])
        .gte('scheduled_date', new Date(now.getTime() - grace).toISOString())
        .lte('scheduled_date', new Date(until.getTime() - grace).toISOString())
        .lte('scheduled_date', now.toISOString());
      return scheduleCases(db, (data ?? []) as ScheduleRow[], (s) => new Date(new Date(s.scheduled_date).getTime() + grace), (st) => st === 'active');
    },
    check: (db, run) => checkSchedule(db, run, 'block'),
  },

  'payment.recovered': {
    async find({ db, tenantId, since }) {
      const { data: pays } = await db
        .from('payments')
        .select('id, enrollment_id, payment_schedule_id, amount, currency, paid_at, created_at, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'paid')
        .not('payment_schedule_id', 'is', null)
        .gte('created_at', since.toISOString());
      const scheduleIds = [...new Set((pays ?? []).map((p: any) => p.payment_schedule_id))];
      const { data: scheds } = scheduleIds.length
        ? await db.from('payment_schedules').select('id, retry_count, last_error').in('id', scheduleIds)
        : { data: [] as any[] };
      const hadTrouble = new Set((scheds ?? []).filter((s: any) => (s.retry_count ?? 0) > 0 || s.last_error).map((s: any) => s.id));
      const recovered = (pays ?? []).filter((p: any) => hadTrouble.has(p.payment_schedule_id));
      const info = await enrollmentInfo(db, [...new Set(recovered.map((p: any) => p.enrollment_id))]);
      return recovered.flatMap((p: any) => {
        const e = info.get(p.enrollment_id);
        if (!e?.user_id) return [];
        return [{
          subjectType: 'payment',
          subjectId: p.id,
          userId: e.user_id,
          anchorAt: new Date(p.paid_at || p.created_at),
          productId: e.product_id,
          context: { amount: Number(p.amount), currency: p.currency, product: e.title, enrollmentId: p.enrollment_id },
        }];
      });
    },
    async check() {
      return { stop: null };
    },
  },

  'payment.received': {
    async find({ db, tenantId, since }) {
      const { data: pays } = await db
        .from('payments')
        .select('id, enrollment_id, amount, currency, paid_at, created_at, installment_number, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'paid')
        .gte('created_at', since.toISOString());
      const info = await enrollmentInfo(db, [...new Set((pays ?? []).map((p: any) => p.enrollment_id).filter(Boolean))]);
      return (pays ?? []).flatMap((p: any) => {
        const e = info.get(p.enrollment_id);
        if (!e?.user_id) return [];
        return [{
          subjectType: 'payment',
          subjectId: p.id,
          userId: e.user_id,
          anchorAt: new Date(p.paid_at || p.created_at),
          productId: e.product_id,
          context: { amount: Number(p.amount), currency: p.currency, product: e.title, enrollmentId: p.enrollment_id, paymentNo: p.installment_number ? String(p.installment_number) : undefined },
        }];
      });
    },
    async check() {
      return { stop: null };
    },
  },

  'payment.card_expiring': {
    everyMinutes: 60,
    async find({ db, tenantId, now }) {
      // Clients with payments still to come in the next 60 days and a saved card.
      const { data: scheds } = await db
        .from('payment_schedules')
        .select('enrollment_id')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'scheduled', 'adjusted'])
        .gte('scheduled_date', now.toISOString())
        .lte('scheduled_date', new Date(now.getTime() + 60 * DAY_MS).toISOString());
      const info = await enrollmentInfo(db, [...new Set((scheds ?? []).map((s: any) => s.enrollment_id))]);
      const byUser = new Map<string, { enrollmentId: string; productId: string; title: string }>();
      for (const [id, e] of info) if (e.user_id && e.status === 'active' && !byUser.has(e.user_id)) byUser.set(e.user_id, { enrollmentId: id, productId: e.product_id, title: e.title });
      if (!byUser.size) return [];
      const { data: users } = await db.from('users').select('id, stripe_customer_id').in('id', [...byUser.keys()]);
      let stripe: any;
      try {
        const { getStripeClient } = await import('@/lib/payments/getStripeClient');
        stripe = (await getStripeClient(tenantId)).stripe;
      } catch {
        return [];
      }
      if (!stripe) return [];
      const out: Case[] = [];
      for (const u of users ?? []) {
        if (!u.stripe_customer_id) continue;
        try {
          const methods = await stripe.paymentMethods.list({ customer: u.stripe_customer_id, type: 'card', limit: 3 });
          const card = methods.data?.[0]?.card;
          if (!card?.exp_month || !card?.exp_year) continue;
          // Valid through the last day of the expiry month.
          const expires = new Date(Date.UTC(card.exp_year, card.exp_month, 0, 23, 59));
          if (expires.getTime() - now.getTime() > 45 * DAY_MS) continue;
          const e = byUser.get(u.id)!;
          out.push({
            subjectType: 'card',
            subjectId: e.enrollmentId,
            userId: u.id,
            anchorAt: expires,
            productId: e.productId,
            context: { cardExpiresAt: expires.toISOString(), product: e.title, enrollmentId: e.enrollmentId, cardLast4: card.last4 },
          });
        } catch (error) {
          console.error('[reminders] card lookup failed', (error as Error).message);
        }
      }
      return out;
    },
    async check(db, run) {
      const { data: e } = await db.from('enrollments').select('status, user_id').eq('id', run.subject_id).maybeSingle();
      if (!e || e.status === 'cancelled' || e.status === 'completed') return { stop: 'enrollment_cancelled' };
      try {
        const { data: u } = await db.from('users').select('stripe_customer_id').eq('id', e.user_id).maybeSingle();
        const { getStripeClient } = await import('@/lib/payments/getStripeClient');
        const stripe: any = (await getStripeClient(run.tenant_id)).stripe;
        if (stripe && u?.stripe_customer_id) {
          const methods = await stripe.paymentMethods.list({ customer: u.stripe_customer_id, type: 'card', limit: 3 });
          const card = methods.data?.[0]?.card;
          if (card) {
            const expires = new Date(Date.UTC(card.exp_year, card.exp_month, 0, 23, 59));
            if (expires.getTime() > new Date(run.anchor_at).getTime() + DAY_MS) return { stop: 'card_updated' };
          }
        }
      } catch {
        /* keep going; the next check will try again */
      }
      return { stop: null };
    },
  },

  'enrollment.incomplete': {
    async find({ db, tenantId, since }) {
      const { data } = await db
        .from('enrollments')
        .select('id, user_id, product_id, invitation_sent_at, enrollment_token, product:products!enrollments_product_id_fkey(title)')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .not('invitation_sent_at', 'is', null)
        .gte('invitation_sent_at', since.toISOString());
      return (data ?? [])
        .filter((e: any) => e.user_id)
        .map((e: any) => ({
          subjectType: 'enrollment',
          subjectId: e.id,
          userId: e.user_id,
          anchorAt: new Date(e.invitation_sent_at),
          productId: e.product_id,
          context: { product: one<any>(e.product)?.title ?? '', enrollmentId: e.id, enrollToken: e.enrollment_token ?? undefined },
        }));
    },
    async check(db, run) {
      const { data: e } = await db.from('enrollments').select('status, invitation_sent_at, enrollment_token, token_expires_at').eq('id', run.subject_id).maybeSingle();
      if (!e || e.status === 'cancelled') return { stop: 'enrollment_cancelled' };
      if (e.status !== 'pending') return { stop: 'enrolled' };
      if (!sameMoment(e.invitation_sent_at, run.anchor_at)) return { stop: 'resent' };
      await renewToken(db, run.subject_id, e.token_expires_at);
      return { stop: null, context: { ...run.context, enrollToken: e.enrollment_token ?? run.context.enrollToken } };
    },
  },

  'enrollment.contract': {
    oncePerCase: true,
    async find({ db, tenantId }) {
      const { data } = await db
        .from('enrollments')
        .select('id, user_id, product_id, status, signature_status, enrollment_token, product:products!enrollments_product_id_fkey(title)')
        .eq('tenant_id', tenantId)
        .in('signature_status', ['sent', 'delivered'])
        .in('status', ['pending', 'draft']);
      return (data ?? [])
        .filter((e: any) => e.user_id)
        .map((e: any) => ({
          subjectType: 'enrollment',
          subjectId: e.id,
          userId: e.user_id,
          anchorAt: new Date(),
          productId: e.product_id,
          context: { product: one<any>(e.product)?.title ?? '', enrollmentId: e.id, enrollToken: e.enrollment_token ?? undefined },
        }));
    },
    async check(db, run) {
      const { data: e } = await db.from('enrollments').select('status, signature_status, token_expires_at').eq('id', run.subject_id).maybeSingle();
      if (!e || e.status === 'cancelled') return { stop: 'enrollment_cancelled' };
      if (e.signature_status === 'completed' || e.status === 'active') return { stop: 'signed' };
      if (e.signature_status !== 'sent' && e.signature_status !== 'delivered') return { stop: 'manual' };
      await renewToken(db, run.subject_id, e.token_expires_at);
      return { stop: null };
    },
  },

  'enrollment.intake': {
    async find({ db, tenantId, now, until }) {
      const { data: sessions } = await db
        .from('coaching_sessions')
        .select('id, enrollment_id, child_id, starts_at, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'booked')
        .gte('starts_at', now.toISOString())
        .lte('starts_at', until.toISOString())
        .order('starts_at', { ascending: true });
      const firstByEnrollment = new Map<string, any>();
      for (const s of sessions ?? []) if (!firstByEnrollment.has(s.enrollment_id)) firstByEnrollment.set(s.enrollment_id, s);
      const ids = [...firstByEnrollment.keys()];
      if (!ids.length) return [];
      const [{ data: done }, { data: earlier }, info] = await Promise.all([
        db.from('intake_responses').select('enrollment_id').in('enrollment_id', ids),
        // Only before the very first session: an enrollment that already had one is past intake.
        db.from('coaching_sessions').select('enrollment_id').in('enrollment_id', ids).lt('starts_at', now.toISOString()).neq('status', 'cancelled'),
        enrollmentInfo(db, ids),
      ]);
      const filled = new Set((done ?? []).map((r: any) => r.enrollment_id));
      const started = new Set((earlier ?? []).map((r: any) => r.enrollment_id));
      const out: Case[] = [];
      for (const [id, s] of firstByEnrollment) {
        const e = info.get(id);
        if (!e?.user_id || filled.has(id) || started.has(id)) continue;
        out.push({
          subjectType: 'enrollment',
          subjectId: id,
          userId: e.user_id,
          anchorAt: new Date(s.starts_at),
          productId: e.product_id,
          context: { startsAt: s.starts_at, childId: s.child_id ?? undefined, enrollmentId: id, product: e.title },
        });
      }
      return out;
    },
    async check(db, run) {
      const { data } = await db.from('intake_responses').select('id').eq('enrollment_id', run.subject_id).maybeSingle();
      return { stop: data ? 'intake_filled' : null };
    },
  },

  'enrollment.completed': {
    async find({ db, tenantId, since }) {
      const { data } = await db
        .from('enrollments')
        .select('id, user_id, product_id, enrolled_at, product:products!enrollments_product_id_fkey(title)')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .not('enrolled_at', 'is', null)
        .gte('enrolled_at', since.toISOString());
      return (data ?? [])
        .filter((e: any) => e.user_id)
        .map((e: any) => ({
          subjectType: 'enrollment',
          subjectId: e.id,
          userId: e.user_id,
          anchorAt: new Date(e.enrolled_at),
          productId: e.product_id,
          context: { product: one<any>(e.product)?.title ?? '', enrollmentId: e.id },
        }));
    },
    async check() {
      return { stop: null };
    },
  },

  'assignment.due': {
    async find({ db, tenantId, now, until }) {
      const { data: tasks } = await db
        .from('assignments')
        .select('id, title, due_date, lesson_id')
        .eq('tenant_id', tenantId)
        .gte('due_date', now.toISOString())
        .lte('due_date', until.toISOString());
      if (!tasks?.length) return [];
      const lessonIds = [...new Set(tasks.map((t: any) => t.lesson_id).filter(Boolean))];
      const { data: lessons } = await db.from('lessons').select('id, course_id, courses(title)').in('id', lessonIds);
      const lessonById = new Map((lessons ?? []).map((l: any) => [l.id, l]));
      const { data: subs } = await db.from('assignment_submissions').select('assignment_id, user_id').in('assignment_id', tasks.map((t: any) => t.id));
      const handedIn = new Set((subs ?? []).map((s: any) => `${s.assignment_id}:${s.user_id}`));
      const out: Case[] = [];
      for (const t of tasks) {
        const l: any = lessonById.get(t.lesson_id);
        if (!l?.course_id) continue;
        for (const m of await courseMembers(db, tenantId, l.course_id)) {
          if (handedIn.has(`${t.id}:${m.userId}`)) continue;
          out.push({
            subjectType: 'assignment',
            subjectId: t.id,
            userId: m.userId,
            anchorAt: new Date(t.due_date),
            productId: m.productId,
            context: { assignment: t.title, course: one<any>(l.courses)?.title ?? '', courseId: l.course_id, dueAt: t.due_date },
          });
        }
      }
      return out;
    },
    async check(db, run) {
      const [{ data: t }, { data: sub }] = await Promise.all([
        db.from('assignments').select('due_date').eq('id', run.subject_id).maybeSingle(),
        db.from('assignment_submissions').select('id').eq('assignment_id', run.subject_id).eq('user_id', run.user_id ?? '').limit(1),
      ]);
      if (sub?.length) return { stop: 'submitted' };
      if (!t || !sameMoment(t.due_date, run.anchor_at)) return { stop: 'manual' };
      return { stop: null };
    },
  },

  'assignment.feedback': {
    async find({ db, tenantId, since }) {
      const { data: subs } = await db
        .from('assignment_submissions')
        .select('id, assignment_id, user_id, graded_at')
        .eq('tenant_id', tenantId)
        .not('graded_at', 'is', null)
        .gte('graded_at', since.toISOString());
      if (!subs?.length) return [];
      const { data: tasks } = await db.from('assignments').select('id, title, lesson_id').in('id', [...new Set(subs.map((s: any) => s.assignment_id))]);
      const taskById = new Map((tasks ?? []).map((t: any) => [t.id, t]));
      const lessonIds = [...new Set((tasks ?? []).map((t: any) => t.lesson_id).filter(Boolean))];
      const { data: lessons } = lessonIds.length ? await db.from('lessons').select('id, course_id, courses(title)').in('id', lessonIds) : { data: [] as any[] };
      const lessonById = new Map((lessons ?? []).map((l: any) => [l.id, l]));
      return subs
        .filter((s: any) => s.user_id)
        .map((s: any) => {
          const t: any = taskById.get(s.assignment_id);
          const l: any = t ? lessonById.get(t.lesson_id) : null;
          return {
            subjectType: 'submission',
            subjectId: s.id,
            userId: s.user_id,
            anchorAt: new Date(s.graded_at),
            context: { assignment: t?.title ?? '', course: one<any>(l?.courses)?.title ?? '', courseId: l?.course_id },
          };
        });
    },
    async check() {
      return { stop: null };
    },
  },

  'certificate.ready': {
    async find({ db, tenantId, since }) {
      const { data } = await db
        .from('certificates')
        .select('id, user_id, course_id, title, issued_at, courses(title)')
        .eq('tenant_id', tenantId)
        .not('issued_at', 'is', null)
        .gte('issued_at', since.toISOString());
      return (data ?? [])
        .filter((c: any) => c.user_id)
        .map((c: any) => ({
          subjectType: 'certificate',
          subjectId: c.id,
          userId: c.user_id,
          anchorAt: new Date(c.issued_at),
          context: { course: one<any>(c.courses)?.title ?? c.title ?? '', courseId: c.course_id ?? undefined },
        }));
    },
    async check() {
      return { stop: null };
    },
  },
};

/** Checks for event-started reminders (no finder): when their case is over. */
export const EVENT_CHECKS: Record<string, SourceDef['check']> = {
  'enrollment.suspended': async (db, run) => {
    const { data: e } = await db.from('enrollments').select('status').eq('id', run.subject_id).maybeSingle();
    return { stop: !e || e.status !== 'suspended' ? 'reactivated' : null };
  },
  'coaching.offer': async (db, run) => {
    const { data: e } = await db.from('enrollments').select('status').eq('id', run.subject_id).maybeSingle();
    return { stop: !e || e.status === 'cancelled' ? 'offer_answered' : null };
  },
};

async function renewToken(db: Db, enrollmentId: string, expiresAt: string | null) {
  const expires = expiresAt ? new Date(expiresAt) : null;
  if (expires && expires.getTime() > Date.now() + DAY_MS) return;
  const fresh = new Date(Date.now() + 7 * DAY_MS);
  // A client's own enrollment only: a guest one (no client) is never kept
  // alive, so the daily cleanup can remove it once abandoned.
  await db.from('enrollments').update({ token_expires_at: fresh.toISOString() }).eq('id', enrollmentId).not('user_id', 'is', null);
}

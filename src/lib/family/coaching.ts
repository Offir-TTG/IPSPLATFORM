/**
 * Children and child coaching for the client portal ("הילדים שלי").
 *
 * Children are records under the parent's account (they don't log in). A
 * coaching pack is an enrollment on a session_pack product with child_id and
 * coach_id set; the parent is the payer (enrollments.user_id). Parents book,
 * reschedule and cancel sessions themselves within the rules below; the
 * portal shows dates, coach and payments only, never notes.
 *
 * Every function checks the child or session belongs to the calling parent.
 * Tables come from supabase/migrations/20261122_family_coaching.sql.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { utcToWallTime, wallTimeToUTC, DEFAULT_FALLBACK_TIMEZONE } from '@/lib/datetime/timezone';
import { intakeStatusFor, type IntakeStatus } from './intake';

/** A session can be moved or cancelled for free up to this long before it. */
export const NOTICE_HOURS = 24;
/** New bookings start at least this far ahead, so the coach has notice. */
export const BOOKING_LEAD_HOURS = 24;
/**
 * Owner decision (22 Nov 2026): for now only the team schedules sessions.
 * Parents see dates but can't book, move or cancel; flip to true to allow it.
 */
export const PARENT_SELF_SCHEDULING = false;
const TEAM_SCHEDULES = 'Sessions are scheduled by the team. Please contact us to change a session.';
/** Sessions that use up one of the pack's sessions. */
const COUNTED = ['done', 'late_cancelled', 'no_show'];
const DEFAULT_SESSION_MINUTES = 50;
const MAX_RANGE_DAYS = 62;

type Fail = { ok: false; status: number; error: string };
const fail = (status: number, error: string): Fail => ({ ok: false, status, error });

export type Child = { id: string; first_name: string; last_name: string | null; birth_year: number | null; created_at: string };

async function parentTenant(userId: string): Promise<string | null> {
  const { data } = await createAdminClient().from('users').select('tenant_id').eq('id', userId).maybeSingle();
  return data?.tenant_id ?? null;
}

async function ownChild(userId: string, childId: string) {
  const { data } = await createAdminClient()
    .from('children')
    .select('id, tenant_id, parent_user_id, first_name, last_name, birth_year, created_at, archived_at')
    .eq('id', childId)
    .maybeSingle();
  return data && data.parent_user_id === userId && !data.archived_at ? data : null;
}

// ─── Children ──────────────────────────────────────────────────────────

export async function listChildren(userId: string): Promise<{ ok: true; children: Child[] } | Fail> {
  const { data, error } = await createAdminClient()
    .from('children')
    .select('id, first_name, last_name, birth_year, created_at')
    .eq('parent_user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  if (error) return fail(500, error.message);
  return { ok: true, children: (data ?? []) as Child[] };
}

function cleanChildInput(input: { first_name?: unknown; last_name?: unknown; birth_year?: unknown }) {
  const first = String(input.first_name ?? '').trim();
  const last = input.last_name == null ? null : String(input.last_name).trim() || null;
  const year = input.birth_year == null || input.birth_year === '' ? null : Number(input.birth_year);
  const thisYear = new Date().getFullYear();
  if (!first || first.length > 80) return { error: 'First name is required (up to 80 characters)' } as const;
  if (last && last.length > 80) return { error: 'Last name is too long' } as const;
  if (year !== null && (!Number.isInteger(year) || year < thisYear - 30 || year > thisYear)) {
    return { error: 'Birth year is not valid' } as const;
  }
  return { first_name: first, last_name: last, birth_year: year } as const;
}

export async function addChild(
  userId: string,
  input: { first_name?: unknown; last_name?: unknown; birth_year?: unknown },
): Promise<{ ok: true; child: Child } | Fail> {
  const clean = cleanChildInput(input);
  if ('error' in clean) return fail(400, clean.error!);
  const tenantId = await parentTenant(userId);
  if (!tenantId) return fail(403, 'Account not found');
  const supabase = createAdminClient();
  const { count } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_user_id', userId)
    .is('archived_at', null);
  if ((count ?? 0) >= 12) return fail(400, 'Too many children on one account');
  const { data, error } = await supabase
    .from('children')
    .insert({ tenant_id: tenantId, parent_user_id: userId, ...clean })
    .select('id, first_name, last_name, birth_year, created_at')
    .single();
  if (error) return fail(500, error.message);
  return { ok: true, child: data as Child };
}

export async function updateChild(
  userId: string,
  childId: string,
  input: { first_name?: unknown; last_name?: unknown; birth_year?: unknown },
): Promise<{ ok: true; child: Child } | Fail> {
  if (!(await ownChild(userId, childId))) return fail(404, 'Child not found');
  const clean = cleanChildInput(input);
  if ('error' in clean) return fail(400, clean.error!);
  const { data, error } = await createAdminClient()
    .from('children')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', childId)
    .select('id, first_name, last_name, birth_year, created_at')
    .single();
  if (error) return fail(500, error.message);
  return { ok: true, child: data as Child };
}

/** Removes a child from the account. Refused while the child has coaching. */
export async function removeChild(userId: string, childId: string): Promise<{ ok: true } | Fail> {
  if (!(await ownChild(userId, childId))) return fail(404, 'Child not found');
  const supabase = createAdminClient();
  const { count } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('child_id', childId)
    .in('status', ['draft', 'pending', 'active', 'suspended']);
  if ((count ?? 0) > 0) return fail(409, 'This child has coaching in progress. Please contact the team.');
  const { error } = await supabase
    .from('children')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', childId);
  return error ? fail(500, error.message) : { ok: true };
}

// ─── Requests ──────────────────────────────────────────────────────────

/** "I'd like coaching for my child": shows up for the team in the admin. */
export async function requestCoaching(
  userId: string,
  childId: string,
  note?: string,
): Promise<{ ok: true; request_id: string } | Fail> {
  const child = await ownChild(userId, childId);
  if (!child) return fail(404, 'Child not found');
  const supabase = createAdminClient();
  const { count } = await supabase
    .from('coaching_requests')
    .select('id', { count: 'exact', head: true })
    .eq('child_id', childId)
    .in('status', ['new', 'in_progress']);
  if ((count ?? 0) > 0) return fail(409, 'A request for this child is already with the team');
  const { data, error } = await supabase
    .from('coaching_requests')
    .insert({
      tenant_id: child.tenant_id,
      parent_user_id: userId,
      child_id: childId,
      status: 'new',
      note: note ? String(note).trim().slice(0, 2000) : null,
    })
    .select('id')
    .single();
  if (error) return fail(500, error.message);
  return { ok: true, request_id: data.id };
}

// ─── Coaching overview ─────────────────────────────────────────────────

export type CoachingSession = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  zoom_join_url: string | null;
  can_change: boolean;
};

export type CoachingPack = {
  enrollment_id: string;
  product_title: string;
  status: string;
  coach: { id: string; name: string } | null;
  session_minutes: number;
  sessions_total: number | null;
  sessions_used: number;
  sessions_booked: number;
  sessions_left: number | null;
  /** 'missing' blocks booking until the parent sends the intake. */
  intake_status: IntakeStatus;
  /** The team opened the pack; the parent still has to enroll and pay in the wizard. */
  awaiting_enrollment: boolean;
  /** The existing enrollment wizard link, or null when the link expired (the team resends it). */
  enrollment_url: string | null;
  can_book: boolean;
  next_session: CoachingSession | null;
  sessions: CoachingSession[];
};

function sessionView(s: any, now = Date.now()): CoachingSession {
  return {
    id: s.id,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    status: s.status,
    zoom_join_url: s.status === 'booked' ? s.zoom_join_url ?? null : null,
    can_change: PARENT_SELF_SCHEDULING && s.status === 'booked' && new Date(s.starts_at).getTime() - now >= NOTICE_HOURS * 3600_000,
  };
}

async function loadPack(enrollment: any): Promise<CoachingPack> {
  const supabase = createAdminClient();
  const [{ data: product }, { data: coach }, { data: sessions }] = await Promise.all([
    supabase.from('products').select('*').eq('id', enrollment.product_id).maybeSingle(),
    enrollment.coach_id
      ? supabase.from('users').select('id, first_name, last_name').eq('id', enrollment.coach_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('coaching_sessions')
      .select('id, starts_at, ends_at, status, zoom_join_url')
      .eq('enrollment_id', enrollment.id)
      .order('starts_at', { ascending: true }),
  ]);
  const all = (sessions ?? []) as any[];
  const now = Date.now();
  const used = all.filter((s) => COUNTED.includes(s.status)).length;
  const booked = all.filter((s) => s.status === 'booked').length;
  const total = product?.session_count ?? null;
  const left = total == null ? null : Math.max(0, total - used - booked);
  const upcoming = all.filter((s) => s.status === 'booked' && new Date(s.ends_at).getTime() > now);
  const intake = await intakeStatusFor(enrollment);
  return {
    enrollment_id: enrollment.id,
    product_title: product?.title ?? '',
    status: enrollment.status,
    coach: coach ? { id: coach.id, name: `${coach.first_name ?? ''} ${coach.last_name ?? ''}`.trim() } : null,
    session_minutes: product?.session_duration_minutes || DEFAULT_SESSION_MINUTES,
    sessions_total: total,
    sessions_used: used,
    sessions_booked: booked,
    sessions_left: left,
    intake_status: intake,
    awaiting_enrollment: ['draft', 'pending'].includes(enrollment.status),
    enrollment_url:
      ['draft', 'pending'].includes(enrollment.status) && enrollment.enrollment_token &&
      enrollment.token_expires_at && new Date(enrollment.token_expires_at).getTime() > Date.now()
        ? `/enroll/${enrollment.enrollment_token}`
        : null,
    can_book: PARENT_SELF_SCHEDULING && enrollment.status === 'active' && !!enrollment.coach_id && (left === null || left > 0) && intake !== 'missing',
    next_session: upcoming[0] ? sessionView(upcoming[0], now) : null,
    sessions: all.map((s) => sessionView(s, now)),
  };
}

/** A child's coaching: packs with coach, sessions used/total and the next session. */
export async function getChildCoaching(
  userId: string,
  childId: string,
): Promise<{ ok: true; child: Child; packs: CoachingPack[]; open_request: boolean } | Fail> {
  const child = await ownChild(userId, childId);
  if (!child) return fail(404, 'Child not found');
  const supabase = createAdminClient();
  const [{ data: enrollments }, { count: openRequests }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, user_id, tenant_id, product_id, coach_id, status, enrollment_token, token_expires_at')
      .eq('child_id', childId)
      .eq('user_id', userId)
      .in('status', ['draft', 'pending', 'active', 'suspended', 'completed'])
      .order('created_at', { ascending: false }),
    supabase
      .from('coaching_requests')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId)
      .in('status', ['new', 'in_progress']),
  ]);
  const packs = await Promise.all((enrollments ?? []).map(loadPack));
  const { tenant_id: _t, parent_user_id: _p, archived_at: _a, ...childView } = child;
  return { ok: true, child: childView as Child, packs, open_request: (openRequests ?? 0) > 0 };
}

// ─── Free slots (self-booking) ─────────────────────────────────────────

type Range = { start: number; end: number };

/**
 * The coach's free slots between `from` and `to`: weekly hours (wall-clock
 * in the school's time zone, daylight saving handled), minus time off and
 * minus booked sessions, starting no earlier than `earliest`. Slots step by
 * the session length from the start of each window. Pure: easy to test.
 */
export function computeFreeSlots(args: {
  availability: { weekday: number; start_time: string; end_time: string }[];
  timeOff: { starts_at: string; ends_at: string }[];
  booked: { starts_at: string; ends_at: string }[];
  sessionMinutes: number;
  timezone: string;
  from: Date;
  to: Date;
  earliest: Date;
}): { starts_at: string; ends_at: string }[] {
  const busy: Range[] = [...args.timeOff, ...args.booked].map((r) => ({
    start: new Date(r.starts_at).getTime(),
    end: new Date(r.ends_at).getTime(),
  }));
  const lengthMs = args.sessionMinutes * 60_000;
  const slots: { starts_at: string; ends_at: string }[] = [];

  // Walk the school's local calendar days in the range.
  const firstDay = utcToWallTime(args.from.toISOString(), args.timezone).slice(0, 10);
  const lastDay = utcToWallTime(args.to.toISOString(), args.timezone).slice(0, 10);
  for (let day = firstDay; day <= lastDay; ) {
    const [y, m, d] = day.split('-').map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    for (const window of args.availability.filter((a) => a.weekday === weekday)) {
      const windowStart = new Date(wallTimeToUTC(`${day}T${window.start_time.slice(0, 5)}`, args.timezone)).getTime();
      const windowEnd = new Date(wallTimeToUTC(`${day}T${window.end_time.slice(0, 5)}`, args.timezone)).getTime();
      for (let start = windowStart; start + lengthMs <= windowEnd; start += lengthMs) {
        const end = start + lengthMs;
        if (start < args.earliest.getTime() || start < args.from.getTime() || end > args.to.getTime()) continue;
        if (busy.some((b) => start < b.end && end > b.start)) continue;
        slots.push({ starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString() });
      }
    }
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    day = next.toISOString().slice(0, 10);
  }
  return slots.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

async function ownPack(userId: string, enrollmentId: string) {
  const { data } = await createAdminClient()
    .from('enrollments')
    .select('id, user_id, tenant_id, child_id, coach_id, product_id, status')
    .eq('id', enrollmentId)
    .maybeSingle();
  return data && data.user_id === userId && data.child_id ? data : null;
}

async function slotsForCoach(
  tenantId: string,
  coachId: string,
  sessionMinutes: number,
  from: Date,
  to: Date,
  ignoreSessionId?: string,
) {
  const supabase = createAdminClient();
  const [{ data: tenant }, { data: availability }, { data: timeOff }, { data: booked }] = await Promise.all([
    supabase.from('tenants').select('timezone').eq('id', tenantId).maybeSingle(),
    supabase.from('coach_availability').select('weekday, start_time, end_time').eq('coach_id', coachId),
    supabase.from('coach_time_off').select('starts_at, ends_at').eq('coach_id', coachId).lt('starts_at', to.toISOString()).gt('ends_at', from.toISOString()),
    supabase.from('coaching_sessions').select('id, starts_at, ends_at').eq('coach_id', coachId).eq('status', 'booked').lt('starts_at', to.toISOString()).gt('ends_at', from.toISOString()),
  ]);
  return computeFreeSlots({
    availability: availability ?? [],
    timeOff: timeOff ?? [],
    booked: (booked ?? []).filter((b: any) => b.id !== ignoreSessionId),
    sessionMinutes,
    timezone: tenant?.timezone || DEFAULT_FALLBACK_TIMEZONE,
    from,
    to,
    earliest: new Date(Date.now() + BOOKING_LEAD_HOURS * 3600_000),
  });
}

async function sessionMinutesFor(productId: string): Promise<number> {
  const { data } = await createAdminClient().from('products').select('*').eq('id', productId).maybeSingle();
  return data?.session_duration_minutes || DEFAULT_SESSION_MINUTES;
}

function parseRange(from?: string, to?: string): { from: Date; to: Date } | null {
  const start = from ? new Date(from) : new Date();
  const end = to ? new Date(to) : new Date(start.getTime() + 14 * 86400_000);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
  if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * 86400_000) return null;
  return { from: start, to: end };
}

/** Free slots with this pack's coach, for booking or moving a session. */
export async function getFreeSlots(
  userId: string,
  enrollmentId: string,
  range: { from?: string; to?: string } = {},
): Promise<{ ok: true; session_minutes: number; slots: { starts_at: string; ends_at: string }[] } | Fail> {
  const pack = await ownPack(userId, enrollmentId);
  if (!pack) return fail(404, 'Coaching not found');
  if (!pack.coach_id) return fail(409, 'A coach has not been assigned yet');
  const r = parseRange(range.from, range.to);
  if (!r) return fail(400, `Choose a date range of up to ${MAX_RANGE_DAYS} days`);
  const minutes = await sessionMinutesFor(pack.product_id);
  const slots = await slotsForCoach(pack.tenant_id, pack.coach_id, minutes, r.from, r.to);
  return { ok: true, session_minutes: minutes, slots };
}

const isSlotIn = (slots: { starts_at: string }[], startsAt: Date) =>
  slots.some((s) => new Date(s.starts_at).getTime() === startsAt.getTime());

/** Books one session in a free slot. The database refuses a slot taken a moment earlier. */
export async function bookSession(
  userId: string,
  enrollmentId: string,
  startsAt: string,
): Promise<{ ok: true; session: CoachingSession } | Fail> {
  if (!PARENT_SELF_SCHEDULING) return fail(403, TEAM_SCHEDULES);
  const pack = await ownPack(userId, enrollmentId);
  if (!pack) return fail(404, 'Coaching not found');
  const view = await loadPack(pack);
  if (!view.can_book) {
    return fail(
      409,
      !pack.coach_id
        ? 'A coach has not been assigned yet'
        : pack.status !== 'active'
          ? 'This coaching is not active'
          : view.intake_status === 'missing'
            ? 'Please fill in the intake form before booking the first session'
            : 'All sessions in this pack are already booked or used',
    );
  }
  const start = new Date(startsAt);
  if (isNaN(start.getTime())) return fail(400, 'Choose a time');
  const end = new Date(start.getTime() + view.session_minutes * 60_000);
  const slots = await slotsForCoach(pack.tenant_id, pack.coach_id!, view.session_minutes, new Date(start.getTime() - 1), new Date(end.getTime() + 1));
  if (!isSlotIn(slots, start)) return fail(409, 'This time is no longer available');

  const { data, error } = await createAdminClient()
    .from('coaching_sessions')
    .insert({
      tenant_id: pack.tenant_id,
      enrollment_id: pack.id,
      child_id: pack.child_id,
      coach_id: pack.coach_id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: 'booked',
      booked_by: userId,
    })
    .select('id, starts_at, ends_at, status, zoom_join_url')
    .single();
  if (error) {
    // 23P01: the no-double-booking rule; someone took the slot just now.
    return error.code === '23P01' ? fail(409, 'This time was just taken. Please choose another.') : fail(500, error.message);
  }
  return { ok: true, session: sessionView(data) };
}

async function ownSession(userId: string, sessionId: string) {
  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from('coaching_sessions')
    .select('id, enrollment_id, coach_id, starts_at, ends_at, status, zoom_join_url')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return null;
  const pack = await ownPack(userId, session.enrollment_id);
  return pack ? { session, pack } : null;
}

/** Moves a booked session to another free slot, up to 24 hours before it. */
export async function rescheduleSession(
  userId: string,
  sessionId: string,
  startsAt: string,
): Promise<{ ok: true; session: CoachingSession } | Fail> {
  if (!PARENT_SELF_SCHEDULING) return fail(403, TEAM_SCHEDULES);
  const found = await ownSession(userId, sessionId);
  if (!found) return fail(404, 'Session not found');
  const { session, pack } = found;
  if (session.status !== 'booked') return fail(409, 'Only an upcoming session can be moved');
  if (new Date(session.starts_at).getTime() - Date.now() < NOTICE_HOURS * 3600_000) {
    return fail(409, `A session can be moved up to ${NOTICE_HOURS} hours before it starts`);
  }
  const start = new Date(startsAt);
  if (isNaN(start.getTime())) return fail(400, 'Choose a time');
  const minutes = Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60_000);
  const end = new Date(start.getTime() + minutes * 60_000);
  const slots = await slotsForCoach(pack.tenant_id, session.coach_id, minutes, new Date(start.getTime() - 1), new Date(end.getTime() + 1), session.id);
  if (!isSlotIn(slots, start)) return fail(409, 'This time is no longer available');

  // One update: the session moves or nothing changes.
  const { data, error } = await createAdminClient()
    .from('coaching_sessions')
    .update({ starts_at: start.toISOString(), ends_at: end.toISOString(), updated_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('status', 'booked')
    .eq('starts_at', session.starts_at)
    .select('id, starts_at, ends_at, status, zoom_join_url')
    .maybeSingle();
  if (error) {
    return error.code === '23P01' ? fail(409, 'This time was just taken. Please choose another.') : fail(500, error.message);
  }
  if (!data) return fail(409, 'The session was just changed. Please refresh.');
  return { ok: true, session: sessionView(data) };
}

/**
 * Cancels a booked session. Up to 24 hours before: free, the session goes
 * back to the pack. Later: counted as used (late cancellation). Pass
 * `confirmLate: true` after showing the parent that warning.
 */
export async function cancelSession(
  userId: string,
  sessionId: string,
  options: { confirmLate?: boolean } = {},
): Promise<{ ok: true; status: 'cancelled' | 'late_cancelled' } | Fail | { ok: false; status: 409; error: string; needs_confirmation: true }> {
  if (!PARENT_SELF_SCHEDULING) return fail(403, TEAM_SCHEDULES);
  const found = await ownSession(userId, sessionId);
  if (!found) return fail(404, 'Session not found');
  const { session } = found;
  if (session.status !== 'booked') return fail(409, 'Only an upcoming session can be cancelled');
  if (new Date(session.starts_at).getTime() <= Date.now()) return fail(409, 'This session has already started');
  const late = new Date(session.starts_at).getTime() - Date.now() < NOTICE_HOURS * 3600_000;
  if (late && !options.confirmLate) {
    return { ok: false, status: 409, error: `Less than ${NOTICE_HOURS} hours before the session: cancelling now counts it as used.`, needs_confirmation: true };
  }
  const status = late ? 'late_cancelled' : 'cancelled';
  const { data, error } = await createAdminClient()
    .from('coaching_sessions')
    .update({ status, cancelled_at: new Date().toISOString(), cancelled_by: userId, updated_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('status', 'booked')
    .select('id')
    .maybeSingle();
  if (error) return fail(500, error.message);
  if (!data) return fail(409, 'The session was just changed. Please refresh.');
  return { ok: true, status };
}

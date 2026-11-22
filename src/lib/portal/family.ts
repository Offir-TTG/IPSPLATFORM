import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { getChildCoaching, listChildren, type CoachingPack } from '@/lib/family/coaching';
import { money } from './membership';
import { CHILD_COLORS, type ChildView, type CoachingSessionView, type CoachingView } from './familyTypes';

/**
 * A parent's children and their coaching, shaped for the portal screens.
 * The rules (what counts as used, what can still change) come from
 * lib/family/coaching; this file only adds wording, colours and payments.
 * Until 20261122_family_coaching.sql is run there are no children.
 */

const TZ = 'Asia/Jerusalem';
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, ...o }).format(new Date(iso));
const when = (iso: string) => `${fmt(iso, { weekday: 'short' })} ${fmt(iso, { day: 'numeric', month: 'numeric' })} · ${fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
const OWED = ['pending', 'failed', 'overdue', 'adjusted'];
const thisYear = () => Number(new Intl.DateTimeFormat('en', { timeZone: TZ, year: 'numeric' }).format(new Date()));

function sessionsOf(pack: CoachingPack): CoachingSessionView[] {
  // "מפגש 3": numbered in time order, skipping sessions cancelled in time (they return to the pack).
  const ordered = [...pack.sessions].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  let n = 0;
  return ordered.map((s) => {
    const counted = s.status !== 'cancelled';
    if (counted) n += 1;
    return {
      id: s.id,
      title: counted ? `מפגש ${n}` : 'מפגש שבוטל',
      when: when(s.starts_at),
      start: s.starts_at,
      end: s.ends_at,
      status: s.status === 'booked' ? 'upcoming' : (s.status as CoachingSessionView['status']),
      canChange: !!s.can_change,
      joinUrl: s.zoom_join_url ?? null,
      // Zoom links come later; show the place only when there is one.
      where: s.zoom_join_url ? 'בזום' : null,
    };
  });
}

export async function loadFamily(parentId: string): Promise<ChildView[]> {
  const listed = await listChildren(parentId).catch(() => null);
  if (!listed || !listed.ok || !listed.children.length) return [];

  const coaching = await Promise.all(listed.children.map((c) => getChildCoaching(parentId, c.id).catch(() => null)));
  const packs = coaching.flatMap((r) => (r && r.ok ? r.packs : []));
  const enrollmentIds = packs.map((p) => p.enrollment_id);

  // Payments and the coach's photo are read on their own (no joins).
  const admin = createAdminClient();
  const coachIds = [...new Set(packs.map((p) => p.coach?.id).filter(Boolean))] as string[];
  const [{ data: schedules }, { data: enrollmentRows }, { data: coaches }] = await Promise.all([
    enrollmentIds.length
      ? admin.from('payment_schedules').select('enrollment_id, amount, currency, scheduled_date, status, payment_number').in('enrollment_id', enrollmentIds)
      : Promise.resolve({ data: [] as any[] }),
    enrollmentIds.length ? admin.from('enrollments').select('id, product:products(price, currency)').in('id', enrollmentIds) : Promise.resolve({ data: [] as any[] }),
    coachIds.length ? admin.from('users').select('id, avatar_url').in('id', coachIds) : Promise.resolve({ data: [] as any[] }),
  ]);

  const toView = (p: CoachingPack): CoachingView => {
    const sessions = sessionsOf(p);
    const now = Date.now();
    const next = sessions.find((s) => s.status === 'upcoming' && +new Date(s.end) > now) ?? null;
    const row: any = (enrollmentRows ?? []).find((e: any) => e.id === p.enrollment_id);
    const product = Array.isArray(row?.product) ? row.product[0] : row?.product;
    const rows = (schedules ?? []).filter((s: any) => s.enrollment_id === p.enrollment_id && s.status !== 'cancelled').sort((a: any, b: any) => a.payment_number - b.payment_number);
    const paid = rows.filter((s: any) => s.status === 'paid').length;
    const nextDue = rows.find((s: any) => OWED.includes(s.status));
    const currency = product?.currency || rows[0]?.currency || 'USD';
    const coachPhoto = (coaches ?? []).find((u: any) => u.id === p.coach?.id)?.avatar_url ?? null;
    return {
      enrollmentId: p.enrollment_id,
      title: p.product_title || 'אימון',
      coach: p.coach ? { name: p.coach.name, avatarUrl: coachPhoto } : null,
      used: p.sessions_used,
      total: p.sessions_total ?? 0,
      left: p.sessions_left,
      next,
      // Newest first in the list.
      sessions: [...sessions].reverse(),
      payment: {
        packageLabel: [p.sessions_total ? `${p.sessions_total} מפגשים` : null, product?.price ? money(Number(product.price), currency) : null].filter(Boolean).join(' · '),
        paidLabel: rows.length ? `${paid} מתוך ${rows.length} שולמו` : 'אין תשלומים',
        nextLabel: nextDue ? `${money(Number(nextDue.amount), nextDue.currency || currency)} · ${fmt(nextDue.scheduled_date, { day: '2-digit', month: '2-digit' })}` : null,
      },
      sessionMinutes: p.session_minutes,
      canBook: p.can_book,
      intakeStatus: p.intake_status ?? 'not_needed',
      // Packs waiting for the parent to finish enrolling (fields arriving in lib/family/coaching).
      awaitingEnrollment: !!(p as { awaiting_enrollment?: boolean }).awaiting_enrollment,
      enrollmentUrl: (p as { enrollment_url?: string | null }).enrollment_url ?? null,
    };
  };

  return listed.children.map((c, i) => {
    const r = coaching[i];
    const ok = r && r.ok ? r : null;
    return {
      id: c.id,
      firstName: c.first_name,
      age: c.birth_year ? thisYear() - c.birth_year : null,
      color: CHILD_COLORS[i % CHILD_COLORS.length],
      coaching: ok ? ok.packs.map(toView) : [],
      pendingRequest: ok?.open_request ? { createdAt: '' } : null,
    };
  });
}

/** Each child's coaching sessions in a time range, for the calendar. */
export async function loadFamilySessions(parentId: string, from: Date, to: Date) {
  const kids = await loadFamily(parentId);
  return kids.flatMap((k) =>
    k.coaching.flatMap((c) =>
      c.sessions
        .filter((s) => s.status === 'upcoming' || s.status === 'done')
        .filter((s) => new Date(s.end) >= from && new Date(s.start) <= to)
        .map((s) => ({ child: k, coaching: c, session: s }))
    )
  );
}

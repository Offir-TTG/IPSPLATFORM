import 'server-only';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { lessonEnd, loadClientLearning } from '@/lib/portal/clientLearning';
import { money } from '@/lib/portal/membership';
import { loadClubOffers } from '@/lib/portal/clubOffers';
import { loadMembershipView } from '@/lib/portal/membership';

/**
 * Everything the client home needs, loaded on the server in one pass.
 *
 * Reads use the admin client scoped to the signed-in user's own id (the same
 * pattern withAuth uses), because the `users` RLS depends on a tenant setting
 * that server requests don't carry.
 */

const TZ = 'Asia/Jerusalem';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;


export type HomeSession = {
  lessonId: string;
  courseId: string;
  title: string;
  courseTitle: string;
  start: string;
  end: string;
  joinUrl: string | null;
  color: string;
};

export type HomeSpace = {
  key: string;
  kind: 'program' | 'club' | 'coaching';
  title: string;
  kicker: string;
  color: string;
  /** The product's own picture (metadata.image_url); the course or program inside isn't used. */
  imageUrl: string | null;
  href: string;
  tag: string | null;
  line: string;
  progress: number | null;
  /** A club membership's status, the same words as its "המנוי שלי" card. */
  status?: { label: string; tone: 'ok' | 'warn' | 'off' } | null;
};

export type HomeItem = {
  key: string;
  kind: 'course' | 'lecture';
  title: string;
  sub: string;
  short: string;
  href: string;
  progress: number | null;
  tag: string | null;
  action: string;
  color: string;
};

export type HomeChip = { key: string; label: string; href: string; icon: 'video' | 'megaphone' | 'card' | 'task' | 'bell' };

export type HomeNotice = { id: string; title: string; message: string; href: string | null };

export type HomeFocus =
  | { type: 'live'; eyebrow: string; title: string; meta: string[]; start: string; end: string; joinUrl: string | null; courseHref: string; calendarUrl: string }
  | { type: 'continue'; eyebrow: string; title: string; meta: string[]; href: string; progress: number }
  | null;

export type HomeData = {
  firstName: string;
  orgName: string;
  greeting: string;
  dateLabel: string;
  focus: HomeFocus;
  chips: HomeChip[];
  updatesCount: number;
  /** Lessons done across all the client's courses, in percent (null with no lessons). */
  overall: number | null;
  notice: HomeNotice | null;
  spaces: HomeSpace[];
  items: HomeItem[];
  week: (HomeSession & { dayLabel: string; isToday: boolean; sub: string })[];
};

const fmt = (iso: string | Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('he-IL', { timeZone: TZ, ...opts }).format(new Date(iso));
const time = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false });
const dayKey = (iso: string | Date) => fmt(iso, { year: 'numeric', month: '2-digit', day: '2-digit' });
const shortDay = (iso: string) => {
  const d = fmt(iso, { weekday: 'short' }).replace('יום ', '');
  return `${d} ${fmt(iso, { day: 'numeric', month: 'numeric' })}`;
};

function greetingFor(now: Date) {
  const h = Number(fmt(now, { hour: 'numeric', hour12: false }));
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

function googleCalendarUrl(title: string, startIso: string, endIso: string, details: string) {
  const z = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${z(startIso)}/${z(endIso)}`, details });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// "שיעור 9, להציב גבולות" — unless the lesson title already says which lesson it is.
const nextLabel = (next: { lesson: any; n: number }) =>
  /^שיעור\s*\d/.test(next.lesson.title ?? '') ? next.lesson.title : `שיעור ${next.n}, ${next.lesson.title}`;


export async function loadHomeData(userId: string): Promise<HomeData> {
  const admin = createAdminClient();
  const now = new Date();

  const learning = await loadClientLearning(userId);
  const { enrollments, programs, programCourses, courseIds, courseById, lessonsByCourse, doneLessons, colorOf } = learning;

  const [{ data: userRow }, { data: schedules }, notificationsRes] = await Promise.all([
    admin.from('users').select('first_name, tenant:tenants(name)').eq('id', userId).maybeSingle(),
    enrollments.length
      ? admin
          .from('payment_schedules')
          .select('id, enrollment_id, amount, currency, scheduled_date, status')
          .in('enrollment_id', enrollments.map((e) => e.id))
          .in('status', ['pending', 'failed', 'overdue', 'adjusted'])
          .order('scheduled_date', { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] as any[] }),
    (async () => {
      // The RPC takes the user id as a parameter; always pass the verified one.
      const supabase = await createClient();
      return supabase.rpc('get_user_notifications', {
        p_user_id: userId,
        p_limit: 10,
        p_offset: 0,
        p_category: null,
        p_priority: null,
        p_unread_only: true,
      });
    })(),
  ]);

  const progressOf = (courseId: string) => {
    const ls = lessonsByCourse.get(courseId) ?? [];
    const done = ls.filter((l) => doneLessons.has(l.id)).length;
    const nextIndex = ls.findIndex((l) => !doneLessons.has(l.id));
    return { total: ls.length, done, pct: ls.length ? Math.round((done / ls.length) * 100) : 0, next: nextIndex >= 0 ? { lesson: ls[nextIndex], n: nextIndex + 1 } : null };
  };
  const recentRecording = (courseId: string) =>
    (lessonsByCourse.get(courseId) ?? []).find((l) => l.recording_url && l.start_time && now.getTime() - new Date(l.start_time).getTime() < 7 * DAY);
  const nextMeeting = (courseId: string) =>
    (lessonsByCourse.get(courseId) ?? [])
      .filter((l) => l.start_time && lessonEnd(l).getTime() > now.getTime())
      .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))[0];
  const whenLabel = (iso: string) =>
    dayKey(iso) === dayKey(now) ? `הערב · ${time(iso)}` : `${fmt(iso, { weekday: 'long' })} ${fmt(iso, { day: 'numeric', month: 'numeric' })} · ${time(iso)}`;

  // Spaces: programs and clubs (memberships). Everything else is a course or lecture.
  const spaces: HomeSpace[] = [];
  const items: HomeItem[] = [];
  const programOfCourse = new Map<string, string>();

  for (const e of enrollments) {
    const p = e.product;
    if (p.type === 'program' && p.program_id) {
      const program = (programs ?? []).find((x: any) => x.id === p.program_id);
      const pcs = (programCourses ?? []).filter((pc: any) => pc.program_id === p.program_id).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      pcs.forEach((pc: any) => programOfCourse.set(pc.course_id, p.program_id));
      const required = pcs.filter((pc: any) => pc.is_required !== false);
      const stats = required.map((pc: any) => progressOf(pc.course_id));
      const finished = stats.filter((s) => s.total > 0 && s.done === s.total).length;
      const current = pcs.find((pc: any) => { const s = progressOf(pc.course_id); return s.total > 0 && s.done < s.total; });
      const avg = stats.length ? Math.round(stats.reduce((a, s) => a + s.pct, 0) / stats.length) : 0;
      const color = colorOf(`program:${p.program_id}`);
      spaces.push({
        key: e.id,
        kind: 'program',
        title: program?.name ?? p.title,
        kicker: 'תוכנית',
        color,
        imageUrl: p.metadata?.image_url || null,
        href: `/programs/${p.program_id}`,
        tag: null,
        line: `${finished} מתוך ${required.length} קורסי חובה${current ? ` · עכשיו: ${courseById.get(current.course_id)?.title ?? ''}` : ''}`,
        progress: avg,
      });
      continue;
    }
    if (!p.course_id) continue;
    const course: any = courseById.get(p.course_id);
    if (!course) continue;
    const prog = progressOf(p.course_id);
    if (p.payment_model === 'subscription') {
      const meeting = nextMeeting(p.course_id);
      const membership = await loadMembershipView(userId, e.id, '', '').catch(() => null);
      spaces.push({
        // A bundle gives several entries for one enrollment: the course keeps keys unique.
        key: `${e.id}:${p.course_id}`,
        kind: 'club',
        title: p.club_name ?? course.title,
        kicker: 'מועדון',
        color: colorOf(`course:${p.course_id}`),
        imageUrl: p.metadata?.image_url || null,
        href: `/clubs/${p.course_id}`,
        tag: recentRecording(p.course_id) ? 'הקלטה חדשה' : null,
        line: meeting ? `המפגש הבא · ${whenLabel(meeting.start_time)}` : 'מפגש חדש יפורסם בקרוב',
        progress: null,
        status: membership ? { label: membership.status, tone: membership.tone } : null,
      });
      continue;
    }
    const isLecture = course.course_type === 'lecture' || p.type === 'lecture';
    const color = colorOf(`course:${p.course_id}`);
    if (isLecture) {
      const meeting = nextMeeting(p.course_id);
      const rec = (lessonsByCourse.get(p.course_id) ?? []).find((l) => l.recording_url);
      items.push({
        key: `${e.id}:${p.course_id}`,
        kind: 'lecture',
        // The name the client enrolled under (a bundle's courses keep their own names).
        title: p.from_bundle ? course.title : p.title || course.title,
        sub: meeting ? `הרצאה חיה · ${whenLabel(meeting.start_time)}` : rec ? 'הרצאה מוקלטת' : 'הרצאה',
        short: meeting ? `הרצאה חיה · ${whenLabel(meeting.start_time)}` : rec ? 'ההקלטה מוכנה' : 'הרצאה',
        href: `/courses/${p.course_id}`,
        progress: null,
        tag: !meeting && rec ? 'ההקלטה מוכנה' : null,
        action: !meeting && rec ? 'לצפייה' : 'פרטים',
        color,
      });
    } else {
      items.push({
        key: `${e.id}:${p.course_id}`,
        kind: 'course',
        title: p.from_bundle ? course.title : p.title || course.title,
        sub: prog.next ? `קורס · הבא: ${nextLabel(prog.next)}` : prog.total ? 'קורס · הושלם' : 'קורס',
        short: prog.next ? `${prog.pct}% · הבא: שיעור ${prog.next.n}` : prog.total ? 'הושלם' : 'קורס',
        href: `/courses/${p.course_id}`,
        progress: prog.total ? prog.pct : null,
        tag: null,
        action: prog.total && prog.done === prog.total ? 'לחזרה' : prog.done ? 'המשך' : 'התחלה',
        color,
      });
    }
  }

  // Clubs the client hasn't joined: opening one starts the enrollment.
  for (const o of await loadClubOffers(userId, courseIds)) {
    spaces.push({
      key: `offer:${o.productId}`,
      kind: 'club',
      title: o.title,
      kicker: 'מועדון',
      color: o.color,
      imageUrl: o.imageUrl,
      href: `/clubs/${o.courseId}`,
      tag: o.enrollmentUrl ? 'נשאר להשלים' : 'הצטרפות',
      line: o.enrollmentUrl ? 'נשאר להשלים את ההרשמה' : [o.priceLine, 'להצטרפות'].filter(Boolean).join(' · '),
      progress: null,
    });
  }

  // Upcoming live sessions across everything the client can enter.
  const colorOfCourse = (courseId: string) => {
    const programId = programOfCourse.get(courseId);
    return programId ? colorOf(`program:${programId}`) : colorOf(`course:${courseId}`);
  };
  const sessions: HomeSession[] = [];
  for (const [courseId, ls] of lessonsByCourse) {
    for (const l of ls) {
      if (!l.start_time) continue;
      const start = new Date(l.start_time);
      const end = lessonEnd(l);
      if (end.getTime() + 3 * HOUR < now.getTime() || start.getTime() > now.getTime() + 7 * DAY) continue;
      sessions.push({
        lessonId: l.id,
        courseId,
        title: l.title,
        courseTitle: courseById.get(courseId)?.title ?? '',
        start: start.toISOString(),
        end: end.toISOString(),
        joinUrl: l.zoom_join_url ?? null,
        color: colorOfCourse(courseId),
      });
    }
  }
  sessions.sort((a, b) => +new Date(a.start) - +new Date(b.start));

  // The one thing that matters most right now.
  let focus: HomeFocus = null;
  const soon = sessions.find((s) => new Date(s.start).getTime() - now.getTime() < DAY && new Date(s.end).getTime() + 3 * HOUR > now.getTime());
  if (soon) {
    const eyebrowWhen = dayKey(soon.start) === dayKey(now) ? (Number(fmt(soon.start, { hour: 'numeric', hour12: false })) >= 17 ? 'הערב' : 'היום') : 'מחר';
    focus = {
      type: 'live',
      eyebrow: `${eyebrowWhen} ב${soon.courseTitle}`,
      title: soon.title,
      meta: [`${time(soon.start)}–${time(soon.end)}`, soon.courseTitle],
      start: soon.start,
      end: soon.end,
      joinUrl: soon.joinUrl,
      courseHref: `/courses/${soon.courseId}?lesson=${soon.lessonId}`,
      calendarUrl: googleCalendarUrl(soon.title, soon.start, soon.end, soon.courseTitle),
    };
  } else {
    const inProgress = courseIds
      .map((id) => ({ id, s: progressOf(id) }))
      .filter((x) => x.s.next && x.s.done > 0)
      .sort((a, b) => b.s.pct - a.s.pct)[0];
    if (inProgress?.s.next) {
      const title = courseById.get(inProgress.id)?.title ?? '';
      focus = {
        type: 'continue',
        eyebrow: `הבא בתור · ${title}`,
        title: inProgress.s.next.lesson.title,
        meta: [`שיעור ${inProgress.s.next.n} מתוך ${inProgress.s.total}`],
        href: `/courses/${inProgress.id}?lesson=${inProgress.s.next.lesson.id}`,
        progress: inProgress.s.pct,
      };
    }
  }

  // Quick glance: recordings, the next payment, and unread notices.
  const notifications: any[] = (notificationsRes as any)?.data ?? [];
  // The home card shows only notifications the admin sent as a home-page card.
  // The RPC doesn't return the style, so read it for these ids; without the
  // column yet, everything counts as 'list' and no card shows.
  let homeCardIds = new Set<string>();
  if (notifications.length) {
    const { data: styles, error: styleError } = await admin.from('notifications').select('id, display_style').in('id', notifications.map((n) => n.id));
    if (!styleError) homeCardIds = new Set((styles ?? []).filter((x: any) => x.display_style === 'home_card').map((x: any) => x.id));
  }
  const announcement = notifications.find((n) => homeCardIds.has(n.id));
  const chips: HomeChip[] = [];
  for (const courseId of courseIds) {
    const rec = recentRecording(courseId);
    if (rec) chips.push({ key: `rec-${rec.id}`, label: `הקלטה מוכנה: ׳${rec.title}׳`, href: `/courses/${courseId}?lesson=${rec.id}`, icon: 'video' });
  }
  const nextDue = (schedules ?? []).find((s: any) => new Date(s.scheduled_date).getTime() - now.getTime() < 30 * DAY);
  if (nextDue) {
    chips.push({ key: `pay-${nextDue.id}`, label: `תשלום קרוב: ${money(Number(nextDue.amount), nextDue.currency || 'USD')} · ${fmt(nextDue.scheduled_date, { day: 'numeric', month: 'numeric' })}`, href: '/billing', icon: 'card' });
  }
  for (const n of notifications) {
    if (n.id === announcement?.id) continue;
    chips.push({
      key: `n-${n.id}`,
      label: n.category === 'assignment' ? `להגשה: ${n.title}` : n.title,
      href: n.action_url || '/notifications',
      icon: n.category === 'assignment' ? 'task' : n.category === 'announcement' ? 'megaphone' : 'bell',
    });
  }

  const todayKey = dayKey(now);
  const totals = courseIds.reduce((a, id) => {
    const st = progressOf(id);
    return { done: a.done + st.done, total: a.total + st.total };
  }, { done: 0, total: 0 });
  return {
    firstName: (userRow as any)?.first_name || '',
    orgName: ([] as any[]).concat((userRow as any)?.tenant ?? [])[0]?.name || '',
    greeting: greetingFor(now),
    dateLabel: fmt(now, { weekday: 'long', day: 'numeric', month: 'long' }),
    focus,
    chips: chips.slice(0, 4),
    updatesCount: chips.length + (announcement ? 1 : 0),
    overall: totals.total ? Math.round((totals.done / totals.total) * 100) : null,
    notice: announcement ? { id: announcement.id, title: announcement.title, message: announcement.message, href: announcement.action_url || null } : null,
    spaces,
    items,
    week: sessions.slice(0, 6).map((s) => ({
      ...s,
      isToday: dayKey(s.start) === todayKey,
      dayLabel: dayKey(s.start) === todayKey ? `${shortDay(s.start)} · היום` : shortDay(s.start),
      sub: `${s.courseTitle} · ${time(s.start)}`,
    })),
  };
}

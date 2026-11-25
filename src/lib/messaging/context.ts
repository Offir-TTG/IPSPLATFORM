/**
 * Turns a reminder case's raw details (dates, amounts, ids) into the words a
 * message fills in, in the client's language and time zone, and the link
 * its button opens.
 */

import { formatInTimezone } from '@/lib/datetime/timezone';

/** What a source stores on a run. All optional; each event uses some. */
export interface CaseContext {
  lesson?: string;
  course?: string;
  courseId?: string;
  lessonId?: string;
  startsAt?: string;
  amount?: number;
  currency?: string;
  product?: string;
  productId?: string;
  paymentNo?: string;
  nextRetryAt?: string;
  blockAt?: string;
  child?: string;
  childId?: string;
  enrollmentId?: string;
  enrollToken?: string;
  assignment?: string;
  dueAt?: string;
  oldPrice?: number;
  newPrice?: number;
  effectiveAt?: string;
  cardExpiresAt?: string;
  change?: 'booked' | 'moved' | 'cancelled';
  sessions?: number;
  client?: string;
  adminUrl?: string;
  [key: string]: unknown;
}

export interface Formatting {
  lang: 'he' | 'en';
  timezone: string;
  /** The school's currency (business settings), used when a case has none. */
  currency: string;
}

function money(amount: number | undefined, currency: string | undefined, f: Formatting): string {
  if (amount == null || Number.isNaN(amount)) return '';
  try {
    return new Intl.NumberFormat(f.lang === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: (currency || f.currency || 'USD').toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency ?? ''}`.trim();
  }
}

function day(iso: string | undefined, f: Formatting): string {
  if (!iso) return '';
  return formatInTimezone(iso, f.timezone, { day: 'numeric', month: 'numeric' }, f.lang === 'he' ? 'he-IL' : 'en-US');
}

function clock(iso: string | undefined, f: Formatting): string {
  if (!iso) return '';
  return formatInTimezone(iso, f.timezone, { hour: '2-digit', minute: '2-digit', hour12: false }, f.lang === 'he' ? 'he-IL' : 'en-US');
}

function longWhen(iso: string | undefined, f: Formatting): string {
  if (!iso) return '';
  const weekday = formatInTimezone(iso, f.timezone, { weekday: 'long' }, f.lang === 'he' ? 'he-IL' : 'en-US');
  return f.lang === 'he' ? `${weekday}, ${day(iso, f)} בשעה ${clock(iso, f)}` : `${weekday}, ${day(iso, f)} at ${clock(iso, f)}`;
}

/** Placeholder key → words, for one client. */
export function placeholderValues(ctx: CaseContext, firstName: string, f: Formatting): Record<string, string> {
  const when = ctx.startsAt || ctx.dueAt || ctx.effectiveAt || ctx.cardExpiresAt;
  const changed =
    ctx.change === 'booked'
      ? f.lang === 'he'
        ? `נקבע ל${longWhen(ctx.startsAt, f)}`
        : `booked for ${longWhen(ctx.startsAt, f)}`
      : ctx.change === 'cancelled'
      ? f.lang === 'he'
        ? 'בוטל'
        : 'cancelled'
      : ctx.change === 'moved'
        ? f.lang === 'he'
          ? `הוזז ל-${day(ctx.startsAt, f)} בשעה ${clock(ctx.startsAt, f)}`
          : `moved to ${day(ctx.startsAt, f)} at ${clock(ctx.startsAt, f)}`
        : '';
  return {
    name: firstName,
    lesson: ctx.lesson ?? '',
    course: ctx.course ?? '',
    date: day(when, f),
    time: clock(ctx.startsAt || ctx.dueAt, f),
    when: longWhen(ctx.startsAt, f),
    amount: money(ctx.amount, ctx.currency, f),
    product: ctx.product ?? '',
    payment_no: ctx.paymentNo ?? '',
    next_retry: day(ctx.nextRetryAt, f),
    block_date: day(ctx.blockAt, f),
    child: ctx.child ?? '',
    assignment: ctx.assignment ?? '',
    old_price: money(ctx.oldPrice, ctx.currency, f),
    new_price: money(ctx.newPrice, ctx.currency, f),
    change: changed,
    client: ctx.client ?? '',
    session: ctx.child
      ? f.lang === 'he'
        ? `המפגש של ${ctx.child}`
        : `${ctx.child}'s session`
      : f.lang === 'he'
        ? 'מפגש הליווי'
        : 'The coaching session',
    count: ctx.sessions != null ? String(ctx.sessions) : '',
  };
}

/** The portal path (or admin path) a step's button opens. */
export function actionPath(actionKey: string | null | undefined, ctx: CaseContext): string | null {
  switch (actionKey) {
    case 'update_card':
      return '/billing/card';
    case 'billing':
      return '/billing';
    // The course page opens the meeting itself from ?lesson=, and moves to the
    // club or program page the course belongs to, keeping the meeting open.
    case 'join':
    case 'recording':
      return ctx.courseId ? `/courses/${ctx.courseId}${ctx.lessonId ? `?lesson=${ctx.lessonId}` : ''}` : '/courses';
    case 'assignment':
      return ctx.courseId ? `/courses/${ctx.courseId}` : '/courses';
    case 'coaching':
      return ctx.childId ? `/children/${ctx.childId}` : ctx.enrollmentId ? `/coaching/${ctx.enrollmentId}` : '/coaching';
    case 'offer':
      return ctx.childId ? `/children/${ctx.childId}` : ctx.enrollmentId ? `/coaching/${ctx.enrollmentId}?tab=package` : '/coaching';
    case 'intake':
      return ctx.childId ? `/children/${ctx.childId}` : '/children';
    case 'enroll':
      return ctx.enrollToken ? `/enroll/${ctx.enrollToken}` : '/dashboard';
    case 'certificate':
    case 'portal':
      return '/dashboard';
    case 'admin':
      return ctx.adminUrl ?? '/admin';
    default:
      return null;
  }
}

import 'server-only';
import { getSubscriptionSummary, type SubscriptionSummary } from '@/lib/payments/clientPayments';

/**
 * How a membership reads on screen, built from the payment rules' summary.
 * Used by the payments page and by each club's own space.
 */

const TZ = 'Asia/Jerusalem';
const date = (iso: string) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(new Date(iso));
export const money = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
const isYearly = (interval: string) => interval === 'yearly' || interval === 'annual' || interval === 'year';
const per = (interval: string) => (isYearly(interval) ? 'לשנה' : 'לחודש');

export type MembershipView = {
  enrollmentId: string;
  title: string;
  color: string;
  /** "₪49 לחודש · החיוב הבא 01.12" */
  line: string;
  status: string;
  tone: 'ok' | 'warn' | 'off';
  /** Shown when the membership is stopped or paused, beside the resume button. */
  note: string | null;
  planLabel: string;
  dateLabel: string | null;
  dateValue: string | null;
  endsLabel: string | null;
  canStop: boolean;
  canResume: boolean;
  canPause: boolean;
  canSwitch: boolean;
  switchTo: { planId: string; title: string; sub: string }[];
};

export async function loadMembershipView(userId: string, enrollmentId: string, title: string, color: string): Promise<MembershipView | null> {
  const s = await getSubscriptionSummary(userId, enrollmentId);
  if (!s.ok) return null;
  const price = `${money(s.amount, s.currency)} ${per(s.interval)}`;
  const ends = s.ends_at ? date(s.ends_at) : s.paid_through ? date(s.paid_through) : null;
  const pausedUntil = s.paused_until ? date(s.paused_until) : null;
  const pausedFrom = s.paused_from ? date(s.paused_from) : null;
  const next = s.next_charge_date ? date(s.next_charge_date) : null;

  const view: Record<SubscriptionSummary['state'], Pick<MembershipView, 'line' | 'status' | 'tone' | 'note' | 'dateLabel' | 'dateValue'>> = {
    active: { line: next ? `${price} · החיוב הבא ${next}` : price, status: 'פעיל', tone: 'ok', note: null, dateLabel: 'החיוב הבא', dateValue: next },
    past_due: { line: `${price} · יש תשלום פתוח`, status: 'ממתין לתשלום', tone: 'warn', note: null, dateLabel: 'תשלום פתוח', dateValue: next },
    ending: {
      line: `${price} · אין חיובים נוספים`,
      status: ends ? `מסתיים ב-${ends}` : 'מסתיים',
      tone: 'warn',
      note: `המנוי הופסק ויישאר פעיל${ends ? ` עד ${ends}` : ''}. חידוש מחזיר אותו בלי לאבד דבר.`,
      dateLabel: 'פעיל עד',
      dateValue: ends,
    },
    paused: {
      line: `${price} · לא יחויב${pausedUntil ? ` עד ${pausedUntil}` : ''}`,
      status: pausedUntil ? `מושהה עד ${pausedUntil}` : 'מושהה',
      tone: 'warn',
      note: `המנוי מושהה${pausedUntil ? ` ויחזור לבד ב-${pausedUntil}` : ''}. אפשר להחזיר אותו כבר עכשיו.`,
      dateLabel: 'יחזור לפעול',
      dateValue: pausedUntil,
    },
    pause_scheduled: {
      line: `${price} · השהיה מ-${pausedFrom ?? ''}${pausedUntil ? ` עד ${pausedUntil}` : ''}`,
      status: 'השהיה מתוכננת',
      tone: 'warn',
      note: `החודש הבא מושהה${pausedFrom ? ` מ-${pausedFrom}` : ''}${pausedUntil ? ` עד ${pausedUntil}` : ''}, בלי חיוב. אפשר לבטל את ההשהיה.`,
      dateLabel: 'ההשהיה מתחילה',
      dateValue: pausedFrom,
    },
    cancelled: { line: `${price} · אין חיובים נוספים`, status: 'הסתיים', tone: 'off', note: null, dateLabel: null, dateValue: null },
  };

  return {
    enrollmentId,
    title,
    color,
    ...view[s.state],
    planLabel: `${isYearly(s.interval) ? 'שנתי' : 'חודשי'} · ${money(s.amount, s.currency)}`,
    endsLabel: ends,
    canStop: s.can_stop,
    canResume: s.can_resume,
    canPause: s.can_pause,
    canSwitch: !!s.can_switch,
    switchTo: (s.plans ?? [])
      .filter((p) => !p.current)
      .map((p) => ({
        planId: p.plan_id,
        title: `מעבר למנוי ${isYearly(p.interval) ? 'שנתי' : 'חודשי'}`,
        sub: `${money(p.amount, s.currency)} ${per(p.interval)}, מהחיוב הבא`,
      })),
  };
}

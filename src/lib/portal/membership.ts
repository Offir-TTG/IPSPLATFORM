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
/**
 * A scheduled price change: "מתאריך ה 1.1.2027 התשלום לחודש יהיה $50".
 * The date and the price are each isolated (left to right) so they never
 * flip inside the Hebrew sentence. `when` is a date (YYYY-MM-DD) or timestamp.
 */
export function upcomingPriceLine(when: string, amount: number, currency: string, interval: string) {
  const d = new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: 'numeric', month: 'numeric', year: 'numeric' }).format(
    new Date(/^\d{4}-\d{2}-\d{2}$/.test(when) ? `${when}T12:00:00Z` : when),
  );
  return `מתאריך ה ${isolate(d)} התשלום ${per(interval)} יהיה ${priceLabel(amount, currency)}`;
}
/** Wraps text so it keeps its own (left-to-right) order inside a Hebrew sentence. */
const isolate = (text: string) => `⁦${text}⁩`;
/** A membership price as written in the club's texts: "$29.99", isolated so it never flips. */
export const priceLabel = (amount: number, currency = 'USD') =>
  isolate(
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase(),
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: amount % 1 ? 2 : 0,
    }).format(amount),
  );
const isYearly = (interval: string) => ['yearly', 'annual', 'annually', 'year'].includes(interval);
const per = (interval: string) => (isYearly(interval) ? 'לשנה' : 'לחודש');

export type MembershipView = {
  enrollmentId: string;
  title: string;
  color: string;
  /** "₪49 לחודש · החיוב הבא 01.12" */
  line: string;
  /** A scheduled price change still ahead for this member: "מהחיוב ב-01.01: ₪40 לחודש". */
  upcomingLine: string | null;
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
    upcomingLine: s.upcoming_price
      ? upcomingPriceLine(s.upcoming_price.effective_date, s.upcoming_price.amount, s.currency, s.interval)
      : null,
    planLabel: `${isYearly(s.interval) ? 'שנתי' : 'חודשי'} · ${priceLabel(s.amount, s.currency)}`,
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

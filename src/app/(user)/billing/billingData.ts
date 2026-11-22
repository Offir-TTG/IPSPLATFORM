import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { isDue, nextChargeable, type ScheduleRow } from '@/lib/payments/dueSchedules';
import { loadMembershipView, money, type MembershipView } from '@/lib/portal/membership';

/**
 * Everything the "payments and memberships" page shows, read on the server
 * for the signed-in user only. Card details are never stored here; the page
 * reads them live from Stripe.
 */

const TZ = 'Asia/Jerusalem';
const DAY = 24 * 60 * 60 * 1000;
const SPACE_COLORS = ['#4f3a9c', '#8a3f86', '#6b4bb5', '#3f4c9a', '#7a4a9a', '#5b3a7e'];
const OWED = new Set(['pending', 'failed', 'overdue', 'adjusted', 'processing']);

const date = (iso: string) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(new Date(iso));
const fullDate = (iso: string) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
const year = (d: Date) => new Intl.DateTimeFormat('en', { timeZone: TZ, year: 'numeric' }).format(d);

export type BillingSub = MembershipView;

export type BillingDue = {
  scheduleId: string;
  what: string;
  when: string;
  sum: string;
  state: 'pay' | 'auto' | 'processing';
  overdue: boolean;
};

export type BillingHistory = {
  key: string;
  what: string;
  date: string;
  sum: string;
  refunded: string | null;
  invoiceId: string | null;
};

export type BillingPlanRow = { key: string; label: string; date: string; sum: string; status: string; tone: 'ok' | 'warn' | 'off' | 'due' };

export type BillingPlan = {
  enrollmentId: string;
  title: string;
  color: string;
  paidLabel: string;
  remainingLabel: string;
  progress: number;
  rows: BillingPlanRow[];
};

export type BillingData = {
  dueTotal: string;
  paidTotal: string;
  subs: BillingSub[];
  due: BillingDue[];
  history: BillingHistory[];
  plans: BillingPlan[];
};

const STATUS_LABEL: Record<string, [string, BillingPlanRow['tone']]> = {
  paid: ['שולם', 'ok'],
  pending: ['ממתין', 'due'],
  adjusted: ['ממתין · תאריך עודכן', 'due'],
  processing: ['בעיבוד', 'warn'],
  failed: ['החיוב נכשל', 'warn'],
  overdue: ['באיחור', 'warn'],
  paused: ['מושהה', 'off'],
  cancelled: ['בוטל', 'off'],
  refunded: ['הוחזר', 'off'],
  waived: ['בוטל החיוב', 'off'],
};

export async function loadBillingData(userId: string): Promise<BillingData> {
  const admin = createAdminClient();
  const now = new Date();

  const { data: enrollmentRows } = await admin
    .from('enrollments')
    .select('id, status, is_parent, currency, total_amount, paid_amount, product:products(id, title, type, payment_model, course_id, program_id)')
    .eq('user_id', userId)
    .in('status', ['active', 'suspended', 'completed', 'cancelled']);

  // A "parent" enrollment is paid by another account; it isn't this client's bill.
  const enrollments = (enrollmentRows ?? [])
    .filter((e: any) => !e.is_parent)
    .map((e: any) => ({ ...e, product: Array.isArray(e.product) ? e.product[0] : e.product }))
    .filter((e: any) => e.product);
  const ids = enrollments.map((e: any) => e.id as string);

  // Schedules and payments are read separately: there is no join to enrollments.
  const [{ data: scheduleRows }, { data: paymentRows }] = ids.length
    ? await Promise.all([
        admin.from('payment_schedules').select('*').in('enrollment_id', ids),
        admin
          .from('payments')
          .select('id, enrollment_id, amount, currency, status, paid_at, created_at, payment_schedule_id, stripe_invoice_id, refunded_amount, installment_number, payment_type')
          .in('enrollment_id', ids),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const schedulesBy = new Map<string, any[]>();
  for (const s of scheduleRows ?? []) {
    const arr = schedulesBy.get(s.enrollment_id) ?? [];
    arr.push(s);
    schedulesBy.set(s.enrollment_id, arr);
  }
  for (const arr of schedulesBy.values()) arr.sort((a, b) => a.payment_number - b.payment_number);

  // A child's coaching is named after the child ("נועה · אימון CBT"). Read on its own so the
  // page still works on a database without the family tables yet.
  const childNameOf = new Map<string, string>();
  if (ids.length) {
    const { data: links, error: linkError } = await admin.from('enrollments').select('id, child_id').in('id', ids).not('child_id', 'is', null);
    if (!linkError && links?.length) {
      const { data: kids } = await admin.from('children').select('id, first_name').in('id', links.map((l: any) => l.child_id));
      for (const l of links) {
        const k: any = (kids ?? []).find((x: any) => x.id === l.child_id);
        if (k) childNameOf.set(l.id, k.first_name);
      }
    }
  }
  const titleOf = (e: any) => [childNameOf.get(e.id), e.product?.title].filter(Boolean).join(' · ');
  const colorOf = new Map<string, string>();
  enrollments.forEach((e: any, i: number) => colorOf.set(e.id, SPACE_COLORS[i % SPACE_COLORS.length]));

  // Memberships.
  const subs: BillingSub[] = [];
  for (const e of enrollments) {
    if (e.product.payment_model !== 'subscription') continue;
    const m = await loadMembershipView(userId, e.id, titleOf(e), colorOf.get(e.id)!);
    if (m) subs.push(m);
  }

  // Upcoming payments: owed schedules, earliest first.
  const due: BillingDue[] = [];
  let dueSum = 0;
  let dueCurrency = 'USD';
  for (const e of enrollments) {
    if (!['active', 'suspended'].includes(e.status)) continue;
    const rows = schedulesBy.get(e.id) ?? [];
    const payable = nextChargeable(rows as ScheduleRow[], now);
    const total = rows.length;
    for (const s of rows) {
      if (!OWED.has(s.status)) continue;
      const when = new Date(s.scheduled_date);
      if (when.getTime() > now.getTime() + 45 * DAY && s.id !== payable?.id) continue;
      const isSub = s.payment_type === 'subscription';
      const what = isSub
        ? `${titleOf(e)} · מנוי`
        : s.payment_type === 'deposit'
        ? `${titleOf(e)} · מקדמה`
        : `${titleOf(e)} · תשלום ${s.payment_number} מתוך ${total}`;
      const overdue = isDue(s, now) && s.status !== 'processing';
      const state: BillingDue['state'] = s.status === 'processing' ? 'processing' : payable?.id === s.id ? 'pay' : 'auto';
      due.push({
        scheduleId: s.id,
        what,
        when: state === 'processing' ? 'החיוב בעיבוד' : overdue ? (s.status === 'failed' ? `החיוב נכשל · ${date(s.scheduled_date)}` : `לתשלום מ-${date(s.scheduled_date)}`) : `יחויב ב-${date(s.scheduled_date)}`,
        sum: money(Number(s.amount), s.currency || e.currency),
        state,
        overdue,
      });
      if (when.getTime() <= now.getTime() + 30 * DAY) {
        dueSum += Number(s.amount);
        dueCurrency = s.currency || e.currency || dueCurrency;
      }
    }
  }
  due.sort((a, b) => Number(b.overdue) - Number(a.overdue));

  // History: payments received, newest first.
  const thisYear = year(now);
  let paidSum = 0;
  let paidCurrency = dueCurrency;
  const paidSchedules = (scheduleRows ?? []).filter((s: any) => s.status === 'paid');
  const paymentBySchedule = new Map((paymentRows ?? []).filter((p: any) => p.payment_schedule_id).map((p: any) => [p.payment_schedule_id, p]));
  const history: BillingHistory[] = paidSchedules
    .map((s: any) => {
      const e = enrollments.find((x: any) => x.id === s.enrollment_id);
      const p: any = paymentBySchedule.get(s.id);
      const when = s.paid_date || p?.paid_at || s.scheduled_date;
      const total = (schedulesBy.get(s.enrollment_id) ?? []).length;
      const refunded = Number(p?.refunded_amount || 0);
      if (year(new Date(when)) === thisYear) {
        paidSum += Number(s.amount) - refunded;
        paidCurrency = s.currency || paidCurrency;
      }
      return {
        key: s.id,
        sort: new Date(when).getTime(),
        what:
          s.payment_type === 'subscription'
            ? `${titleOf(e)} · ${new Intl.DateTimeFormat('he-IL', { timeZone: TZ, month: 'long' }).format(new Date(s.scheduled_date))}`
            : s.payment_type === 'deposit'
            ? `${titleOf(e)} · מקדמה`
            : total > 1
            ? `${titleOf(e)} · תשלום ${s.payment_number} מתוך ${total}`
            : titleOf(e),
        date: fullDate(when),
        sum: money(Number(s.amount), s.currency),
        refunded: refunded > 0 ? money(refunded, s.currency) : null,
        invoiceId: s.stripe_invoice_id || p?.stripe_invoice_id || null,
      };
    })
    .sort((a, b) => b.sort - a.sort)
    .map(({ sort, ...h }) => h);

  // Installment plans with the full schedule (what the old enrollment and payment-details pages showed).
  const plans: BillingPlan[] = [];
  for (const e of enrollments) {
    const rows = (schedulesBy.get(e.id) ?? []).filter((s: any) => s.payment_type !== 'subscription');
    if (rows.length < 2) continue;
    const counted = rows.filter((s: any) => s.status !== 'cancelled');
    const total = counted.reduce((a: number, s: any) => a + Number(s.amount), 0);
    const paid = counted.filter((s: any) => s.status === 'paid').reduce((a: number, s: any) => a + Number(s.amount), 0);
    const cur = rows[0]?.currency || e.currency;
    plans.push({
      enrollmentId: e.id,
      title: titleOf(e),
      color: colorOf.get(e.id)!,
      paidLabel: `שולמו ${money(paid, cur)} מתוך ${money(total, cur)}`,
      remainingLabel: total - paid > 0 ? `נותרו ${money(total - paid, cur)}` : 'שולם במלואו',
      progress: total ? Math.round((paid / total) * 100) : 0,
      rows: rows.map((s: any) => {
        const [label, tone] = STATUS_LABEL[s.status] ?? [s.status, 'off'];
        const moved = s.original_due_date && s.original_due_date.slice(0, 10) !== String(s.scheduled_date).slice(0, 10);
        return {
          key: s.id,
          label: s.payment_type === 'deposit' ? 'מקדמה' : `תשלום ${s.payment_number}`,
          date: `${fullDate(s.paid_date || s.scheduled_date)}${moved && s.status !== 'paid' ? ` (במקור ${date(s.original_due_date)})` : ''}`,
          sum: money(Number(s.amount), s.currency || cur),
          status: label,
          tone,
        };
      }),
    });
  }

  return {
    dueTotal: money(dueSum, dueCurrency),
    paidTotal: money(paidSum, paidCurrency),
    subs,
    due,
    history,
    plans,
  };
}

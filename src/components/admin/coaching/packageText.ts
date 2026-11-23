/**
 * Shared words and colours for coaching packages (list, drawer, requests).
 * The statuses and payment states come from src/lib/family/coachingPackages.ts.
 */
import type { TFn } from './shared';
import { priceText, tf } from './shared';

export type PackageKind = 'parent' | 'child';
export type PackageStatus = 'active' | 'wait_sign' | 'wait_card' | 'wait_intake' | 'ended' | 'cancelled';
export type PaymentState = 'charged' | 'failed' | 'card_saved' | 'no_card' | 'free';

export interface PackageRow {
  enrollment_id: string;
  kind: PackageKind;
  status: PackageStatus;
  child_name: string | null;
  child_age: number | null;
  parent_name: string;
  parent_email: string | null;
  product_title: string;
  price_per_session: number;
  currency: string;
  coach_name: string | null;
  coach_id: string | null;
  sessions_used: number;
  sessions_total: number;
  payment: PaymentState;
  sessions_charged: number;
  charged_total: number;
  package_total: number;
  pending_offer: boolean;
  created_at: string;
}

/** The round "Parent" / "Child" mark before a name. */
export const KIND_MARK: Record<PackageKind, { cls: string; key: string; fallback: string }> = {
  parent: { cls: 'bg-primary/10 text-primary', key: 'admin.coaching.kind.parentMark', fallback: 'הורה' },
  child: { cls: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300', key: 'admin.coaching.kind.childMark', fallback: 'ילד' },
};

export function kindName(t: TFn, kind: PackageKind) {
  return kind === 'parent' ? t('admin.coaching.kind.parent', 'ליווי הורי') : t('admin.coaching.kind.child', 'ליווי ילד');
}

const STATUS: Record<PackageStatus, { key: string; fallback: string; cls: string; dot: string }> = {
  active: { key: 'admin.coaching.status.active', fallback: 'פעילה', cls: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300', dot: 'bg-green-600' },
  wait_sign: { key: 'admin.coaching.status.waitSign', fallback: 'ממתין לחתימה', cls: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', dot: 'bg-amber-500' },
  wait_card: { key: 'admin.coaching.status.waitCard', fallback: 'ממתין לכרטיס', cls: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', dot: 'bg-amber-500' },
  wait_intake: { key: 'admin.coaching.status.waitIntake', fallback: 'ממתין לשאלון', cls: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', dot: 'bg-amber-500' },
  ended: { key: 'admin.coaching.status.ended', fallback: 'הסתיימה', cls: 'bg-muted text-foreground/70', dot: 'bg-muted-foreground' },
  cancelled: { key: 'admin.coaching.status.cancelled', fallback: 'בוטלה', cls: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300', dot: 'bg-red-500' },
};
export const statusStyle = (s: PackageStatus) => STATUS[s];
export const statusName = (t: TFn, s: PackageStatus) => t(STATUS[s].key, STATUS[s].fallback);
export const isWaiting = (s: PackageStatus) => s === 'wait_sign' || s === 'wait_card' || s === 'wait_intake';

/** The payment column: "3 sessions charged", "Last charge failed", ... */
export function paymentText(t: TFn, p: PackageRow): { text: string; cls: string } {
  switch (p.payment) {
    case 'failed':
      return { text: t('admin.coaching.pay.failed', 'החיוב האחרון נכשל'), cls: 'text-red-700 dark:text-red-400' };
    case 'charged':
      return {
        text: p.sessions_charged === 1 ? t('admin.coaching.pay.chargedOne', 'מפגש אחד נגבה') : tf(t, 'admin.coaching.pay.charged', '{n} מפגשים נגבו', { n: p.sessions_charged }),
        cls: 'text-green-700 dark:text-green-400',
      };
    case 'card_saved':
      return { text: t('admin.coaching.pay.cardSaved', 'כרטיס נשמר'), cls: 'text-green-700 dark:text-green-400' };
    case 'free':
      return { text: t('admin.coaching.pay.free', 'ללא תשלום'), cls: 'text-muted-foreground' };
    default:
      return { text: t('admin.coaching.pay.noCard', 'אין כרטיס עדיין'), cls: 'text-muted-foreground' };
  }
}

/** "Noa Cohen" (child) or "Dana Cohen" (parent). */
export function whoName(t: TFn, p: Pick<PackageRow, 'kind' | 'child_name' | 'parent_name'>) {
  return p.kind === 'child' ? p.child_name || t('admin.coaching.common.noChildName', 'ילד ללא שם') : p.parent_name;
}

/** "Child coaching · age 9 · parent: Dana Cohen" / "Parent coaching". */
export function whoSub(t: TFn, p: Pick<PackageRow, 'kind' | 'child_age' | 'parent_name'>) {
  if (p.kind === 'parent') return kindName(t, 'parent');
  return [
    kindName(t, 'child'),
    p.child_age != null ? tf(t, 'admin.coaching.common.age', 'גיל {n}', { n: p.child_age }) : null,
    p.parent_name ? tf(t, 'admin.coaching.common.parentIs', 'הורה: {name}', { name: p.parent_name }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** "$175 per session" */
export function perSession(t: TFn, amount: number, currency: string, language?: string) {
  return tf(t, 'admin.coaching.common.perSession', '{price} למפגש', { price: priceText(amount, currency, language) });
}

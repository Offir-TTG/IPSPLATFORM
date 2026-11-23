/**
 * Membership (subscription) prices and their scheduled changes.
 *
 * Cards stay at Stripe and the platform charges each period itself, so the
 * price of a period is decided here:
 *   - A new member pays the price in effect on the day they join, and keeps
 *     it as their own price (enrollments.subscription_price).
 *   - A change for 'new' members only moves the product/plan price on its
 *     date; current members keep their own price.
 *   - A change for 'all' also moves current members, from their first
 *     renewal on or after the date (they are emailed notice_days before).
 *
 * A change targets either the product price (payment_plan_id null, for
 * members whose plan has no price of its own) or one plan's own price.
 */

export interface PriceChange {
  id: string;
  tenant_id: string;
  product_id: string;
  payment_plan_id: string | null;
  old_amount: number;
  new_amount: number;
  currency: string;
  /** YYYY-MM-DD */
  effective_date: string;
  applies_to: 'new' | 'all';
  notice_days: number;
  notice_sent_at: string | null;
  applied_at: string | null;
  cancelled_at: string | null;
  created_at?: string;
}

/** The price a member pays, kept on their enrollment. */
export interface MemberPrice {
  amount: number;
  plan_id: string | null;
  /** YYYY-MM-DD: when this price started for them. */
  set_at: string;
}

const day = (d: Date | string) => (typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10));

/** The member's own price, if it is valid and belongs to the plan they are on now. */
export function readMemberPrice(value: unknown, currentPlanId: string | null): MemberPrice | null {
  const v = value as Partial<MemberPrice> | null;
  const amount = Number(v?.amount);
  if (!v || !Number.isFinite(amount) || amount <= 0) return null;
  // A member who switched plan (monthly to yearly) pays the new plan's price.
  if ((v.plan_id ?? null) !== (currentPlanId ?? null)) return null;
  return { amount: Math.round(amount * 100) / 100, plan_id: v.plan_id ?? null, set_at: day(v.set_at ?? '1970-01-01') };
}

/** Does this change apply to members on `planId`? (`planHasOwnPrice`: that plan has its own price.) */
export function changeMatches(change: PriceChange, planId: string | null, planHasOwnPrice: boolean): boolean {
  if (change.cancelled_at) return false;
  if (change.payment_plan_id) return change.payment_plan_id === planId;
  return !planHasOwnPrice;
}

/** The price someone joining on `on` pays: the latest change already in effect, else `base`. */
export function priceForNewMember(base: number, changes: PriceChange[], planId: string | null, planHasOwnPrice: boolean, on: Date = new Date()): number {
  const today = day(on);
  const inEffect = changes
    .filter((c) => changeMatches(c, planId, planHasOwnPrice) && c.effective_date <= today)
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  return inEffect.length ? Number(inEffect[inEffect.length - 1].new_amount) : base;
}

/** The next change that has not started yet, for showing "from {date}: {price}". */
export function upcomingChange(changes: PriceChange[], planId: string | null, planHasOwnPrice: boolean, on: Date = new Date()): PriceChange | null {
  const today = day(on);
  const next = changes
    .filter((c) => changeMatches(c, planId, planHasOwnPrice) && c.effective_date > today)
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  return next[0] ?? null;
}

/**
 * The price of a renewal on `renewalDate` for a current member. Starts from
 * their own price (or `fallback` when they have none) and applies the latest
 * 'all' change that took effect after their price was set and by the renewal.
 * Returns the amount and, when it moved, the member's new own price.
 */
export function renewalPrice(args: {
  memberPrice: MemberPrice | null;
  fallback: number;
  /** When the period before this renewal started (used when the member has no own price). */
  previousPeriodStart: string;
  changes: PriceChange[];
  planId: string | null;
  planHasOwnPrice: boolean;
  renewalDate: Date | string;
}): { amount: number; memberPrice: MemberPrice } {
  const { memberPrice, fallback, changes, planId, planHasOwnPrice } = args;
  const renewal = day(args.renewalDate);
  const since = memberPrice ? memberPrice.set_at : day(args.previousPeriodStart);
  const due = changes
    .filter((c) => c.applies_to === 'all' && changeMatches(c, planId, planHasOwnPrice) && c.effective_date > since && c.effective_date <= renewal)
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (due.length) {
    const change = due[due.length - 1];
    const amount = Number(change.new_amount);
    return { amount, memberPrice: { amount, plan_id: planId, set_at: change.effective_date } };
  }
  const amount = memberPrice?.amount ?? fallback;
  return { amount, memberPrice: memberPrice ?? { amount, plan_id: planId, set_at: renewal } };
}

/**
 * The upcoming price for one current member: an 'all' change that has not
 * reached their renewals yet. Null when nothing changes for them.
 */
export function upcomingForMember(memberPrice: MemberPrice | null, changes: PriceChange[], planId: string | null, planHasOwnPrice: boolean): PriceChange | null {
  // A change stays upcoming for a member until a renewal has used it
  // (renewalPrice then moves their own price's set_at to the change's date).
  const since = memberPrice?.set_at ?? '1970-01-01';
  const next = changes
    .filter((c) => c.applies_to === 'all' && changeMatches(c, planId, planHasOwnPrice) && c.effective_date > since)
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  return next[0] ?? null;
}

/** Reads the active (not cancelled) changes for some products. */
export async function loadPriceChanges(db: any, productIds: string[]): Promise<PriceChange[]> {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const { data, error } = await db.from('subscription_price_changes').select('*').in('product_id', ids).is('cancelled_at', null);
  // Before the SQL is run the table is missing: behave as if there are no changes.
  if (error) return [];
  return (data || []).map((c: any) => ({ ...c, old_amount: Number(c.old_amount), new_amount: Number(c.new_amount), effective_date: day(c.effective_date) }));
}

/**
 * For buyers, before they pay: the next scheduled price for a product's
 * membership (the product price, or the default plan's own price when it has
 * one). Null when no change is coming.
 */
export async function upcomingForBuyers(
  db: any,
  products: { id: string; default_payment_plan_id?: string | null }[],
): Promise<Map<string, { amount: number; effective_date: string }>> {
  const out = new Map<string, { amount: number; effective_date: string }>();
  const changes = await loadPriceChanges(db, products.map((p) => p.id));
  if (changes.length === 0) return out;
  const planIds = [...new Set(products.map((p) => p.default_payment_plan_id).filter(Boolean))] as string[];
  const { data: plans } = planIds.length ? await db.from('payment_plans').select('id, subscription_amount').in('id', planIds) : { data: [] as any[] };
  const ownPrice = new Set((plans || []).filter((p: any) => Number(p.subscription_amount) > 0).map((p: any) => p.id));
  for (const p of products) {
    const planId = p.default_payment_plan_id ?? null;
    const next = upcomingChange(changes.filter((c) => c.product_id === p.id), planId, !!planId && ownPrice.has(planId));
    if (next) out.set(p.id, { amount: Number(next.new_amount), effective_date: next.effective_date });
  }
  return out;
}

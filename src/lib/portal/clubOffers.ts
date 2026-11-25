import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { SPACE_COLORS, clubCourseOfProgram } from './clientLearning';
import { priceLabel, upcomingPriceLine } from './membership';
import { planSubscriptionAmount } from '@/lib/payments/paymentEngine';
import { loadPriceChanges, priceForNewMember, upcomingChange } from '@/lib/payments/subscriptionPrice';
/**
 * Clubs the client can join but hasn't yet. They show on home beside the
 * clubs they're in; opening one starts the enrollment right there, the same
 * way coaching does. A club is an active product sold as a monthly (or
 * yearly) membership, either a course or a program; its space is its course.
 */

export type ClubOffer = {
  productId: string;
  courseId: string;
  title: string;
  tagline: string | null;
  color: string;
  /** The product's picture (metadata.image_url), for the card cover. */
  imageUrl: string | null;
  priceLine: string | null;
  /** The same price in parts, for the join card: "‏29.99 ‏$" and "לחודש". */
  priceAmount: string | null;
  pricePer: string;
  /**
   * The club's only plan, to attach before the wizard opens. The wizard asks
   * for a plan only when there are several; with one it would fall back to
   * the product's one-time price. Null when the enrollment already has it.
   */
  attachPlanId: string | null;
  /** A scheduled price change still ahead: "מהחיוב ב-01.01: ‏50 $ לחודש". */
  upcomingLine: string | null;
  /** An enrollment the client already started (and can finish), as its /enroll/<token> link. */
  enrollmentUrl: string | null;
  invite: { product_name: string; total_amount: number; currency: string };
};

const isYearly = (f?: string | null) => ['yearly', 'annual', 'annually', 'year'].includes(f ?? '');
// A stable shade per club, so home and the club page agree.
const colorFor = (id: string) => SPACE_COLORS[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % SPACE_COLORS.length];

export async function loadClubOffers(userId: string, accessibleCourseIds: Iterable<string>): Promise<ClubOffer[]> {
  const admin = createAdminClient();
  const { data: me } = await admin.from('users').select('tenant_id').eq('id', userId).maybeSingle();
  if (!me?.tenant_id) return [];

  const { data: products } = await admin
    .from('products')
    .select('id, type, title, metadata, price, currency, payment_model, course_id, program_id, default_payment_plan_id, alternative_payment_plan_ids')
    .eq('tenant_id', me.tenant_id)
    .eq('is_active', true)
    .in('type', ['course', 'program']);
  if (!products?.length) return [];

  const planIds = [...new Set(products.flatMap((p: any) => [p.default_payment_plan_id, ...(p.alternative_payment_plan_ids ?? [])]).filter(Boolean))] as string[];
  const { data: plans } = planIds.length
    ? await admin.from('payment_plans').select('id, plan_type, subscription_frequency, subscription_amount').in('id', planIds)
    : { data: [] as any[] };
  const subPlan = new Map((plans ?? []).filter((p: any) => p.plan_type === 'subscription').map((p: any) => [p.id as string, p]));
  const subPlanOf = (p: any) => [p.default_payment_plan_id, ...(p.alternative_payment_plan_ids ?? [])].map((id) => subPlan.get(id)).find(Boolean) ?? null;
  const clubs = products.filter((p: any) => p.payment_model === 'subscription' || subPlanOf(p));
  if (!clubs.length) return [];

  const programIds = clubs.map((p: any) => p.program_id).filter(Boolean) as string[];
  const { data: programCourses } = programIds.length
    ? await admin.from('program_courses').select('program_id, course_id, order').in('program_id', programIds)
    : { data: [] as any[] };
  const courseOf = (p: any): string | null => (p.type === 'program' ? (p.program_id ? clubCourseOfProgram(programCourses ?? [], p.program_id) : null) : p.course_id);

  // Not offered: clubs whose course the client can already enter, or that
  // they enrolled in before (only an unfinished enrollment can be continued).
  const accessible = new Set(accessibleCourseIds);
  const { data: mine } = await admin
    .from('enrollments')
    .select('product_id, status, payment_plan_id, enrollment_token, token_expires_at, created_at')
    .eq('user_id', userId)
    .in('product_id', clubs.map((p: any) => p.id))
    .order('created_at', { ascending: false });
  const latest = new Map<string, any>();
  for (const e of mine ?? []) if (!latest.has(e.product_id)) latest.set(e.product_id, e);

  const candidates = clubs
    .map((p: any) => ({ p, courseId: courseOf(p) }))
    .filter(({ p, courseId }) => {
      if (!courseId || accessible.has(courseId)) return false;
      const e = latest.get(p.id);
      return !e || e.status === 'draft' || e.status === 'pending';
    });
  if (!candidates.length) return [];

  const { data: courses } = await admin.from('courses').select('id, title, description').in('id', candidates.map((c) => c.courseId as string));
  const courseById = new Map((courses ?? []).map((c: any) => [c.id as string, c]));
  const now = Date.now();
  const changes = await loadPriceChanges(admin, candidates.map(({ p }) => p.id));

  return candidates.flatMap(({ p, courseId }) => {
    const course: any = courseById.get(courseId as string);
    if (!course) return [];
    const e = latest.get(p.id);
    const live = e?.enrollment_token && (!e.token_expires_at || new Date(e.token_expires_at).getTime() > now);
    // The price a new member pays today, and any change still ahead, by the payment rules.
    const plan = subPlanOf(p);
    const own = planSubscriptionAmount(plan);
    const mine = changes.filter((c) => c.product_id === p.id);
    const price = priceForNewMember(own ?? (Number(p.price) || 0), mine, plan?.id ?? null, own !== null);
    const next = upcomingChange(mine, plan?.id ?? null, own !== null);
    const per = isYearly(plan?.subscription_frequency) ? 'לשנה' : 'לחודש';
    // Only a single listed plan is attached (the plan endpoint accepts the product's listed plans).
    const listed = [...new Set([p.default_payment_plan_id, ...(p.alternative_payment_plan_ids ?? [])].filter(Boolean))];
    const onlyPlan: string | null = listed.length === 1 && plan && (p.alternative_payment_plan_ids ?? []).includes(plan.id) ? plan.id : null;
    const currency = p.currency || 'USD';
    return [
      {
        productId: p.id,
        courseId: courseId as string,
        title: course.title ?? p.title,
        tagline: course.description ? String(course.description).replace(/<[^>]+>/g, '').trim().slice(0, 140) || null : null,
        color: colorFor(courseId as string),
        imageUrl: p.metadata?.image_url || null,
        priceLine: price > 0 ? `${priceLabel(price, currency)} ${per}` : null,
        priceAmount: price > 0 ? priceLabel(price, currency) : null,
        pricePer: per,
        attachPlanId: onlyPlan && onlyPlan !== (live ? e.payment_plan_id : null) ? onlyPlan : null,
        upcomingLine: next ? upcomingPriceLine(next.effective_date, Number(next.new_amount), currency, plan?.subscription_frequency ?? 'monthly') : null,
        enrollmentUrl: live ? `/enroll/${e.enrollment_token}` : null,
        invite: { product_name: p.title, total_amount: price, currency },
      },
    ];
  });
}

export async function loadClubOffer(userId: string, courseId: string, accessibleCourseIds: Iterable<string>): Promise<ClubOffer | null> {
  return (await loadClubOffers(userId, accessibleCourseIds)).find((o) => o.courseId === courseId) ?? null;
}

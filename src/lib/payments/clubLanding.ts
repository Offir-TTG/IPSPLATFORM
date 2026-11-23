import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Where a client lands after joining a club: the club's page in the portal,
 * /clubs/<courseId>. A club is anything billed as a membership (the product's
 * payment setting, or the plan the enrollment is on). For a program sold as a
 * club, its space is the program's first course (program_courses order), the
 * same rule the portal uses. Null when it isn't a club or has no course.
 */
export async function clubLandingFor(
  db: SupabaseClient,
  product: { type?: string | null; payment_model?: string | null; course_id?: string | null; program_id?: string | null } | null,
  paymentPlanId: string | null | undefined,
): Promise<string | null> {
  if (!product) return null;

  let isClub = product.payment_model === 'subscription';
  if (!isClub && paymentPlanId) {
    const { data: plan } = await db.from('payment_plans').select('plan_type').eq('id', paymentPlanId).maybeSingle();
    isClub = plan?.plan_type === 'subscription';
  }
  if (!isClub) return null;

  if (product.type === 'program' && product.program_id) {
    const { data: first } = await db
      .from('program_courses')
      .select('course_id')
      .eq('program_id', product.program_id)
      .order('order', { ascending: true })
      .limit(1)
      .maybeSingle();
    return first?.course_id ? `/clubs/${first.course_id}?enrollment=complete` : null;
  }
  return product.course_id ? `/clubs/${product.course_id}?enrollment=complete` : null;
}

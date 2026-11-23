import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { cancelPackage, getPackage, nextSessionPrice, recordHeldSession, setPackageIntakeForm } from '@/lib/family/coachingPackages';
import { setPackCoach } from '@/lib/family/adminCoaching';
import { syncSessionCharge } from '@/lib/payments/perSession';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/packages/[id]: the drawer (and what the next held session costs).
export const GET = adminCoachingRoute<{ id: string }>(async ({ tenantId, params }) => {
  // Charges still "processing": ask Stripe, so a paid one shows as paid.
  const { data: open } = await createAdminClient()
    .from('payment_schedules')
    .select('id')
    .eq('enrollment_id', params.id)
    .eq('tenant_id', tenantId)
    .eq('payment_type', 'session')
    .eq('status', 'processing');
  for (const s of open ?? []) await syncSessionCharge(tenantId, s.id).catch(() => undefined);
  const pack = await getPackage(tenantId, params.id);
  if (!pack.ok) return pack;
  return { ...pack, next_session_price: await nextSessionPrice(tenantId, params.id) };
});

// POST /api/admin/coaching/packages/[id]
//   {action:'held'}               a session took place: record it and charge the saved card
//   {action:'coach', coach_id}    change the coach
//   {action:'cancel'}             cancel the package
//   {action:'intake', form_id}    the intake form: an id, 'none', or null for the product's own
export const POST = adminCoachingRoute<{ id: string }>(({ tenantId, adminId, params, body }) => {
  if (body.action === 'held') return recordHeldSession(tenantId, adminId, params.id);
  if (body.action === 'coach') return setPackCoach(tenantId, params.id, String(body.coach_id ?? ''));
  if (body.action === 'cancel') return cancelPackage(tenantId, params.id);
  if (body.action === 'intake') return setPackageIntakeForm(tenantId, params.id, body.form_id);
  return Promise.resolve({ ok: false, status: 400, error: 'Unknown action' });
});

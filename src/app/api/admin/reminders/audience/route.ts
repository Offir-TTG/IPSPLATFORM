import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { audience, existingCases } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// GET ?event=payment.failed — what clients chose in their settings, and cases already open for the event
export const GET = adminRoute(async ({ tenantId, request }) => {
  const event = new URL(request.url).searchParams.get('event');
  const [aud, cases] = await Promise.all([audience(tenantId), event ? existingCases(tenantId, event) : Promise.resolve({ count: 0, names: [] })]);
  return { ...aud, existing: cases };
});

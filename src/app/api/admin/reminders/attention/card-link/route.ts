import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { sendCardLink } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// POST { userId, enrollmentId } — sends the client a link to update their card (through their settings)
export const POST = adminRoute(({ tenantId, adminId, body }) => {
  if (typeof body?.userId !== 'string') return Promise.resolve({ ok: false, status: 400, error: 'Missing client' });
  return sendCardLink(tenantId, adminId, body.userId, typeof body.enrollmentId === 'string' ? body.enrollmentId : null);
});

import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { setRequestStatus } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/coaching/requests/[id]  {status}
export const PATCH = adminCoachingRoute<{ id: string }>(({ tenantId, adminId, params, body }) =>
  setRequestStatus(tenantId, adminId, params.id, body.status),
);

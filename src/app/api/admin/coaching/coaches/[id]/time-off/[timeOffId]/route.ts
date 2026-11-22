import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { removeTimeOff } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/coaching/coaches/[id]/time-off/[timeOffId]
export const DELETE = adminCoachingRoute<{ id: string; timeOffId: string }>(({ tenantId, params }) =>
  removeTimeOff(tenantId, params.id, params.timeOffId),
);

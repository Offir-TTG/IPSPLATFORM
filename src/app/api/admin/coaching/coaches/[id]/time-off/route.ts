import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { addTimeOff } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// POST /api/admin/coaching/coaches/[id]/time-off  {starts_at, ends_at, note?}
export const POST = adminCoachingRoute<{ id: string }>(({ tenantId, params, body }) => addTimeOff(tenantId, params.id, body));

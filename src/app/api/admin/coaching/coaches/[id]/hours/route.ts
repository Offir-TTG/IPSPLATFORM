import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { getCoachHours, saveCoachHours } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/coaches/[id]/hours — weekly hours and upcoming time off
export const GET = adminCoachingRoute<{ id: string }>(({ tenantId, params }) => getCoachHours(tenantId, params.id));

// PUT /api/admin/coaching/coaches/[id]/hours  {weekly:[{weekday,start_time:'HH:MM',end_time:'HH:MM'}]}
export const PUT = adminCoachingRoute<{ id: string }>(({ tenantId, params, body }) => saveCoachHours(tenantId, params.id, body.weekly));

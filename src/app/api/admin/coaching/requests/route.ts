import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { listCoachingRequests } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/requests?status=new|in_progress|handled
export const GET = adminCoachingRoute(({ request, tenantId }) => {
  const status = (request.nextUrl.searchParams.get('status') ?? 'new') as 'new' | 'in_progress' | 'handled';
  return listCoachingRequests(tenantId, ['new', 'in_progress', 'handled'].includes(status) ? status : 'new');
});

import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { searchClients } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/clients?q=: clients by name, email or phone.
export const GET = adminCoachingRoute(({ request, tenantId }) => searchClients(tenantId, request.nextUrl.searchParams.get('q') ?? ''));

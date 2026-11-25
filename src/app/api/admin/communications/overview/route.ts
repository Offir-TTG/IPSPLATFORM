import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { overview } from '@/lib/messaging/comms';

export const dynamic = 'force-dynamic';

// GET ?days=7|30|90|365 — numbers from every channel, per day, by source and outcome, what's coming up
export const GET = adminRoute(({ tenantId, request }) => overview(tenantId, Number(new URL(request.url).searchParams.get('days') || '30')));

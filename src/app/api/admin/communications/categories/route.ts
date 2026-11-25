import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { getCategories, saveCategories } from '@/lib/messaging/comms';

export const dynamic = 'force-dynamic';

// GET / PUT { categories } — the email template categories and their badge colours
export const GET = adminRoute(({ tenantId }) => getCategories(tenantId));
export const PUT = adminRoute(({ tenantId, body }) => saveCategories(tenantId, body?.categories));

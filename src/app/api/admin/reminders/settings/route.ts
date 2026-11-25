import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { getSettings, saveSettings } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// GET — sending hours, Shabbat, daily summary time, and what clients chose
export const GET = adminRoute(({ tenantId }) => getSettings(tenantId));

// PUT — save them
export const PUT = adminRoute(({ tenantId, adminId, body }) => saveSettings(tenantId, adminId, body ?? {}));

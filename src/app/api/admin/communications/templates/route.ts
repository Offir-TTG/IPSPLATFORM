import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { listTemplates } from '@/lib/messaging/comms';

export const dynamic = 'force-dynamic';

// GET — the email templates, their languages, where each is used, and the categories
export const GET = adminRoute(({ tenantId }) => listTemplates(tenantId));

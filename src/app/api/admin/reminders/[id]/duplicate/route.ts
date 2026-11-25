import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { duplicateReminder } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// POST — a copy, saved as a draft
export const POST = adminRoute<{ id: string }>(({ tenantId, adminId, params }) => duplicateReminder(tenantId, adminId, params.id));

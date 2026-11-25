import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { listReminders, saveReminder } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/reminders — every automatic reminder, with this month's numbers
export const GET = adminRoute(({ tenantId }) => listReminders(tenantId));

// POST /api/admin/reminders — a new reminder from the wizard
export const POST = adminRoute(({ tenantId, adminId, body }) => saveReminder(tenantId, adminId, null, body));

import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { deleteReminder, getReminder, saveReminder, setReminderStatus } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

type P = { id: string };

// GET — one reminder: steps, numbers, clients in progress, recent activity
export const GET = adminRoute<P>(({ tenantId, params }) => getReminder(tenantId, params.id));

// PUT — save from the wizard
export const PUT = adminRoute<P>(({ tenantId, adminId, params, body }) => saveReminder(tenantId, adminId, params.id, body));

// PATCH { status } — turn on, pause, turn off
export const PATCH = adminRoute<P>(({ tenantId, params, body }) => setReminderStatus(tenantId, params.id, body?.status));

// DELETE — reminders the team created (built-in ones can only be turned off)
export const DELETE = adminRoute<P>(({ tenantId, params }) => deleteReminder(tenantId, params.id));

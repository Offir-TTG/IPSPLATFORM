import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { sendLog } from '@/lib/messaging/comms';

export const dynamic = 'force-dynamic';

// GET ?outcome=&source=&priority=&q=&today=1&page=1 — one log of everything sent: reminders, messages, scheduled and system emails
export const GET = adminRoute(({ tenantId, request }) => {
  const p = new URL(request.url).searchParams;
  return sendLog(tenantId, {
    outcome: p.get('outcome') || undefined,
    source: p.get('source') || undefined,
    priority: p.get('priority') || undefined,
    q: p.get('q') || undefined,
    today: p.get('today') === '1',
    page: Number(p.get('page') || '1') || 1,
  });
});

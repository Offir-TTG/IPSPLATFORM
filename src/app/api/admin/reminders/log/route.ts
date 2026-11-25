import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { sendLog } from '@/lib/messaging/admin';

export const dynamic = 'force-dynamic';

// GET ?outcome=&q=&today=1&page=1 — every message sent, and how it arrived
export const GET = adminRoute(({ tenantId, request }) => {
  const p = new URL(request.url).searchParams;
  return sendLog(tenantId, {
    outcome: p.get('outcome') || undefined,
    q: p.get('q') || undefined,
    today: p.get('today') === '1',
    page: Number(p.get('page') || '1') || 1,
  });
});

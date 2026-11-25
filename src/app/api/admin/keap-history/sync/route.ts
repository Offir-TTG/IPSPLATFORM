import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { runKeapSyncStep, type SyncStep } from '@/lib/keap/history';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STEPS: SyncStep[] = ['orders', 'payments', 'phones', 'transactions'];

/**
 * POST /api/admin/keap-history/sync { step, offset } — brings one chunk of
 * the Keap history in (about 40 seconds of work) and answers with the next
 * step. The page calls it again until the step is "done".
 */
export async function POST(request: NextRequest) {
  const auth = await verifyTenantAdmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const step: SyncStep = STEPS.includes(body.step) ? body.step : 'orders';
  const offset = Math.max(0, Number(body.offset) || 0);
  try {
    return NextResponse.json(await runKeapSyncStep(auth.tenant.id, step, offset));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'The Keap import failed' }, { status: 502 });
  }
}

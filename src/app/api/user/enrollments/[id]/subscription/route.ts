import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { changeSubscription } from '@/lib/payments/clientPayments';

export const dynamic = 'force-dynamic';

const ACTIONS = new Set(['stop', 'resume', 'pause_month', 'switch_plan']);

/**
 * POST /api/user/enrollments/[id]/subscription  { action: 'stop' | 'resume' | 'pause_month' | 'switch_plan', plan_id? }
 * A client stops, resumes, pauses or switches the plan of their own membership.
 * The rules live in clientPayments.changeSubscription.
 */
export const POST = withAuth(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> | { id: string } }) => {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    if (!ACTIONS.has(body?.action)) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    if (body.action === 'switch_plan' && typeof body.plan_id !== 'string') {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    try {
      const result = await changeSubscription(user.id, id, body.action, body.plan_id);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
      return NextResponse.json(result);
    } catch (error: any) {
      console.error('[subscription change] failed:', error?.message);
      return NextResponse.json({ error: 'The change could not be saved' }, { status: 500 });
    }
  },
  ['student', 'instructor', 'admin', 'super_admin']
);

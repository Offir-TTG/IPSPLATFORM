import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { payScheduleForClient } from '@/lib/payments/clientPayments';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/payment-schedules/[id]/pay
 * "Pay now" from the portal: charges the client's saved card for the
 * earliest payment that is due. The rules live in clientPayments.payScheduleForClient.
 */
export const POST = withAuth(
  async (_request: NextRequest, user: any, context: { params: Promise<{ id: string }> | { id: string } }) => {
    const { id } = await context.params;
    try {
      const result = await payScheduleForClient(user.id, id);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
      return NextResponse.json(result);
    } catch (error: any) {
      console.error('[pay schedule] failed:', error?.message);
      return NextResponse.json({ error: 'The payment could not be started' }, { status: 500 });
    }
  },
  ['student', 'instructor', 'admin', 'super_admin']
);

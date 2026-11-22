import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { cancelSession, rescheduleSession } from '@/lib/family/coaching';

export const dynamic = 'force-dynamic';
const ROLES = ['student', 'instructor', 'admin', 'super_admin'] as const;
type Ctx = { params: Promise<{ id: string }> | { id: string } };

/**
 * PATCH /api/user/coaching-sessions/[id]  { starts_at }
 * Moves a session to another free slot (at least 24 hours ahead).
 */
export const PATCH = withAuth(
  async (request: NextRequest, user: any, context: Ctx) => {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    if (typeof body?.starts_at !== 'string') return NextResponse.json({ error: 'starts_at is required' }, { status: 400 });
    const result = await rescheduleSession(user.id, id, body.starts_at);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  },
  [...ROLES]
);

/**
 * DELETE /api/user/coaching-sessions/[id]?confirm_late=1
 * Cancels a session. Under 24 hours the first call answers 409 with
 * needs_confirmation; calling again with confirm_late counts it as used.
 */
export const DELETE = withAuth(
  async (request: NextRequest, user: any, context: Ctx) => {
    const { id } = await context.params;
    const result = await cancelSession(user.id, id, { confirmLate: request.nextUrl.searchParams.get('confirm_late') === '1' });
    if (!result.ok) {
      return NextResponse.json({ error: result.error, needs_confirmation: 'needs_confirmation' in result ? true : undefined }, { status: result.status });
    }
    return NextResponse.json(result);
  },
  [...ROLES]
);

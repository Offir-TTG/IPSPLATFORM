import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { bookSession } from '@/lib/family/coaching';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/coaching/[enrollmentId]/sessions  { starts_at }
 * Books a session in one of the coach's free slots.
 */
export const POST = withAuth(
  async (request: NextRequest, user: any, context: { params: Promise<{ enrollmentId: string }> | { enrollmentId: string } }) => {
    const { enrollmentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    if (typeof body?.starts_at !== 'string') return NextResponse.json({ error: 'starts_at is required' }, { status: 400 });
    const result = await bookSession(user.id, enrollmentId, body.starts_at);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  },
  ['student', 'instructor', 'admin', 'super_admin']
);

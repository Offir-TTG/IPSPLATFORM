import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { getFreeSlots } from '@/lib/family/coaching';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/coaching/[enrollmentId]/slots?from=&to=
 * The coach's free times for the parent's own coaching pack.
 */
export const GET = withAuth(
  async (request: NextRequest, user: any, context: { params: Promise<{ enrollmentId: string }> | { enrollmentId: string } }) => {
    const { enrollmentId } = await context.params;
    const sp = request.nextUrl.searchParams;
    const result = await getFreeSlots(user.id, enrollmentId, { from: sp.get('from') ?? undefined, to: sp.get('to') ?? undefined });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  },
  ['student', 'instructor', 'admin', 'super_admin']
);

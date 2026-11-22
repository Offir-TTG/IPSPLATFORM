import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { requestCoaching } from '@/lib/family/coaching';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/children/[id]/coaching-request  { note? }
 * A parent asks for coaching (or another pack) for their own child; the
 * team handles it in the admin. Rules in lib/family/coaching.requestCoaching.
 */
export const POST = withAuth(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> | { id: string } }) => {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const note = typeof body?.note === 'string' ? body.note : undefined;
    const result = await requestCoaching(user.id, id, note);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  },
  ['student', 'instructor', 'admin', 'super_admin']
);

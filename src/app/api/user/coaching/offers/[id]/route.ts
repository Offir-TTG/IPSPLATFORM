import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { decideOffer } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';
const ROLES = ['student', 'instructor', 'admin', 'super_admin'] as const;
type Ctx = { params: Promise<{ id: string }> | { id: string } };

/** POST /api/user/coaching/offers/[id]  {approve: true|false}: the client approves or declines added sessions. */
export const POST = withAuth(
  async (request: NextRequest, user: any, context: Ctx) => {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await decideOffer(user.id, id, body?.approve === true);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  },
  [...ROLES]
);

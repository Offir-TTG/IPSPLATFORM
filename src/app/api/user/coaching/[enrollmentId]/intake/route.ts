import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { getIntake, submitIntake } from '@/lib/family/intake';

export const dynamic = 'force-dynamic';
const ROLES = ['student', 'instructor', 'admin', 'super_admin'] as const;
type Ctx = { params: Promise<{ enrollmentId: string }> | { enrollmentId: string } };

/** GET /api/user/coaching/[enrollmentId]/intake: the intake form and the parent's answers. */
export const GET = withAuth(
  async (_request: NextRequest, user: any, context: Ctx) => {
    const { enrollmentId } = await context.params;
    const result = await getIntake(user.id, enrollmentId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  },
  [...ROLES]
);

/**
 * PUT /api/user/coaching/[enrollmentId]/intake  { answers }
 * Saves the parent's answers (editable until the first session). A 400 names
 * the question that needs fixing.
 */
export const PUT = withAuth(
  async (request: NextRequest, user: any, context: Ctx) => {
    const { enrollmentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await submitIntake(user.id, enrollmentId, body?.answers ?? {});
    if (!result.ok) {
      return NextResponse.json({ error: result.error, question_id: 'question_id' in result ? result.question_id : undefined }, { status: result.status });
    }
    return NextResponse.json(result);
  },
  [...ROLES]
);

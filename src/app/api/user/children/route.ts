import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { addChild } from '@/lib/family/coaching';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/children  { first_name, age? }
 * A parent adds a child to their own account. Children have no login.
 * The rules live in lib/family/coaching.addChild.
 */
export const POST = withAuth(
  async (request: NextRequest, user: any) => {
    const body = await request.json().catch(() => ({}));
    const age = body?.age == null || body.age === '' ? null : Number(body.age);
    const result = await addChild(user.id, {
      first_name: body?.first_name,
      birth_year: age == null || !Number.isFinite(age) ? undefined : new Date().getFullYear() - age,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  },
  ['student', 'instructor', 'admin', 'super_admin']
);

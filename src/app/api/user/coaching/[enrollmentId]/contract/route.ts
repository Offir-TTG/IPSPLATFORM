import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { contractPdf } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';
const ROLES = ['student', 'instructor', 'admin', 'super_admin'] as const;
type Ctx = { params: Promise<{ enrollmentId: string }> | { enrollmentId: string } };

/** GET /api/user/coaching/[enrollmentId]/contract: the client's own signed contract (PDF from DocuSign). */
export const GET = withAuth(
  async (_request: NextRequest, user: any, context: Ctx) => {
    const { enrollmentId } = await context.params;
    const { data: e } = await createAdminClient().from('enrollments').select('id, user_id, tenant_id').eq('id', enrollmentId).maybeSingle();
    if (!e || e.user_id !== user.id) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
    try {
      const result = await contractPdf(e.tenant_id, e.id);
      if (!result.ok) return NextResponse.json({ error: 'אין עדיין הסכם חתום' }, { status: result.status });
      return new NextResponse(new Uint8Array(result.pdf), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="contract.pdf"' },
      });
    } catch (error) {
      console.error('[client contract]', error);
      return NextResponse.json({ error: 'לא הצלחנו להוריד את ההסכם. נסו שוב מאוחר יותר.' }, { status: 502 });
    }
  },
  [...ROLES]
);

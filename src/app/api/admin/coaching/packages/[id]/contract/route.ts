import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { contractPdf } from '@/lib/family/coachingPackages';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/packages/[id]/contract: the signed contract as a PDF.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyTenantAdmin(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const result = await contractPdf(auth.tenant.id, params.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return new NextResponse(new Uint8Array(result.pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="contract-${params.id.slice(0, 8)}.pdf"` },
    });
  } catch (error) {
    console.error('[coaching contract]', error);
    return NextResponse.json({ error: 'The contract could not be downloaded from DocuSign' }, { status: 502 });
  }
}

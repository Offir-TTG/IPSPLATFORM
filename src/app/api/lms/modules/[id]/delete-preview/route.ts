import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth/requireStaff';
import { currentTenantId, loadModule, moduleDeletePreview } from '@/lib/lms/moduleDelete.server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lms/modules/[id]/delete-preview
 * Before deleting a module: how many lessons it holds, what would go with
 * them (topics, video meetings, attendance) and the modules they could move to.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireStaff();
  if (denied) return denied;
  const tenantId = await currentTenantId();
  if (!tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = createAdminClient();
  const mod = await loadModule(db, id, tenantId);
  if (!mod) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: await moduleDeletePreview(db, mod) });
}

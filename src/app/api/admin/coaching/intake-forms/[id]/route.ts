import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { deleteIntakeForm, saveIntakeForm } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// PUT /api/admin/coaching/intake-forms/[id]  {title, product_id?, questions}
export const PUT = adminCoachingRoute<{ id: string }>(({ tenantId, params, body }) => saveIntakeForm(tenantId, { ...body, id: params.id }));

// DELETE /api/admin/coaching/intake-forms/[id] — retires it (sent intakes keep their copy)
export const DELETE = adminCoachingRoute<{ id: string }>(({ tenantId, params }) => deleteIntakeForm(tenantId, params.id));

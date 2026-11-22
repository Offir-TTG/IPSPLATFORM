import { adminCoachingRoute } from '@/lib/family/adminRoute';
import { listIntakeForms, saveIntakeForm } from '@/lib/family/adminCoaching';

export const dynamic = 'force-dynamic';

// GET /api/admin/coaching/intake-forms — active forms (general and per product)
export const GET = adminCoachingRoute(({ tenantId }) => listIntakeForms(tenantId));

// POST /api/admin/coaching/intake-forms  {title, product_id?, questions}
export const POST = adminCoachingRoute(({ tenantId, body }) => saveIntakeForm(tenantId, body));

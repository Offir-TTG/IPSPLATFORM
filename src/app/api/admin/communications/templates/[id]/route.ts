import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { templatePreview } from '@/lib/messaging/comms';

export const dynamic = 'force-dynamic';

// GET — the template in each language, inside the school's email layout
export const GET = adminRoute<{ id: string }>(({ tenantId, params }) => templatePreview(tenantId, params.id));

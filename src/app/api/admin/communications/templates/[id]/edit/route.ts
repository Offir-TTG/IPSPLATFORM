import { adminCoachingRoute as adminRoute } from '@/lib/family/adminRoute';
import { saveTemplate, templateForEdit } from '@/lib/messaging/comms';

export const dynamic = 'force-dynamic';

type P = { id: string };

// GET — the template, its categories and each language's current words
export const GET = adminRoute<P>(({ tenantId, params }) => templateForEdit(tenantId, params.id));

// PUT { category, versions: { he: {subject, body_html, body_text}, en: {...} } }
export const PUT = adminRoute<P>(({ tenantId, params, body }) => saveTemplate(tenantId, params.id, body ?? {}));

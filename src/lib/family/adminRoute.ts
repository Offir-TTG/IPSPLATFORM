import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

/**
 * Wraps an admin coaching route: tenant admins only, and a function result
 * `{ok:false,status,error}` becomes that HTTP status.
 */
export function adminCoachingRoute<P = Record<string, string>>(
  handler: (ctx: { request: NextRequest; tenantId: string; adminId: string; params: P; body: any }) => Promise<any>,
) {
  return async (request: NextRequest, context: { params: P }) => {
    try {
      const auth = await verifyTenantAdmin(request);
      if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const body = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await request.json().catch(() => ({})) : {};
      const result = await handler({ request, tenantId: auth.tenant.id, adminId: auth.user.id, params: context.params, body });
      if (result && result.ok === false) {
        const { ok: _ok, status, ...rest } = result;
        return NextResponse.json(rest, { status: status ?? 400 });
      }
      return NextResponse.json(result ?? { ok: true });
    } catch (error) {
      console.error('[admin coaching]', error);
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
  };
}

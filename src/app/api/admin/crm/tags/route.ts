import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy endpoint that exposes IParentingSchool's CRM tag taxonomy to the
 * IPSPlatform admin UI. The product form's "Integrations" tab calls this
 * to populate the CRM tag picker.
 *
 * Why a proxy: the browser can't hit IParentingSchool directly because
 * (a) the shared CRM_LOOKUP_SECRET must stay server-side, and
 * (b) CORS isn't configured on IParentingSchool's API.
 *
 * Auth: admin-only on IPSPlatform (session cookie). The cross-repo call
 * carries the existing CRM_LOOKUP_SECRET as bearer.
 *
 * Returns the upstream payload as-is:
 *   { tags: [{ id, slug, label_he, label_en, category }] }
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Lightweight admin gate — same as other admin proxies. We don't
  // need tenant scoping because the tag taxonomy is global.
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .maybeSingle();

  if (!tenantUser) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_IPARENTING_URL;
  const secret = process.env.CRM_LOOKUP_SECRET;
  if (!baseUrl || !secret) {
    return NextResponse.json(
      {
        success: false,
        error: 'CRM bridge not configured (NEXT_PUBLIC_IPARENTING_URL / CRM_LOOKUP_SECRET).',
      },
      { status: 500 },
    );
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/api/admin/crm/tags`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: `Upstream ${upstream.status}: ${text || upstream.statusText}` },
        { status: 502 },
      );
    }

    const payload = await upstream.json();
    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reach CRM',
      },
      { status: 502 },
    );
  }
}

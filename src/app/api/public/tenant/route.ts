import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { createAdminClient } from '@/lib/supabase/server';
import { readLoginPage } from '@/lib/portal/loginPage';

const DEFAULT_LOGO_URL = '/IPS.png'; // Default logo path in public folder

// Mark route as dynamic since it uses request headers for tenant detection
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get current tenant from request (handles subdomain, custom domain, and localhost)
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Use tenant logo if available, otherwise use default logo
    const logoUrl = tenant.logo_url || DEFAULT_LOGO_URL;

    // The login page's picture and words, set in Settings → Login page.
    // "To the website" falls back to the organization's website address.
    const { data: extra } = await createAdminClient()
      .from('tenants')
      .select('metadata, website_url')
      .eq('id', tenant.id)
      .maybeSingle();
    const loginPage = readLoginPage((extra?.metadata as Record<string, unknown> | null)?.login_page);
    if (!loginPage.site_url && extra?.website_url && /^https?:\/\//i.test(extra.website_url)) {
      loginPage.site_url = extra.website_url;
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logo_url: logoUrl,
        login_page: loginPage,
      },
    });
  } catch (error) {
    console.error('Error in public tenant API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

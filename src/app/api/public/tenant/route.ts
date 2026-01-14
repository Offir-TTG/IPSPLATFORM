import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTenant } from '@/lib/tenant/detection';

const DEFAULT_LOGO_URL = '/IPS.png'; // Default logo path in public folder

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

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logo_url: logoUrl,
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

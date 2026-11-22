import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { loadIntegration } from '@/lib/integrations/store';

/**
 * Test Daily.co integration connection
 * Verifies API key is valid by attempting to fetch account info
 */
export async function POST(request: NextRequest) {
  try {
    // Admins only (any signed-in user could run it before).
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // This tenant's own Daily.co settings.
    const { data: integration, error: integrationError } = await loadIntegration(auth.tenant.id, 'daily');

    if (integrationError || !integration) {
      return NextResponse.json({
        success: false,
        error: 'Daily.co integration not configured'
      }, { status: 400 });
    }

    const apiKey = integration.credentials?.api_key;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not set'
      }, { status: 400 });
    }

    // Test the API key by fetching a simple endpoint
    // Daily.co doesn't have a dedicated "test" endpoint, so we'll list rooms with limit 0
    const response = await fetch('https://api.daily.co/v1/rooms?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errorData.error || `API returned ${response.status}: ${response.statusText}`
      }, { status: 400 });
    }

    const data = await response.json();

    // Successful connection - don't include message so frontend uses translation
    return NextResponse.json({
      success: true,
      details: {
        account_active: true,
        total_rooms: data.total_count || 0
      }
    });

  } catch (error) {
    console.error('[Daily.co Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    }, { status: 500 });
  }
}

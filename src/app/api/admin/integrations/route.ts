import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import {
  listTenantIntegrationsMasked,
  loadIntegration,
  maskCredentials,
  saveIntegration,
} from '@/lib/integrations/store';

export const dynamic = 'force-dynamic';

/**
 * The admin's own tenant's integrations. Secrets are encrypted at rest (when
 * the key is set) and only ever sent to the browser masked.
 */

// GET /api/admin/integrations - List this tenant's integrations
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: integrations, error } = await listTenantIntegrationsMasked(auth.tenant.id);
    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    return NextResponse.json(
      integrations.map((integration) => ({
        ...integration,
        status:
          integration.is_enabled && Object.keys(integration.credentials || {}).length > 0
            ? 'connected'
            : 'disconnected',
      })),
    );
  } catch (error) {
    console.error('Error in GET /api/admin/integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/integrations - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { integration_key, integration_name, is_enabled, credentials, settings } = body;

    if (!integration_key || !integration_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: existing } = await loadIntegration(auth.tenant.id, integration_key);
    if (existing) {
      return NextResponse.json({ error: 'Integration already exists' }, { status: 409 });
    }

    const { data, error } = await saveIntegration(auth.tenant.id, integration_key, {
      integration_name,
      is_enabled: is_enabled || false,
      credentials: credentials || {},
      settings: settings || {},
    });

    if (error || !data) {
      console.error('Error creating integration:', error);
      return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
    }

    return NextResponse.json({ ...data, credentials: maskCredentials(data.credentials) }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

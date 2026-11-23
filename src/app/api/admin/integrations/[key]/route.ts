import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import {
  loadIntegration,
  maskCredentials,
  mergeSubmittedCredentials,
  saveIntegration,
} from '@/lib/integrations/store';
import { clearEmailConfigCache } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

/**
 * One integration of the admin's own tenant. Before, these read, saved and
 * deleted by integration name only, so a save or delete could hit every
 * tenant's row. Secrets are sent to the browser masked.
 */

function connected(row: { is_enabled: boolean; credentials: Record<string, any> }) {
  return row.is_enabled && Object.keys(row.credentials || {}).length > 0 ? 'connected' : 'disconnected';
}

// GET /api/admin/integrations/[key] - Get a specific integration
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: integration, error } = await loadIntegration(auth.tenant.id, params.key);
    if (error || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...integration,
      credentials: maskCredentials(integration.credentials),
      status: connected(integration),
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/integrations/${params.key}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/integrations/[key] - Create or update an integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { integration_name, is_enabled, credentials, settings } = body;

    // Sanitize: webhook_secret_token must live in credentials, never in settings.
    // An older version of the Zoom admin UI saved this field into `settings`,
    // and the webhook handler then picked up the stale value from there
    // instead of the freshly-rotated one in `credentials`, causing every
    // signature check (and Zoom URL validation) to fail. Strip it from
    // settings here so no future save can recreate that dual-location bug.
    const sanitizedCredentials: Record<string, any> = { ...(credentials || {}) };
    const sanitizedSettings: Record<string, any> = { ...(settings || {}) };
    if (Object.prototype.hasOwnProperty.call(sanitizedSettings, 'webhook_secret_token')) {
      const stray = sanitizedSettings.webhook_secret_token;
      if (!sanitizedCredentials.webhook_secret_token && typeof stray === 'string' && stray.trim().length > 0) {
        sanitizedCredentials.webhook_secret_token = stray.trim();
      }
      delete sanitizedSettings.webhook_secret_token;
    }

    // The screen sends secrets back masked when they weren't changed; those
    // keep the saved value.
    const { data: existing } = await loadIntegration(auth.tenant.id, params.key);
    const mergedCredentials = mergeSubmittedCredentials(existing?.credentials, sanitizedCredentials);

    const { data, error } = await saveIntegration(auth.tenant.id, params.key, {
      integration_name,
      is_enabled: is_enabled || false,
      credentials: mergedCredentials,
      settings: sanitizedSettings,
    });

    if (error || !data) {
      console.error('Error updating integration:', error);
      return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
    }

    // New email settings apply to the next email, not after the 5-minute cache.
    if (params.key === 'resend' || params.key === 'smtp') clearEmailConfigCache(auth.tenant.id);

    return NextResponse.json({
      ...data,
      credentials: maskCredentials(data.credentials),
      status: connected(data),
    });
  } catch (error) {
    console.error(`Error in PUT /api/admin/integrations/${params.key}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/integrations/[key] - Delete an integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await createAdminClient()
      .from('integrations')
      .delete()
      .eq('tenant_id', auth.tenant.id)
      .eq('integration_key', params.key);

    if (error) {
      console.error('Error deleting integration:', error);
      return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error in DELETE /api/admin/integrations/${params.key}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

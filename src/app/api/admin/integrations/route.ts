import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

// Helper function to encrypt sensitive data
function encryptCredentials(credentials: Record<string, any>): Record<string, any> {
  // In production, use proper encryption (e.g., crypto-js, node:crypto)
  // For now, we'll just return as-is but mark fields as encrypted
  const encrypted: Record<string, any> = {};

  for (const [key, value] of Object.entries(credentials)) {
    if (typeof value === 'string' && value.length > 0) {
      // In production: encrypted[key] = encrypt(value);
      encrypted[key] = value; // Placeholder - implement actual encryption
    } else {
      encrypted[key] = value;
    }
  }

  return encrypted;
}

// Helper function to decrypt sensitive data
function decryptCredentials(credentials: Record<string, any>): Record<string, any> {
  // In production, use proper decryption
  // For now, just return as-is
  return credentials;
}

// GET /api/admin/integrations - List all integrations
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch all integrations
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .order('integration_name', { ascending: true });

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    // Decrypt credentials before sending to client
    const decryptedIntegrations = (integrations || []).map(integration => ({
      ...integration,
      credentials: decryptCredentials(integration.credentials || {}),
      // Determine status based on whether required credentials are present
      status: integration.is_enabled && integration.credentials &&
              Object.keys(integration.credentials).length > 0
              ? 'connected'
              : 'disconnected'
    }));

    return NextResponse.json(decryptedIntegrations);

  } catch (error) {
    console.error('Error in GET /api/admin/integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/integrations - Create a new integration
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    const body = await request.json();
    const { integration_key, integration_name, is_enabled, credentials, settings } = body;

    // Validate required fields
    if (!integration_key || !integration_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Encrypt credentials before storing
    const encryptedCredentials = encryptCredentials(credentials || {});

    // Insert new integration
    const { data, error } = await supabase
      .from('integrations')
      .insert({
        integration_key,
        integration_name,
        is_enabled: is_enabled || false,
        credentials: encryptedCredentials,
        settings: settings || {},
        webhook_url: `/api/webhooks/${integration_key}`
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating integration:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Integration already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create integration' },
        { status: 500 }
      );
    }

    // Return decrypted data
    return NextResponse.json({
      ...data,
      credentials: decryptCredentials(data.credentials || {})
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
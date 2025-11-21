import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { DocuSignClient } from '@/lib/docusign/client';
import { ZoomClient } from '@/lib/zoom/client';
import Stripe from 'stripe';

// Helper function to encrypt sensitive data
function encryptCredentials(credentials: Record<string, any>): Record<string, any> {
  // In production, use proper encryption (e.g., crypto-js, node:crypto)
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
  return credentials;
}

// GET /api/admin/integrations/[key] - Get a specific integration
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch specific integration
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', params.key)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Decrypt credentials before sending to client
    return NextResponse.json({
      ...integration,
      credentials: decryptCredentials(integration.credentials || {}),
      status: integration.is_enabled && integration.credentials &&
              Object.keys(integration.credentials).length > 0
              ? 'connected'
              : 'disconnected'
    });

  } catch (error) {
    console.error(`Error in GET /api/admin/integrations/${params.key}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/integrations/[key] - Update an integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    const body = await request.json();
    const { integration_name, is_enabled, credentials, settings } = body;

    // Encrypt credentials before storing
    const encryptedCredentials = encryptCredentials(credentials || {});

    // Check if integration exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('integration_key', params.key)
      .single();

    let data;
    let error;

    if (existing) {
      // Update existing integration
      ({ data, error } = await supabase
        .from('integrations')
        .update({
          integration_name,
          is_enabled: is_enabled || false,
          credentials: encryptedCredentials,
          settings: settings || {},
          updated_at: new Date().toISOString()
        })
        .eq('integration_key', params.key)
        .select()
        .single());
    } else {
      // Create new integration
      ({ data, error } = await supabase
        .from('integrations')
        .insert({
          integration_key: params.key,
          integration_name,
          is_enabled: is_enabled || false,
          credentials: encryptedCredentials,
          settings: settings || {},
          webhook_url: `/api/webhooks/${params.key}`
        })
        .select()
        .single());
    }

    if (error) {
      console.error('Error updating integration:', error);
      return NextResponse.json(
        { error: 'Failed to update integration' },
        { status: 500 }
      );
    }

    // Return decrypted data
    return NextResponse.json({
      ...data,
      credentials: decryptCredentials(data.credentials || {})
    });

  } catch (error) {
    console.error(`Error in PUT /api/admin/integrations/${params.key}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/integrations/[key] - Delete an integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    // Delete integration
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('integration_key', params.key);

    if (error) {
      console.error('Error deleting integration:', error);
      return NextResponse.json(
        { error: 'Failed to delete integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error(`Error in DELETE /api/admin/integrations/${params.key}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

// Simple test to verify DocuSign can send envelopes
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { templateId, recipientEmail, recipientName } = body;

    if (!templateId || !recipientEmail || !recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, recipientEmail, recipientName' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get DocuSign credentials
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'docusign')
      .single();

    if (!integration || !integration.is_enabled) {
      return NextResponse.json(
        { error: 'DocuSign integration is not enabled' },
        { status: 400 }
      );
    }

    const credentials = integration.credentials;
    const jwt = require('jsonwebtoken');

    // Get access token
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: credentials.integration_key,
      sub: credentials.user_id,
      aud: credentials.oauth_base_path.replace('https://', ''),
      iat: now,
      exp: now + 3600,
      scope: 'signature impersonation'
    };

    const token = jwt.sign(jwtPayload, credentials.private_key, {
      algorithm: 'RS256'
    });

    const tokenResponse = await fetch(`${credentials.oauth_base_path}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(`Failed to get access token: ${error.error_description || error.error}`);
    }

    const { access_token } = await tokenResponse.json();

    // Create envelope from template
    const envelopeDefinition = {
      templateId: templateId,
      templateRoles: [
        {
          email: recipientEmail,
          name: recipientName,
          roleName: 'Student', // This should match your template role
        }
      ],
      status: 'sent',
      emailSubject: 'Test Document from IPS Platform'
    };

    const envelopeResponse = await fetch(
      `${credentials.base_path}/v2.1/accounts/${credentials.account_id}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      }
    );

    if (!envelopeResponse.ok) {
      const error = await envelopeResponse.json();
      throw new Error(`Failed to create envelope: ${error.message || JSON.stringify(error)}`);
    }

    const envelope = await envelopeResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Test envelope sent successfully!',
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      recipientEmail: recipientEmail
    });

  } catch (error) {
    console.error('Error sending test envelope:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test envelope',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Get Keap integration credentials
    const supabase = await createClient();
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'keap')
      .single();

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Keap integration not found. Please configure Client ID and Client Secret first.' },
        { status: 404 }
      );
    }

    const { client_id, client_secret } = integration.credentials as { client_id: string; client_secret: string };

    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: 'Keap Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/config/integrations`;
    const authString = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    const tokenResponse = await fetch('https://api.infusionsoft.com/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Keap token exchange error:', errorData);
      return NextResponse.json(
        { error: `Failed to exchange authorization code: ${errorData.error_description || errorData.error || 'Unknown error'}` },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();

    // Update integration with new tokens
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        credentials: {
          ...integration.credentials,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('integration_key', 'keap');

    if (updateError) {
      console.error('Error updating Keap tokens:', updateError);
      return NextResponse.json(
        { error: 'Failed to save tokens to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Keap authorization successful',
      data: {
        access_token: tokenData.access_token.substring(0, 10) + '...',
        refresh_token: tokenData.refresh_token.substring(0, 10) + '...',
        expires_in: tokenData.expires_in,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

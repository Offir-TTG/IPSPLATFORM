import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Generate Zoom SDK signature
function generateSignature(
  sdkKey: string,
  sdkSecret: string,
  meetingNumber: string,
  role: number
): string {
  const timestamp = new Date().getTime() - 30000;
  const msg = Buffer.from(sdkKey + meetingNumber + timestamp + role).toString('base64');
  const hash = crypto
    .createHmac('sha256', sdkSecret)
    .update(msg)
    .digest('base64');
  const signature = Buffer.from(`${sdkKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
  return signature;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingNumber, role } = await request.json();

    if (!meetingNumber) {
      return NextResponse.json({ error: 'Meeting number is required' }, { status: 400 });
    }

    // Get user's tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const tenantId = userData?.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User tenant not found' },
        { status: 403 }
      );
    }

    // Get Zoom SDK credentials from integrations table for this tenant
    const { data: zoomIntegration, error: integrationError } = await supabase
      .from('integrations')
      .select('credentials, is_enabled')
      .eq('integration_key', 'zoom')
      .eq('tenant_id', tenantId)
      .single();

    if (integrationError || !zoomIntegration) {
      console.error('Zoom SDK integration not found:', integrationError);
      return NextResponse.json(
        { error: 'Zoom SDK not configured' },
        { status: 500 }
      );
    }

    if (!zoomIntegration.is_enabled) {
      return NextResponse.json(
        { error: 'Zoom integration is not enabled' },
        { status: 403 }
      );
    }

    const sdkKey = zoomIntegration.credentials?.sdk_key || zoomIntegration.credentials?.client_id;
    const sdkSecret = zoomIntegration.credentials?.sdk_secret || zoomIntegration.credentials?.client_secret;

    if (!sdkKey || !sdkSecret) {
      console.error('Zoom SDK credentials missing in integration config');
      return NextResponse.json(
        { error: 'Zoom SDK credentials not configured' },
        { status: 500 }
      );
    }

    // Generate signature
    // role: 0 = participant, 1 = host
    const signature = generateSignature(sdkKey, sdkSecret, meetingNumber, role || 0);

    return NextResponse.json({
      success: true,
      signature,
      sdkKey,
    });
  } catch (error) {
    console.error('Error generating Zoom signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}

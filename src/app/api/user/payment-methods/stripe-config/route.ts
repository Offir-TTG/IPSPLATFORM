import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Get Stripe publishable key for frontend
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'User tenant not found' }, { status: 404 });
    }

    // Get Stripe credentials from integrations table (using admin client to bypass RLS)
    const adminClient = createAdminClient();
    const { data: integration } = await adminClient
      .from('integrations')
      .select('credentials')
      .eq('tenant_id', userData.tenant_id)
      .eq('integration_key', 'stripe')
      .single();

    if (!integration?.credentials?.publishable_key) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    return NextResponse.json({
      publishableKey: integration.credentials.publishable_key,
    });

  } catch (error: any) {
    console.error('Error fetching Stripe config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Stripe configuration' },
      { status: 500 }
    );
  }
}

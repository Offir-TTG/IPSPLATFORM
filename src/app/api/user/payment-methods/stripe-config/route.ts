import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/payments/getStripeClient';

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

    // The tenant's Stripe settings, read server-side through the shared helper.
    let publishableKey = '';
    try {
      ({ publishableKey } = await getStripeClient(userData.tenant_id));
    } catch {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    if (!publishableKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    return NextResponse.json({ publishableKey });

  } catch (error: any) {
    console.error('Error fetching Stripe config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Stripe configuration' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Test Daily.co integration connection
 * Verifies API key is valid by attempting to fetch account info
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Daily.co integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('credentials, is_enabled')
      .eq('integration_key', 'daily')
      .single();

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

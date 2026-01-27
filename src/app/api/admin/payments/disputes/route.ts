import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payments/disputes
 * Get all payment disputes
 */
export async function GET(request: NextRequest) {
  try {
    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const { tenant } = auth;
    const supabase = await createClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // For now, return empty array as disputes table/integration doesn't exist yet
    // This prevents the UI from breaking while the feature is being built
    // TODO: Implement Stripe disputes webhook and database table

    const disputes: any[] = [];

    return NextResponse.json({
      success: true,
      disputes,
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

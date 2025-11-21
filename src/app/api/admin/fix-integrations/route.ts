import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Temporary endpoint to fix integrations tenant_id
 * This sets tenant_id on all integrations that currently have NULL
 */
export async function POST() {
  try {
    const supabase = createAdminClient();

    const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

    // Get integrations without tenant_id
    const { data: before, error: beforeError } = await supabase
      .from('integrations')
      .select('integration_key, id')
      .is('tenant_id', null);

    if (beforeError) {
      console.error('[fix-integrations] Error fetching integrations:', beforeError);
      return NextResponse.json({
        success: false,
        error: beforeError.message
      }, { status: 500 });
    }

    console.log('[fix-integrations] Integrations without tenant_id:', before);

    // Update all integrations without tenant_id
    const { data: updated, error: updateError } = await supabase
      .from('integrations')
      .update({
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      })
      .is('tenant_id', null)
      .select();

    if (updateError) {
      console.error('[fix-integrations] Error updating integrations:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    // Verify the update
    const { data: after, error: afterError } = await supabase
      .from('integrations')
      .select('integration_key, tenant_id, is_enabled')
      .order('integration_key');

    if (afterError) {
      console.error('[fix-integrations] Error verifying:', afterError);
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated?.length || 0} integrations`,
      before: before || [],
      updated: updated || [],
      after: after || []
    });
  } catch (error) {
    console.error('[fix-integrations] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    }, { status: 500 });
  }
}

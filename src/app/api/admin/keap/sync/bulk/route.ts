import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { syncStudentToKeap, isKeapEnabled } from '@/lib/keap/syncService';

export const dynamic = 'force-dynamic';

// POST /api/admin/keap/sync/bulk - Bulk sync all students to Keap
export async function POST(request: NextRequest) {
  try {
    // Check if Keap is enabled
    const enabled = await isKeapEnabled();
    if (!enabled) {
      return NextResponse.json(
        { success: false, error: 'Keap integration is not enabled or configured' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS for admin operations
    const adminSupabase = createAdminClient();
    const { data: userData } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all users (students)
    const { data: users, error } = await adminSupabase
      .from('users')
      .select('id, email, first_name, last_name, phone')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        data: { synced: 0, failed: 0, total: 0 },
        message: 'No users to sync'
      });
    }

    const results = {
      synced: 0,
      failed: 0,
      total: users.length,
      errors: [] as string[]
    };

    // Sync each user
    for (const user of users) {
      try {
        await syncStudentToKeap(
          {
            email: user.email,
            first_name: user.first_name || undefined,
            last_name: user.last_name || undefined,
            phone: user.phone || undefined
          },
          {
            tags: ['LMS Student', 'Bulk Sync'],
            create_note: `Synced via bulk sync on ${new Date().toLocaleDateString()}`
          }
        );
        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log audit event using admin client
    console.log('[BULK SYNC] Attempting to log audit event...');

    // Get user's tenant_id
    const { data: userTenantData } = await adminSupabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const auditData = {
      user_id: user.id,
      user_email: user.email || 'unknown',
      tenant_id: userTenantData?.tenant_id || null,
      event_type: 'SYNC',
      event_category: 'SYSTEM',
      resource_type: 'keap_sync',
      action: 'audit.keap.bulk_sync',
      description: 'audit.keap.bulk_sync_desc',
      new_values: {
        synced: results.synced,
        failed: results.failed,
        total: results.total
      },
      status: 'success',
      risk_level: 'low',
    };
    console.log('[BULK SYNC] Audit data:', JSON.stringify(auditData, null, 2));

    const { data: auditResult, error: auditError } = await adminSupabase
      .from('audit_events')
      .insert(auditData)
      .select();

    if (auditError) {
      console.error('[BULK SYNC] Failed to log audit event:', auditError);
      // Don't fail the request, just log the error
    } else {
      console.log('[BULK SYNC] Audit event logged successfully:', auditResult);
    }

    return NextResponse.json({
      success: true,
      data: {
        synced: results.synced,
        failed: results.failed,
        total: results.total
      },
      message: `Successfully synced ${results.synced} out of ${results.total} students${results.failed > 0 ? ` (${results.failed} failed)` : ''}`,
      errors: results.errors.length > 0 ? results.errors.slice(0, 10) : undefined // Return first 10 errors
    });
  } catch (error) {
    console.error('Error during bulk sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk sync failed'
      },
      { status: 500 }
    );
  }
}

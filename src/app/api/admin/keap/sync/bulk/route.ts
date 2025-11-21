import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncStudentToKeap, isKeapEnabled } from '@/lib/keap/syncService';

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

    // Get all users (students)
    const { data: users, error } = await supabase
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

    // Log audit event
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('audit_events').insert({
        user_id: user.id,
        event_type: 'SYNC',
        event_category: 'INTEGRATION',
        resource_type: 'keap_sync',
        action: 'Bulk sync students to Keap',
        description: `Synced ${results.synced} students, ${results.failed} failed`,
        new_values: {
          synced: results.synced,
          failed: results.failed,
          total: results.total
        },
        risk_level: 'low',
      });
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

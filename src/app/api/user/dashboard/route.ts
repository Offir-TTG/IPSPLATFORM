import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// GET /api/user/dashboard - Get user dashboard data
export const GET = withAuth(
  async (request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();

      // Call the optimized dashboard function (v3 with isolated subqueries to avoid GROUP BY issues)
      const { data, error } = await supabase.rpc('get_user_dashboard_v3', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Dashboard query error:', error);

        // Log failed dashboard access
        logAuditEvent({
          userId: user.id,
          userEmail: user.email || 'unknown',
          action: 'dashboard.access_failed',
          details: {
            resourceType: 'dashboard',
            resourceId: user.id,
            error: error.message,
          },
        }).catch((err) => console.error('Audit log failed:', err));

        return NextResponse.json(
          { success: false, error: 'Failed to fetch dashboard data' },
          { status: 500 }
        );
      }

      // Async audit logging (don't block response)
      logAuditEvent({
        userId: user.id,
        userEmail: user.email || 'unknown',
        action: 'dashboard.accessed',
        details: {
          resourceType: 'dashboard',
          resourceId: user.id,
          enrollmentsCount: data?.enrollments?.length || 0,
          upcomingSessionsCount: data?.upcoming_sessions?.length || 0,
          pendingAssignmentsCount: data?.pending_assignments?.length || 0,
        },
      }).catch((err) => console.error('Audit log failed:', err));

      // Ensure recent_attendance exists (for backwards compatibility before SQL update)
      const dashboardData = data || {
        enrollments: [],
        upcoming_sessions: [],
        pending_assignments: [],
        recent_attendance: [],
        stats: {
          total_courses: 0,
          completed_lessons: 0,
          in_progress_lessons: 0,
          pending_assignments: 0,
          total_attendance: 0,
          attendance_present: 0,
          attendance_rate: 0,
          total_hours_spent: 0,
        },
        recent_activity: [],
      };

      // Add recent_attendance if missing (backwards compatibility)
      if (!dashboardData.recent_attendance) {
        dashboardData.recent_attendance = [];
      }

      // Ensure attendance stats exist (backwards compatibility)
      if (!dashboardData.stats.total_attendance) {
        dashboardData.stats.total_attendance = 0;
      }
      if (!dashboardData.stats.attendance_present) {
        dashboardData.stats.attendance_present = 0;
      }
      if (!dashboardData.stats.attendance_rate) {
        dashboardData.stats.attendance_rate = 0;
      }

      return NextResponse.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Dashboard error:', error);

      // Log error
      logAuditEvent({
        userId: user.id,
        userEmail: user.email || 'unknown',
        action: 'dashboard.error',
        details: {
          resourceType: 'dashboard',
          resourceId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch((err) => console.error('Audit log failed:', err));

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor']
);

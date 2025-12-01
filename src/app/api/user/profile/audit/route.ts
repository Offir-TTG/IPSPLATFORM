import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

// GET /api/user/profile/audit - Get user's profile audit history
export const GET = withAuth(
  async (request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);

      // Pagination parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      // Filter parameters
      const action = searchParams.get('action'); // Filter by action type
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');

      // Build query
      let query = supabase
        .from('audit_events')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (action) {
        query = query.eq('action', action);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: auditEvents, error, count } = await query;

      if (error) {
        console.error('Audit query error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch audit history' },
          { status: 500 }
        );
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil((count || 0) / limit);

      return NextResponse.json({
        success: true,
        data: {
          events: auditEvents || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Audit fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor', 'admin']
);

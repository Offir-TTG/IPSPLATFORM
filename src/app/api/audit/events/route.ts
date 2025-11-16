import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET audit events with filtering
export async function GET(request: NextRequest) {
  try {
    // Use regular client for authentication
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role || 'student';
    const isAdmin = ['admin', 'auditor', 'compliance_officer'].includes(userRole);

    const { searchParams } = new URL(request.url);

    // Parse filters
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const eventTypes = searchParams.get('event_types')?.split(',');
    const eventCategories = searchParams.get('event_categories')?.split(',');
    const resourceTypes = searchParams.get('resource_types')?.split(',');
    const riskLevels = searchParams.get('risk_levels')?.split(',');
    const status = searchParams.get('status')?.split(',');
    const studentId = searchParams.get('student_id');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query using admin client to bypass RLS
    let query = adminClient
      .from('audit_events')
      .select('*', { count: 'exact' });

    // Apply filters
    if (dateFrom) {
      query = query.gte('event_timestamp', dateFrom);
    }
    if (dateTo) {
      query = query.lte('event_timestamp', dateTo);
    }
    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }
    if (eventCategories && eventCategories.length > 0) {
      query = query.in('event_category', eventCategories);
    }
    if (resourceTypes && resourceTypes.length > 0) {
      query = query.in('resource_type', resourceTypes);
    }
    if (riskLevels && riskLevels.length > 0) {
      query = query.in('risk_level', riskLevels);
    }
    if (status && status.length > 0) {
      query = query.in('status', status);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    // Non-admin users can only see their own events
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // For search, we need to fetch all matching records and filter in-app
    // because PostgREST doesn't support JSON text casting in filters
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();

      // Apply text-based filters at database level
      const textSearchConditions = [
        `action.ilike.%${searchTerm}%`,
        `description.ilike.%${searchTerm}%`,
        `resource_name.ilike.%${searchTerm}%`,
        `user_email.ilike.%${searchTerm}%`,
        `event_type.ilike.%${searchTerm}%`,
        `resource_type.ilike.%${searchTerm}%`
      ];

      // Get all events (up to a reasonable limit for searching)
      const searchQuery = query
        .order('event_timestamp', { ascending: false })
        .limit(1000); // Reasonable limit for search

      const { data: allData, error: searchError } = await searchQuery;

      if (searchError) {
        console.error('Audit events search error:', searchError);
        return NextResponse.json({ error: searchError.message }, { status: 500 });
      }

      // Filter in application to include JSON field search
      const filteredData = (allData || []).filter((event: any) => {
        const searchLower = searchTerm;

        // Check text fields
        if (event.action?.toLowerCase().includes(searchLower)) return true;
        if (event.description?.toLowerCase().includes(searchLower)) return true;
        if (event.resource_name?.toLowerCase().includes(searchLower)) return true;
        if (event.user_email?.toLowerCase().includes(searchLower)) return true;
        if (event.event_type?.toLowerCase().includes(searchLower)) return true;
        if (event.resource_type?.toLowerCase().includes(searchLower)) return true;

        // Check JSON fields
        if (event.old_values) {
          const oldStr = JSON.stringify(event.old_values).toLowerCase();
          if (oldStr.includes(searchLower)) return true;
        }
        if (event.new_values) {
          const newStr = JSON.stringify(event.new_values).toLowerCase();
          if (newStr.includes(searchLower)) return true;
        }

        return false;
      });

      // Paginate the filtered results
      const paginatedData = filteredData.slice(offset, offset + limit);
      const totalCount = filteredData.length;

      return NextResponse.json({
        success: true,
        data: paginatedData,
        count: totalCount,
        limit,
        offset,
        is_admin: isAdmin,
      });
    }

    // No search - use normal database pagination
    query = query
      .order('event_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Audit events query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      count,
      limit,
      offset,
      is_admin: isAdmin,
    });
  } catch (error: any) {
    console.error('Get audit events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit events' },
      { status: 500 }
    );
  }
}

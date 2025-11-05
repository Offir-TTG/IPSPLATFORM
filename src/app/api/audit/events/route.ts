import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET audit events with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const userRole = user.user_metadata?.role || 'user';
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

    // Build query
    let query = supabase
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
    if (search) {
      query = query.textSearch('search_vector', search);
    }

    // Non-admin users can only see their own events
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Order and paginate
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

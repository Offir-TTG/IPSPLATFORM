import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET student record access logs (FERPA compliance)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    // Check permissions
    const userRole = user.user_metadata?.role || 'user';
    const isAdmin = ['admin', 'auditor', 'compliance_officer'].includes(userRole);
    const isParent = userRole === 'parent';
    const isStudent = userRole === 'student' && user.id === studentId;

    // Only admin, parent, or the student themselves can view
    if (!isAdmin && !isParent && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use the student record access view
    let query = supabase
      .from('audit_student_record_access')
      .select('*')
      .eq('student_id', studentId);

    if (dateFrom) {
      query = query.gte('event_timestamp', dateFrom);
    }
    if (dateTo) {
      query = query.lte('event_timestamp', dateTo);
    }

    query = query.order('event_timestamp', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Student record access query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      student_id: studentId,
    });
  } catch (error: any) {
    console.error('Get student access logs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch student access logs' },
      { status: 500 }
    );
  }
}

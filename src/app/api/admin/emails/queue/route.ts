import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailStatus, EmailPriority } from '@/types/email';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user to verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify admin role
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = userData.tenant_id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const status = searchParams.get('status') as EmailStatus | null;
    const priority = searchParams.get('priority') as EmailPriority | null;
    const search = searchParams.get('search');

    const offset = (page - 1) * perPage;

    // Build query
    let query = supabase
      .from('email_queue')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (search) {
      query = query.or(`to_email.ilike.%${search}%,subject.ilike.%${search}%,to_name.ilike.%${search}%`);
    }

    // Order by created_at descending (newest first)
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + perPage - 1);

    const { data: emails, error, count } = await query;

    if (error) {
      console.error('Error fetching email queue:', error);
      return NextResponse.json({ error: 'Failed to fetch email queue' }, { status: 500 });
    }

    return NextResponse.json({
      emails: emails || [],
      total: count || 0,
      page,
      per_page: perPage,
      has_more: count ? count > offset + perPage : false,
    });

  } catch (error: any) {
    console.error('Error in email queue API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

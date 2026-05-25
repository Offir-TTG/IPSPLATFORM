import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailStatus, EmailPriority } from '@/types/email';
import { renderQueueSubject } from '@/lib/email/renderQueueSubject';

// Reads request-scoped APIs (cookies / searchParams / dynamic params) —
// must run per-request, never pre-rendered.
export const dynamic = 'force-dynamic';

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

    // Render the subject column on the fly so the list shows the
    // recipient-facing subject even for rows enqueued before we
    // started writing the rendered text back at queue time. Cheap:
    // simple `{{var}}` substitution per row, no DB hits, no Handlebars
    // unless the subject actually contains placeholders. Tenant name
    // is fetched once and reused as `organizationName` for all rows.
    let organizationName = 'Learning Platform';
    if ((emails?.length ?? 0) > 0) {
      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenantId)
        .single();
      if (tenantRow?.name) organizationName = tenantRow.name;
    }
    const renderedEmails = (emails ?? []).map((e) => {
      const tvars = (e.template_variables ?? {}) as Record<string, any>;
      const vars: Record<string, any> = {
        organizationName,
        userName: e.to_name || e.to_email || 'there',
        language: e.language_code || 'en',
        ...tvars,
      };
      return {
        ...e,
        subject: renderQueueSubject(e.subject || '', vars),
      };
    });

    return NextResponse.json({
      emails: renderedEmails,
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

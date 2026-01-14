import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenantId = userData.tenant_id;

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get emails sent in last 30 days
    const { count: sentCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'sent')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get pending emails
    const { count: pendingCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending');

    // Get total templates count
    const { count: templatesCount } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    // Get open rate from email_analytics if it exists
    // For now, we'll return 0 since analytics table might not exist yet
    let openRate = 0;

    // Try to get analytics data if table exists
    try {
      const { data: analyticsData } = await supabase
        .from('email_analytics')
        .select('tracking_id, opened_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (analyticsData && sentCount && sentCount > 0) {
        const openedCount = analyticsData.filter(a => a.opened_at).length;
        openRate = Math.round((openedCount / sentCount) * 100);
      }
    } catch (error) {
      // Analytics table might not exist yet, that's ok
      console.log('Email analytics not available yet');
    }

    return NextResponse.json({
      emailsSent: sentCount || 0,
      openRate,
      pending: pendingCount || 0,
      templates: templatesCount || 0,
    });

  } catch (error: any) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email statistics' },
      { status: 500 }
    );
  }
}

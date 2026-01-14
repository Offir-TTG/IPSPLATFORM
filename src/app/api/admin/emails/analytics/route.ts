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
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get overall summary statistics
    const { data: sentEmails } = await supabase
      .from('email_queue')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString());

    const totalSent = sentEmails?.filter(e => e.status === 'sent').length || 0;
    const totalFailed = sentEmails?.filter(e => e.status === 'failed').length || 0;
    const totalPending = sentEmails?.filter(e => e.status === 'pending').length || 0;
    const totalDelivered = totalSent;

    // Try to get analytics data (may not exist if table doesn't exist)
    let totalOpened = 0;
    let totalClicked = 0;
    let totalBounced = 0;

    try {
      const { data: analyticsData } = await supabase
        .from('email_analytics')
        .select('opened_at, clicked_at, bounced_at')
        .in('email_queue_id', sentEmails?.map(e => e.id) || []);

      if (analyticsData) {
        totalOpened = analyticsData.filter(a => a.opened_at).length;
        totalClicked = analyticsData.filter(a => a.clicked_at).length;
        totalBounced = analyticsData.filter(a => a.bounced_at).length;
      }
    } catch (error) {
      console.log('Email analytics table not available');
    }

    // Calculate rates
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const deliveryRate = (totalSent + totalPending) > 0 ? (totalDelivered / (totalSent + totalPending + totalFailed)) * 100 : 0;

    const summary = {
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_failed: totalFailed,
      total_pending: totalPending,
      total_opened: totalOpened,
      total_clicked: totalClicked,
      total_bounced: totalBounced,
      open_rate: openRate,
      click_rate: clickRate,
      bounce_rate: bounceRate,
      delivery_rate: deliveryRate,
    };

    // Get template performance
    const templates: any[] = [];

    try {
      // Get all templates (not just active ones) that have sent emails
      const { data: allTemplates } = await supabase
        .from('email_templates')
        .select('id, template_name')
        .eq('tenant_id', tenantId);

      if (allTemplates) {
        for (const template of allTemplates) {
          // Get emails sent with this template
          const { data: templateEmails } = await supabase
            .from('email_queue')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('template_id', template.id)
            .eq('status', 'sent')
            .gte('created_at', startDate.toISOString());

          const templateSent = templateEmails?.length || 0;

          if (templateSent > 0) {
            // Get analytics for this template's emails
            let templateOpened = 0;
            let templateClicked = 0;

            try {
              const { data: templateAnalytics } = await supabase
                .from('email_analytics')
                .select('opened_at, clicked_at')
                .in('email_queue_id', templateEmails?.map(e => e.id) || []);

              if (templateAnalytics) {
                templateOpened = templateAnalytics.filter(a => a.opened_at).length;
                templateClicked = templateAnalytics.filter(a => a.clicked_at).length;
              }
            } catch (error) {
              // Analytics not available
            }

            templates.push({
              template_id: template.id,
              template_name: template.template_name,
              total_sent: templateSent,
              total_opened: templateOpened,
              total_clicked: templateClicked,
              open_rate: (templateOpened / templateSent) * 100,
              click_rate: (templateClicked / templateSent) * 100,
            });
          }
        }
      }
    } catch (error) {
      console.log('Error fetching template analytics:', error);
    }

    // Sort templates by total sent (descending)
    templates.sort((a, b) => b.total_sent - a.total_sent);

    return NextResponse.json({
      summary,
      templates,
    });

  } catch (error: any) {
    console.error('Error in email analytics API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

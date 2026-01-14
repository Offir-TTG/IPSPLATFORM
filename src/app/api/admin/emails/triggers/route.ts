import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateTriggerRequest } from '@/types/email';

// =====================================================
// GET - List all triggers for tenant
// =====================================================
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
    const isActive = searchParams.get('is_active');
    const triggerEvent = searchParams.get('trigger_event');

    // Build query
    let query = supabase
      .from('email_triggers')
      .select(`
        id,
        trigger_name,
        trigger_event,
        template_id,
        conditions,
        delay_minutes,
        send_time,
        send_days_before,
        is_active,
        recipient_role,
        recipient_field,
        priority,
        created_at,
        updated_at,
        email_templates (
          id,
          template_name,
          template_key
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (triggerEvent) {
      query = query.eq('trigger_event', triggerEvent);
    }

    const { data: triggers, error } = await query;

    if (error) {
      console.error('Error fetching triggers:', error);
      return NextResponse.json({ error: 'Failed to fetch triggers' }, { status: 500 });
    }

    // Format response to flatten template data
    const formattedTriggers = triggers?.map(trigger => {
      const emailTemplate = Array.isArray(trigger.email_templates) ? trigger.email_templates[0] : trigger.email_templates;
      return {
        ...trigger,
        template_name: (emailTemplate as any)?.template_name || '',
        template_key: (emailTemplate as any)?.template_key || '',
        email_templates: undefined, // Remove nested object
      };
    });

    return NextResponse.json({
      triggers: formattedTriggers || [],
      total: formattedTriggers?.length || 0,
    });

  } catch (error: any) {
    console.error('Error in triggers API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - Create new trigger
// =====================================================
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateTriggerRequest = await request.json();

    // Validate required fields
    if (!body.trigger_name || !body.trigger_event || !body.template_id) {
      return NextResponse.json(
        { error: 'Missing required fields: trigger_name, trigger_event, template_id' },
        { status: 400 }
      );
    }

    // Verify template exists and belongs to tenant
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', body.template_id)
      .eq('tenant_id', tenantId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or does not belong to your organization' },
        { status: 404 }
      );
    }

    // Create trigger
    const { data: trigger, error: createError } = await supabase
      .from('email_triggers')
      .insert({
        tenant_id: tenantId,
        trigger_name: body.trigger_name,
        trigger_event: body.trigger_event,
        template_id: body.template_id,
        conditions: body.conditions || null,
        delay_minutes: body.delay_minutes || 0,
        send_time: body.send_time || null,
        send_days_before: body.send_days_before || null,
        recipient_role: body.recipient_role || null,
        recipient_field: body.recipient_field || null,
        priority: body.priority || 'normal',
        is_active: true,
        created_by: user.id,
      })
      .select(`
        id,
        trigger_name,
        trigger_event,
        template_id,
        conditions,
        delay_minutes,
        send_time,
        send_days_before,
        is_active,
        recipient_role,
        recipient_field,
        priority,
        created_at,
        updated_at,
        email_templates (
          id,
          template_name,
          template_key
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating trigger:', createError);
      return NextResponse.json(
        { error: 'Failed to create trigger' },
        { status: 500 }
      );
    }

    // Format response
    const emailTemplate3 = Array.isArray(trigger.email_templates) ? trigger.email_templates[0] : trigger.email_templates;
    const formattedTrigger = {
      ...trigger,
      template_name: (emailTemplate3 as any)?.template_name || '',
      template_key: (emailTemplate3 as any)?.template_key || '',
      email_templates: undefined,
    };

    return NextResponse.json({
      trigger: formattedTrigger,
      message: 'Trigger created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating trigger:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

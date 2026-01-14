import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// GET - Get single trigger by ID
// =====================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const triggerId = params.id;

    // Fetch trigger
    const { data: trigger, error } = await supabase
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
          template_key,
          template_category
        )
      `)
      .eq('id', triggerId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    // Format response
    const formattedTrigger = {
      ...trigger,
      template_name: trigger.email_templates?.template_name || '',
      template_key: trigger.email_templates?.template_key || '',
      template_category: trigger.email_templates?.template_category || '',
      email_templates: undefined,
    };

    return NextResponse.json({ trigger: formattedTrigger });

  } catch (error: any) {
    console.error('Error fetching trigger:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH - Update trigger
// =====================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const triggerId = params.id;

    // Parse request body
    const body = await request.json();

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.trigger_name !== undefined) updateData.trigger_name = body.trigger_name;
    if (body.trigger_event !== undefined) updateData.trigger_event = body.trigger_event;
    if (body.template_id !== undefined) updateData.template_id = body.template_id;
    if (body.conditions !== undefined) updateData.conditions = body.conditions;
    if (body.delay_minutes !== undefined) updateData.delay_minutes = body.delay_minutes;
    if (body.send_time !== undefined) updateData.send_time = body.send_time;
    if (body.send_days_before !== undefined) updateData.send_days_before = body.send_days_before;
    if (body.recipient_role !== undefined) updateData.recipient_role = body.recipient_role;
    if (body.recipient_field !== undefined) updateData.recipient_field = body.recipient_field;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Verify template exists if being updated
    if (body.template_id) {
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
    }

    // Update trigger
    const { data: trigger, error: updateError } = await supabase
      .from('email_triggers')
      .update(updateData)
      .eq('id', triggerId)
      .eq('tenant_id', tenantId)
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

    if (updateError || !trigger) {
      console.error('Error updating trigger:', updateError);
      return NextResponse.json(
        { error: 'Failed to update trigger' },
        { status: 500 }
      );
    }

    // Format response
    const formattedTrigger = {
      ...trigger,
      template_name: trigger.email_templates?.template_name || '',
      template_key: trigger.email_templates?.template_key || '',
      email_templates: undefined,
    };

    return NextResponse.json({
      trigger: formattedTrigger,
      message: 'Trigger updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating trigger:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE - Delete trigger
// =====================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const triggerId = params.id;

    // Delete trigger
    const { error: deleteError } = await supabase
      .from('email_triggers')
      .delete()
      .eq('id', triggerId)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Error deleting trigger:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete trigger' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Trigger deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting trigger:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

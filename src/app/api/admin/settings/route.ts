import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/auditService';

// GET all platform settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('platform_settings')
      .select('*')
      .order('category')
      .order('label');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: settings, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Create new setting
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const {
      setting_key,
      setting_value,
      setting_type,
      category,
      label,
      description,
      is_public,
    } = await request.json();

    if (!setting_key || !setting_value || !setting_type || !category || !label) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: setting, error } = await supabase
      .from('platform_settings')
      .insert({
        setting_key,
        setting_value,
        setting_type,
        category,
        label,
        description,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Audit log
    await logAuditEvent({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'CONFIG',
      resource_type: 'platform_setting',
      resource_id: setting.id,
      resource_name: setting_key,
      action: 'Created platform setting',
      description: `Created setting: ${label} (${setting_key})`,
      new_values: { setting_key, setting_value, setting_type, category, label, is_public },
      status: 'success',
      risk_level: 'medium',
      metadata: { category, setting_type }
    });

    return NextResponse.json({
      success: true,
      data: setting,
      message: 'Setting created successfully',
    });
  } catch (error) {
    console.error('Create setting error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create setting' },
      { status: 500 }
    );
  }
}

// PUT - Bulk update settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { settings } = await request.json();

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Get old values for audit
    const oldSettingsData = await supabase
      .from('platform_settings')
      .select('*')
      .in('setting_key', settings.map((s: any) => s.setting_key));

    const oldSettings = oldSettingsData.data || [];

    // Update each setting
    const updatePromises = settings.map(async (setting: any) => {
      return supabase
        .from('platform_settings')
        .update({ setting_value: setting.setting_value })
        .eq('setting_key', setting.setting_key)
        .select()
        .single();
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update some settings' },
        { status: 500 }
      );
    }

    // Audit log for each updated setting
    for (const setting of settings) {
      const oldSetting = oldSettings.find((s: any) => s.setting_key === setting.setting_key);
      if (oldSetting) {
        await logAuditEvent({
          user_id: user.id,
          event_type: 'UPDATE',
          event_category: 'CONFIG',
          resource_type: 'platform_setting',
          resource_id: oldSetting.id,
          resource_name: setting.setting_key,
          action: 'Updated platform setting',
          description: `Updated setting: ${oldSetting.label} (${setting.setting_key})`,
          old_values: { setting_value: oldSetting.setting_value },
          new_values: { setting_value: setting.setting_value },
          status: 'success',
          risk_level: 'medium',
          metadata: { category: oldSetting.category, setting_type: oldSetting.setting_type }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${settings.length} settings updated successfully`,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// DELETE - Delete setting
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('key');

    if (!settingKey) {
      return NextResponse.json(
        { success: false, error: 'Setting key is required' },
        { status: 400 }
      );
    }

    // Get setting for audit before deleting
    const { data: setting } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('setting_key', settingKey)
      .single();

    const { error } = await supabase
      .from('platform_settings')
      .delete()
      .eq('setting_key', settingKey);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Audit log
    if (setting) {
      await logAuditEvent({
        user_id: user.id,
        event_type: 'DELETE',
        event_category: 'CONFIG',
        resource_type: 'platform_setting',
        resource_id: setting.id,
        resource_name: settingKey,
        action: 'Deleted platform setting',
        description: `Deleted setting: ${setting.label} (${settingKey})`,
        old_values: { setting_key: settingKey, setting_value: setting.setting_value, setting_type: setting.setting_type, category: setting.category, label: setting.label },
        status: 'success',
        risk_level: 'high',
        metadata: { category: setting.category, setting_type: setting.setting_type }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}

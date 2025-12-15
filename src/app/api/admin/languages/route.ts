import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/auditService';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

// GET all languages
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: languages, error } = await supabase
      .from('languages')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Get languages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}

// POST - Create new language
export async function POST(request: NextRequest) {
  try {
    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();

    const { code, name, native_name, direction, is_active, is_default, currency_code, currency_symbol, currency_position } = await request.json();

    if (!code || !name || !native_name || !direction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('languages')
        .update({ is_default: false })
        .neq('code', code);
    }

    const { data: language, error } = await supabase
      .from('languages')
      .insert({
        code,
        name,
        native_name,
        direction,
        is_active: is_active ?? true,
        is_default: is_default ?? false,
        currency_code,
        currency_symbol,
        currency_position,
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
      resource_type: 'language',
      resource_id: language.id,
      resource_name: `${name} (${code})`,
      action: 'Created language',
      description: `Created language: ${native_name} (${code})`,
      new_values: { code, name, native_name, direction, is_active, is_default, currency_code, currency_symbol, currency_position },
      status: 'success',
      risk_level: 'medium',
      metadata: { direction, is_default, currency_code }
    });

    return NextResponse.json({
      success: true,
      data: language,
      message: 'Language created successfully',
    });
  } catch (error) {
    console.error('Create language error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create language' },
      { status: 500 }
    );
  }
}

// PUT - Update language
export async function PUT(request: NextRequest) {
  try {
    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();

    const { code, name, native_name, direction, is_active, is_default, currency_code, currency_symbol, currency_position } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Language code is required' },
        { status: 400 }
      );
    }

    // Get old values for audit
    const { data: oldLanguage } = await supabase
      .from('languages')
      .select('*')
      .eq('code', code)
      .single();

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('languages')
        .update({ is_default: false })
        .neq('code', code);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (native_name) updateData.native_name = native_name;
    if (direction) updateData.direction = direction;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_default !== undefined) updateData.is_default = is_default;
    if (currency_code !== undefined) updateData.currency_code = currency_code;
    if (currency_symbol !== undefined) updateData.currency_symbol = currency_symbol;
    if (currency_position !== undefined) updateData.currency_position = currency_position;

    const { data: language, error } = await supabase
      .from('languages')
      .update(updateData)
      .eq('code', code)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Audit log
    if (oldLanguage) {
      const changedFields = Object.keys(updateData);
      await logAuditEvent({
        user_id: user.id,
        event_type: 'UPDATE',
        event_category: 'CONFIG',
        resource_type: 'language',
        resource_id: oldLanguage.id,
        resource_name: `${oldLanguage.name} (${code})`,
        action: 'Updated language',
        description: `Updated language: ${oldLanguage.native_name} (${code})`,
        old_values: Object.fromEntries(changedFields.map(k => [k, oldLanguage[k]])),
        new_values: updateData,
        status: 'success',
        risk_level: is_default ? 'high' : 'medium',
        metadata: { direction: oldLanguage.direction, was_default: oldLanguage.is_default, is_default }
      });
    }

    return NextResponse.json({
      success: true,
      data: language,
      message: 'Language updated successfully',
    });
  } catch (error) {
    console.error('Update language error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update language' },
      { status: 500 }
    );
  }
}

// DELETE - Delete language
export async function DELETE(request: NextRequest) {
  try {
    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Language code is required' },
        { status: 400 }
      );
    }

    // Check if it's the default language
    const { data: language } = await supabase
      .from('languages')
      .select('id, code, name, native_name, direction, is_default, is_active')
      .eq('code', code)
      .single();

    if (language?.is_default) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default language' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('languages')
      .delete()
      .eq('code', code);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Audit log
    if (language) {
      await logAuditEvent({
        user_id: user.id,
        event_type: 'DELETE',
        event_category: 'CONFIG',
        resource_type: 'language',
        resource_id: language.id,
        resource_name: `${language.name} (${code})`,
        action: 'Deleted language',
        description: `Deleted language: ${language.native_name} (${code})`,
        old_values: { code, name: language.name, native_name: language.native_name, direction: language.direction, is_active: language.is_active },
        status: 'success',
        risk_level: 'high',
        metadata: { direction: language.direction, was_default: language.is_default }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Language deleted successfully',
    });
  } catch (error) {
    console.error('Delete language error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete language' },
      { status: 500 }
    );
  }
}

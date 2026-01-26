import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/auditService';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { getServerTranslations, translate } from '@/lib/translations/serverTranslations';

export const dynamic = 'force-dynamic';

// Translation keys for this module
const TRANSLATION_KEYS = [
  'api.languages.error.unauthorized',
  'api.languages.error.missing_fields',
  'api.languages.error.fetch_failed',
  'api.languages.error.create_failed',
  'api.languages.error.update_failed',
  'api.languages.error.delete_failed',
  'api.languages.error.code_required',
  'api.languages.error.not_found',
  'api.languages.error.cannot_delete_default',
  'api.languages.success.created',
  'api.languages.success.updated',
  'api.languages.success.deleted',
  'api.languages.success.activated',
  'api.languages.success.deactivated'
];

async function getUserLanguage(request: NextRequest): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('getUserLanguage: No user found, defaulting to en');
      return 'en';
    }

    // Language preference is stored in users.preferred_language column
    const { data: userData } = await supabase
      .from('users')
      .select('preferred_language')
      .eq('id', user.id)
      .maybeSingle();

    const languageCode = userData?.preferred_language || 'en';
    console.log(`getUserLanguage: User ${user.id} has language preference: ${languageCode}`);
    return languageCode;
  } catch (error) {
    console.error('getUserLanguage error:', error);
    return 'en';
  }
}

// GET all languages
export async function GET(request: NextRequest) {
  try {
    const languageCode = await getUserLanguage(request);
    const translations = await getServerTranslations(languageCode, TRANSLATION_KEYS);

    // Use admin client to bypass RLS and get all languages (including inactive)
    const adminClient = createAdminClient();
    const { data: languages, error } = await adminClient
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
    const languageCode = 'en';
    const translations = await getServerTranslations(languageCode, TRANSLATION_KEYS);

    return NextResponse.json(
      {
        success: false,
        error: translate(translations, 'api.languages.error.fetch_failed', 'Failed to fetch languages')
      },
      { status: 500 }
    );
  }
}

// POST - Create new language
export async function POST(request: NextRequest) {
  try {
    const languageCode = await getUserLanguage(request);
    const translations = await getServerTranslations(languageCode, TRANSLATION_KEYS);

    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: translate(translations, 'api.languages.error.unauthorized', 'Unauthorized or insufficient permissions')
        },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();

    const { code, name, native_name, direction, is_active, is_default, currency_code, currency_symbol, currency_position } = await request.json();

    if (!code || !name || !native_name || !direction) {
      return NextResponse.json(
        {
          success: false,
          error: translate(translations, 'api.languages.error.missing_fields', 'Missing required fields')
        },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for global configuration table
    const adminClient = createAdminClient();

    // If setting as default, unset other defaults
    if (is_default) {
      await adminClient
        .from('languages')
        .update({ is_default: false })
        .neq('code', code);
    }

    const { data: language, error } = await adminClient
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
      message: translate(translations, 'api.languages.success.created', 'Language created successfully'),
    });
  } catch (error) {
    console.error('Create language error:', error);
    const languageCode = 'en';
    const translations = await getServerTranslations(languageCode, TRANSLATION_KEYS);

    return NextResponse.json(
      {
        success: false,
        error: translate(translations, 'api.languages.error.create_failed', 'Failed to create language')
      },
      { status: 500 }
    );
  }
}

// PUT - Update language
export async function PUT(request: NextRequest) {
  try {
    const languageCode = await getUserLanguage(request);
    const translations = await getServerTranslations(languageCode, TRANSLATION_KEYS);

    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: translate(translations, 'api.languages.error.unauthorized', 'Unauthorized or insufficient permissions')
        },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();

    const body = await request.json();
    const { code, name, native_name, direction, is_active, is_default, currency_code, currency_symbol, currency_position } = body;

    console.log('PUT /api/admin/languages - Request body:', body);

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: translate(translations, 'api.languages.error.code_required', 'Language code is required')
        },
        { status: 400 }
      );
    }

    // Get old values for audit
    const { data: oldLanguage, error: oldFetchError } = await supabase
      .from('languages')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    console.log('PUT /api/admin/languages - Found language:', oldLanguage);
    if (oldFetchError) {
      console.error('PUT /api/admin/languages - Old fetch error:', oldFetchError);
    }

    // Use admin client to bypass RLS for global configuration table
    const adminClient = createAdminClient();

    // If setting as default, unset other defaults
    if (is_default) {
      await adminClient
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

    console.log('PUT /api/admin/languages - updateData:', updateData);

    // Perform the update using admin client (already created above)
    const { data: language, error: updateError } = await adminClient
      .from('languages')
      .update(updateData)
      .eq('code', code)
      .select()
      .single();

    console.log('PUT /api/admin/languages - Update error:', updateError);
    console.log('PUT /api/admin/languages - Updated language:', language);

    if (updateError) {
      console.error('Language update error:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    if (!language) {
      return NextResponse.json(
        {
          success: false,
          error: translate(translations, 'api.languages.error.not_found', 'Language not found')
        },
        { status: 404 }
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

    // Determine appropriate success message based on what changed
    let successMessage;
    if (oldLanguage && is_active !== undefined && oldLanguage.is_active !== is_active) {
      // Status changed
      if (is_active === true) {
        successMessage = translate(translations, 'api.languages.success.activated', 'Language activated successfully');
      } else {
        successMessage = translate(translations, 'api.languages.success.deactivated', 'Language deactivated successfully');
      }
    } else {
      // Other updates
      successMessage = translate(translations, 'api.languages.success.updated', 'Language updated successfully');
    }

    return NextResponse.json({
      success: true,
      data: language,
      message: successMessage,
    });
  } catch (error) {
    console.error('Update language error:', error);
    const languageCode = 'en';
    const translations = await getServerTranslations(languageCode, TRANSLATION_KEYS);

    return NextResponse.json(
      {
        success: false,
        error: translate(translations, 'api.languages.error.update_failed', 'Failed to update language')
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete language
export async function DELETE(request: NextRequest) {
  try {
    const languageCode = await getUserLanguage(request);
    const translations = await getServerTranslations(languageCode, TRANSLATION_KEYS);

    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: translate(translations, 'api.languages.error.unauthorized', 'Unauthorized or insufficient permissions')
        },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: translate(translations, 'api.languages.error.code_required', 'Language code is required')
        },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for global configuration table
    const adminClient = createAdminClient();

    // Check if it's the default language
    const { data: language } = await adminClient
      .from('languages')
      .select('id, code, name, native_name, direction, is_default, is_active')
      .eq('code', code)
      .single();

    if (language?.is_default) {
      return NextResponse.json(
        {
          success: false,
          error: translate(translations, 'api.languages.error.cannot_delete_default', 'Cannot delete default language')
        },
        { status: 400 }
      );
    }

    const { error } = await adminClient
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
      message: translate(translations, 'api.languages.success.deleted', 'Language deleted successfully'),
    });
  } catch (error) {
    console.error('Delete language error:', error);
    const languageCode = 'en';
    const translations = await getServerTranslations(languageCode, TRANSLATION_KEYS);

    return NextResponse.json(
      {
        success: false,
        error: translate(translations, 'api.languages.error.delete_failed', 'Failed to delete language')
      },
      { status: 500 }
    );
  }
}

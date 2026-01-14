import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

// Helper function to clear translation cache
async function clearCache() {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/translations`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// GET all translations (optionally filtered by language or category)
export async function GET(request: NextRequest) {
  try {
    // Verify tenant admin to get tenant_id
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const { tenant } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('language');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search');

    // Get total count first - filter by tenant_id
    let countQuery = supabase
      .from('translations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id);

    if (languageCode) {
      countQuery = countQuery.eq('language_code', languageCode);
    }

    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category);
    }

    // Step 1: Get unique translation keys with filters
    let keysQuery = supabase
      .from('translations')
      .select('translation_key, category')
      .eq('tenant_id', tenant.id);

    if (category && category !== 'all') {
      keysQuery = keysQuery.eq('category', category);
    }

    // If searching, filter by search term
    if (search) {
      keysQuery = keysQuery.or(`translation_key.ilike.%${search}%,translation_value.ilike.%${search}%`);
    }

    const { data: allKeys, error: keysError } = await keysQuery;

    if (keysError) {
      return NextResponse.json(
        { success: false, error: keysError.message },
        { status: 500 }
      );
    }

    // Get unique translation keys
    const uniqueKeys = Array.from(new Set(allKeys?.map(t => t.translation_key) || []));
    const totalUniqueKeys = uniqueKeys.length;

    // Step 2: Paginate the unique keys
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedKeys = uniqueKeys.slice(startIndex, endIndex);

    // Step 3: Fetch ALL languages for the paginated keys
    let query = supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .in('translation_key', paginatedKeys)
      .order('category')
      .order('translation_key')
      .order('language_code');

    if (languageCode) {
      query = query.eq('language_code', languageCode);
    }

    const { data: translations, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: translations,
      pagination: {
        page,
        pageSize,
        total: totalUniqueKeys,
        totalPages: Math.ceil(totalUniqueKeys / pageSize),
      },
    });
  } catch (error) {
    console.error('Get translations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch translations' },
      { status: 500 }
    );
  }
}

// POST - Create or update translation
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

    const { language_code, translation_key, translation_value, category, context } = await request.json();

    if (!language_code || !translation_key || !translation_value) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine context based on translation_key if not provided
    const translationContext = context || (translation_key.startsWith('admin.') ? 'admin' : 'user');

    // Upsert translation using raw SQL since the unique constraint includes context
    const upsertData = {
      language_code,
      translation_key,
      translation_value,
      category: category || translation_key.split('.')[0],
      context: translationContext,
      tenant_id: tenant.id,
      updated_at: new Date().toISOString(),
    };

    // Use database function to handle upsert with partial unique indexes
    const { data, error } = await supabase.rpc('upsert_translation', {
      p_language_code: language_code,
      p_translation_key: translation_key,
      p_translation_value: translation_value,
      p_category: upsertData.category,
      p_context: translationContext,
      p_tenant_id: tenant.id
    });

    if (error) {
      console.error('Translation upsert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const translation = Array.isArray(data) ? data[0] : data;

    if (!translation) {
      console.error('No translation data returned from upsert');
      return NextResponse.json(
        { success: false, error: 'Failed to upsert translation - no data returned' },
        { status: 500 }
      );
    }

    // Clear cache
    await clearCache();

    return NextResponse.json({
      success: true,
      data: translation,
      message: 'Translation saved successfully',
    });
  } catch (error) {
    console.error('Save translation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save translation' },
      { status: 500 }
    );
  }
}

// PUT - Bulk update translations
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

    const { tenant } = auth;
    const supabase = await createClient();

    const { language_code, translations } = await request.json();

    if (!language_code || !translations || !Array.isArray(translations)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Use database function for each translation
    const results = await Promise.all(
      translations.map(async (t: any) => {
        const translationContext = t.context || (t.key.startsWith('admin.') ? 'admin' : 'user');
        return supabase.rpc('upsert_translation', {
          p_language_code: language_code,
          p_translation_key: t.key,
          p_translation_value: t.value,
          p_category: t.category || t.key.split('.')[0],
          p_context: translationContext,
          p_tenant_id: tenant.id
        });
      })
    );

    // Check for errors
    const hasError = results.some(r => r.error);
    if (hasError) {
      const firstError = results.find(r => r.error)?.error;
      return NextResponse.json(
        { success: false, error: firstError?.message || 'Failed to update some translations' },
        { status: 500 }
      );
    }

    const data = results.map(r => Array.isArray(r.data) ? r.data[0] : r.data).filter(Boolean);

    // Clear cache
    await clearCache();

    return NextResponse.json({
      success: true,
      data,
      message: `${data.length} translations updated successfully`,
    });
  } catch (error) {
    console.error('Bulk update translations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update translations' },
      { status: 500 }
    );
  }
}

// DELETE - Delete translation
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
    const languageCode = searchParams.get('language');
    const translationKey = searchParams.get('key');

    if (!languageCode || !translationKey) {
      return NextResponse.json(
        { success: false, error: 'Language code and translation key are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('translations')
      .delete()
      .eq('language_code', languageCode)
      .eq('translation_key', translationKey);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Clear cache
    await clearCache();

    return NextResponse.json({
      success: true,
      message: 'Translation deleted successfully',
    });
  } catch (error) {
    console.error('Delete translation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete translation' },
      { status: 500 }
    );
  }
}

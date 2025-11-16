import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

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
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('language');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search');

    // Get total count first
    let countQuery = supabase
      .from('translations')
      .select('*', { count: 'exact', head: true });

    if (languageCode) {
      countQuery = countQuery.eq('language_code', languageCode);
    }

    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category);
    }

    if (search) {
      countQuery = countQuery.or(`translation_key.ilike.%${search}%,translation_value.ilike.%${search}%`);
    }

    const { count } = await countQuery;

    // Get paginated data
    let query = supabase
      .from('translations')
      .select('*')
      .order('category')
      .order('translation_key')
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (languageCode) {
      query = query.eq('language_code', languageCode);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`translation_key.ilike.%${search}%,translation_value.ilike.%${search}%`);
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
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
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

    const { language_code, translation_key, translation_value, category } = await request.json();

    if (!language_code || !translation_key || !translation_value) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert translation
    const { data: translation, error } = await supabase
      .from('translations')
      .upsert({
        language_code,
        translation_key,
        translation_value,
        category: category || translation_key.split('.')[0],
      }, {
        onConflict: 'language_code,translation_key',
      })
      .select()
      .single();

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

    const { user, tenant } = auth;
    const supabase = await createClient();

    const { language_code, translations } = await request.json();

    if (!language_code || !translations || !Array.isArray(translations)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Prepare translations for upsert
    const translationsToUpsert = translations.map((t: any) => ({
      language_code,
      translation_key: t.key,
      translation_value: t.value,
      category: t.category || t.key.split('.')[0],
    }));

    const { data, error } = await supabase
      .from('translations')
      .upsert(translationsToUpsert, {
        onConflict: 'language_code,translation_key',
      })
      .select();

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

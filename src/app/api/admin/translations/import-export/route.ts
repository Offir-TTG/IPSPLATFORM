import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Export translations as JSON
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
    const languageCode = searchParams.get('language');
    const format = searchParams.get('format') || 'nested'; // 'nested' or 'flat'

    if (!languageCode) {
      return NextResponse.json(
        { success: false, error: 'Language code is required' },
        { status: 400 }
      );
    }

    // Fetch all translations for the language
    const { data: translations, error } = await supabase
      .from('translations')
      .select('translation_key, translation_value')
      .eq('language_code', languageCode)
      .order('translation_key');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    let exportData: any = {};

    if (format === 'nested') {
      // Convert flat keys to nested object structure
      // e.g., 'nav.home' => { nav: { home: 'value' } }
      translations?.forEach((t) => {
        const keys = t.translation_key.split('.');
        let current = exportData;

        keys.forEach((key: string, index: number) => {
          if (index === keys.length - 1) {
            current[key] = t.translation_value;
          } else {
            current[key] = current[key] || {};
            current = current[key];
          }
        });
      });
    } else {
      // Flat format: { 'nav.home': 'value' }
      translations?.forEach((t) => {
        exportData[t.translation_key] = t.translation_value;
      });
    }

    return NextResponse.json({
      success: true,
      language: languageCode,
      format,
      translations: exportData,
      count: translations?.length || 0,
    });
  } catch (error) {
    console.error('Export translations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export translations' },
      { status: 500 }
    );
  }
}

// POST - Import translations from JSON
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

    const { language_code, translations, format = 'nested', merge = true } = await request.json();

    if (!language_code || !translations) {
      return NextResponse.json(
        { success: false, error: 'Language code and translations are required' },
        { status: 400 }
      );
    }

    // Convert nested structure to flat if needed
    const flattenTranslations = (obj: any, prefix = ''): Record<string, string> => {
      const result: Record<string, string> = {};

      Object.keys(obj).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, flattenTranslations(obj[key], fullKey));
        } else {
          result[fullKey] = String(obj[key]);
        }
      });

      return result;
    };

    const flatTranslations = format === 'nested'
      ? flattenTranslations(translations)
      : translations;

    // If not merging, delete existing translations first
    if (!merge) {
      await supabase
        .from('translations')
        .delete()
        .eq('language_code', language_code);
    }

    // Prepare data for insert
    const translationsToInsert = Object.entries(flatTranslations).map(([key, value]) => ({
      language_code,
      translation_key: key,
      translation_value: value as string,
      category: key.split('.')[0],
    }));

    // Insert/update translations
    const { data: inserted, error: insertError } = await supabase
      .from('translations')
      .upsert(translationsToInsert, {
        onConflict: 'language_code,translation_key',
      })
      .select();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Clear cache
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/translations`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }

    return NextResponse.json({
      success: true,
      data: inserted,
      message: `Successfully imported ${inserted.length} translations`,
    });
  } catch (error) {
    console.error('Import translations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import translations' },
      { status: 500 }
    );
  }
}

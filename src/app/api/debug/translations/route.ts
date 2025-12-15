import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'common.delete';
    const lang = searchParams.get('lang') || 'he';

    const supabase = await createClient();

    // Get translation directly from database (no cache)
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('language_code', lang)
      .eq('translation_key', key);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Also get all common.delete translations
    const { data: allDelete } = await supabase
      .from('translations')
      .select('*')
      .eq('translation_key', 'common.delete');

    return NextResponse.json({
      success: true,
      requested: {
        key,
        lang,
        found: data
      },
      all_delete_translations: allDelete,
      cache_info: 'Direct database query - no cache'
    });
  } catch (error) {
    console.error('Debug translations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to debug translations' },
      { status: 500 }
    );
  }
}
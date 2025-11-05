import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all UI text entries with translations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch UI text keys
    const { data: keys, error: keysError } = await supabase
      .from('translation_keys')
      .select('*')
      .eq('category', 'ui_text')
      .order('key');

    if (keysError) {
      throw keysError;
    }

    // Fetch all translations for UI text
    const { data: translations, error: translationsError } = await supabase
      .from('translations')
      .select('*')
      .eq('category', 'ui_text')
      .eq('context', 'user');

    if (translationsError) {
      throw translationsError;
    }

    // Combine keys with their translations
    const uiTexts = keys.map((key) => ({
      key: key.key,
      category: key.category,
      translations: translations
        .filter((t) => t.translation_key === key.key)
        .map((t) => ({
          language_code: t.language_code,
          value: t.translation_value,
        })),
    }));

    return NextResponse.json({ success: true, data: uiTexts });
  } catch (error) {
    console.error('Error fetching UI text:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch UI text' },
      { status: 500 }
    );
  }
}

// PUT - Update UI text translations
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { texts } = body;

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update each translation
    for (const text of texts) {
      for (const translation of text.translations) {
        const { error } = await supabase
          .from('translations')
          .upsert(
            {
              language_code: translation.language_code,
              translation_key: text.key,
              translation_value: translation.value,
              category: 'ui_text',
              context: 'user',
            },
            {
              onConflict: 'language_code,translation_key',
            }
          );

        if (error) {
          console.error('Error updating translation:', error);
          throw error;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating UI text:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update UI text' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to translate text using a simple approach
// In production, you could use OpenAI API, Google Translate API, etc.
async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  // For now, return the original text with a marker
  // In production, integrate with translation API
  // Example with OpenAI:
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [{
  //     role: "user",
  //     content: `Translate the following text from ${fromLang} to ${toLang}: "${text}"`
  //   }]
  // });
  // return response.choices[0].message.content;

  return `[AUTO-TRANSLATED] ${text}`;
}

// POST - Auto-translate from source language to target language
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

    const { source_language, target_language, keys } = await request.json();

    if (!source_language || !target_language) {
      return NextResponse.json(
        { success: false, error: 'Source and target languages are required' },
        { status: 400 }
      );
    }

    // Get source translations
    let query = supabase
      .from('translations')
      .select('translation_key, translation_value, category')
      .eq('language_code', source_language);

    // If specific keys provided, filter by them
    if (keys && Array.isArray(keys) && keys.length > 0) {
      query = query.in('translation_key', keys);
    }

    const { data: sourceTranslations, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!sourceTranslations || sourceTranslations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No source translations found' },
        { status: 404 }
      );
    }

    // Translate each text
    const translatedData = [];
    for (const translation of sourceTranslations) {
      try {
        const translatedValue = await translateText(
          translation.translation_value,
          source_language,
          target_language
        );

        translatedData.push({
          language_code: target_language,
          translation_key: translation.translation_key,
          translation_value: translatedValue,
          category: translation.category,
        });
      } catch (error) {
        console.error(`Failed to translate ${translation.translation_key}:`, error);
      }
    }

    // Insert translated data
    const { data: inserted, error: insertError } = await supabase
      .from('translations')
      .upsert(translatedData, {
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
      message: `Successfully translated ${inserted.length} entries`,
    });
  } catch (error) {
    console.error('Auto-translate error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-translate' },
      { status: 500 }
    );
  }
}

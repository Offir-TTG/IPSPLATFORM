import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMissingTranslations() {
  try {
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    const translations = [
      // Missing keys
      { key: 'admin.attendance.noLessonsFound', en: 'No lessons found', he: 'לא נמצאו שיעורים' },
      { key: 'admin.attendance.selectLesson', en: 'Select lesson...', he: 'בחר שיעור...' },
      { key: 'common.back', en: 'Back', he: 'חזור' },
    ];

    // Delete existing
    const keys = translations.map(t => t.key);
    await supabase
      .from('translations')
      .delete()
      .in('translation_key', keys);

    console.log('Deleted old translations');

    // Insert new translations
    const translationsToInsert = translations.flatMap(t => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: t.key,
        translation_value: t.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: t.key,
        translation_value: t.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const { error } = await supabase
      .from('translations')
      .insert(translationsToInsert);

    if (error) {
      console.error('Error inserting translations:', error);
      throw error;
    }

    console.log('✅ Successfully added missing translations');
    console.log(`Total: ${translations.length} keys × 2 languages = ${translationsToInsert.length} entries`);

  } catch (error) {
    console.error('Failed to add translations:', error);
    process.exit(1);
  }
}

addMissingTranslations();

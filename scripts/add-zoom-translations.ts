import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  { key: 'user.courses.meetingEnded', en: 'Meeting has ended', he: 'הפגישה הסתיימה' },
  { key: 'user.courses.joiningMeeting', en: 'Joining meeting...', he: 'מצטרף לפגישה...' },
  { key: 'user.courses.failedToJoin', en: 'Failed to Join Meeting', he: 'נכשל בהצטרפות לפגישה' },
];

async function addZoomTranslations() {
  try {
    console.log('🚀 Adding Zoom meeting translations...\n');

    // Get the first tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      throw new Error('No tenant found. Please create a tenant first.');
    }

    const tenantId = tenant.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Delete existing translations to avoid duplicates
    const translationKeys = translations.map(t => t.key);
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .in('translation_key', translationKeys);

    if (deleteError) {
      console.error('Warning: Error deleting old translations:', deleteError.message);
    }

    // Prepare translation entries
    const translationEntries = translations.flatMap(translation => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: translation.key,
        translation_value: translation.en,
        context: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: translation.key,
        translation_value: translation.he,
        context: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Insert translations
    const { error: insertError } = await supabase
      .from('translations')
      .insert(translationEntries);

    if (insertError) {
      throw new Error(`Failed to insert translations: ${insertError.message}`);
    }

    console.log('✅ Added Zoom meeting translations');
    console.log(`Total translations added: ${translations.length} keys × 2 languages = ${translationEntries.length} entries\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addZoomTranslations();

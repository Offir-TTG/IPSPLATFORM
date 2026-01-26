import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslations() {
  console.log('Adding courses page translations...\n');

  // Get first tenant ID
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    return;
  }

  const translations = [
    {
      key: 'user.courses.sections.programCoursesCount',
      en: 'courses in this program',
      he: 'קורסים בתוכנית זו',
      context: 'user',
    },
  ];

  for (const translation of translations) {
    // Add English translation
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_tenant_id: tenantId,
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: 'user',
      p_context: translation.context,
    });

    if (enError) {
      console.error(`Failed to add ${translation.key} (en):`, enError);
    } else {
      console.log(`✓ Added ${translation.key} (en)`);
    }

    // Add Hebrew translation
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_tenant_id: tenantId,
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: 'user',
      p_context: translation.context,
    });

    if (heError) {
      console.error(`Failed to add ${translation.key} (he):`, heError);
    } else {
      console.log(`✓ Added ${translation.key} (he)`);
    }
  }

  console.log('\n✅ Translations added successfully!');
}

addTranslations().catch(console.error);

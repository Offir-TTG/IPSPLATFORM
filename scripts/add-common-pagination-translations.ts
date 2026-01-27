/**
 * Add common pagination translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
}

const translations: Translation[] = [
  { key: 'common.page', en: 'Page', he: 'עמוד' },
  { key: 'common.of', en: 'of', he: 'מתוך' },
  { key: 'common.previous', en: 'Previous', he: 'קודם' },
  { key: 'common.next', en: 'Next', he: 'הבא' },
];

async function addTranslations() {
  console.log('Adding common pagination translations...\n');

  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError?.message);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Use 'admin' category/context for admin page translations
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: 'admin',
      p_context: 'admin',
      p_tenant_id: tenantId
    });

    if (enError) {
      console.error(`  ❌ Error adding English:`, enError.message);
    } else {
      console.log(`  ✅ Added English: "${translation.en}"`);
    }

    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: 'admin',
      p_context: 'admin',
      p_tenant_id: tenantId
    });

    if (heError) {
      console.error(`  ❌ Error adding Hebrew:`, heError.message);
    } else {
      console.log(`  ✅ Added Hebrew: "${translation.he}"`);
    }

    console.log('');
  }

  console.log('✅ Done!\n');
}

addTranslations();

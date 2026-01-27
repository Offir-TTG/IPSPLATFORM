/**
 * Add Missing Report Translation - ofExpected
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslation() {
  console.log('🌐 Adding Missing Translation: ofExpected\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  const translation = {
    key: 'admin.payments.reports.ofExpected',
    en: 'Of expected',
    he: 'מהצפוי',
  };

  // Delete existing if any
  await supabase
    .from('translations')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('translation_key', translation.key);

  // Insert both languages
  for (const lang of ['en', 'he']) {
    const value = translation[lang as 'en' | 'he'];

    const { error } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenantId,
        translation_key: translation.key,
        language_code: lang,
        translation_value: value,
      });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ Added: ${translation.key} (${lang}) = "${value}"`);
    }
  }

  console.log('\n✅ Done! Restart dev server and hard refresh browser.');
}

addTranslation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

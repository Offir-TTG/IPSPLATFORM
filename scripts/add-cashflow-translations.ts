import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  {
    key: 'admin.payments.reports.notYetPaid',
    en: 'Not yet paid',
    he: 'טרם שולם',
    context: 'admin'
  },
  {
    key: 'admin.payments.reports.alreadyCollected',
    en: 'Already collected',
    he: 'כבר נגבה',
    context: 'admin'
  },
];

async function addTranslations() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  console.log('🌐 Adding Cash Flow Translations\n');

  for (const translation of translations) {
    for (const lang of ['en', 'he']) {
      // Check if exists
      const { data: existing } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', lang)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('translations')
          .update({
            translation_value: translation[lang as 'en' | 'he'],
            context: translation.context
          })
          .eq('id', existing.id);

        if (error) {
          console.log(`❌ ${translation.key} (${lang}): ${error.message}`);
        } else {
          console.log(`✅ ${translation.key} (${lang}): "${translation[lang as 'en' | 'he']}" (updated)`);
        }
      } else {
        // Insert
        const { error } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            language_code: lang,
            translation_value: translation[lang as 'en' | 'he'],
            context: translation.context
          });

        if (error) {
          console.log(`❌ ${translation.key} (${lang}): ${error.message}`);
        } else {
          console.log(`✅ ${translation.key} (${lang}): "${translation[lang as 'en' | 'he']}" (created)`);
        }
      }
    }
  }

  console.log('\n✅ Done!');
}

addTranslations().then(() => process.exit(0));

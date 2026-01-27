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
    key: 'admin.payments.reports.charts.grossRevenue',
    en: 'Gross Revenue',
    he: 'הכנסה ברוטו',
    context: 'admin'
  },
  {
    key: 'admin.payments.reports.charts.netRevenue',
    en: 'Net Revenue',
    he: 'הכנסה נטו',
    context: 'admin'
  },
];

async function addTranslations() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  console.log('🌐 Adding Chart Translations\n');

  for (const translation of translations) {
    for (const lang of ['en', 'he']) {
      const { error } = await supabase
        .from('translations')
        .upsert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: lang,
          translation_value: translation[lang as 'en' | 'he'],
          context: translation.context
        }, {
          onConflict: 'tenant_id,translation_key,language_code'
        });

      if (error) {
        console.log(`❌ ${translation.key} (${lang}): ${error.message}`);
      } else {
        console.log(`✅ ${translation.key} (${lang}): "${translation[lang as 'en' | 'he']}"`);
      }
    }
  }

  console.log('\n✅ Done!');
}

addTranslations().then(() => process.exit(0));

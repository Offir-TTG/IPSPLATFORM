import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function update() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  const updates = [
    {
      key: 'admin.payments.reports.revenueByTypeDescription',
      en: 'Net revenue breakdown by payment type (after refunds)',
      he: 'פירוט הכנסה נטו לפי סוג תשלום (לאחר החזרים)'
    },
    {
      key: 'admin.payments.reports.revenueDistributionDescription',
      en: 'Detailed net revenue breakdown (after refunds)',
      he: 'פירוט מפורט הכנסה נטו (לאחר החזרים)'
    }
  ];

  for (const item of updates) {
    for (const lang of ['en', 'he']) {
      const { error } = await supabase
        .from('translations')
        .update({ translation_value: item[lang as 'en' | 'he'] })
        .eq('tenant_id', tenantId)
        .eq('translation_key', item.key)
        .eq('language_code', lang);

      if (error) {
        console.log(`❌ ${item.key} (${lang}): ${error.message}`);
      } else {
        console.log(`✅ Updated ${item.key} (${lang})`);
      }
    }
  }
}

update().then(() => process.exit(0));

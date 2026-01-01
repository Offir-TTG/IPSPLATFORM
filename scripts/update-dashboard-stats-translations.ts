import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updates = [
  { key: 'user.dashboard.stats.studyHours', en: 'Study Time', he: 'זמן לימוד' },
];

async function updateDashboardStatsTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('No tenant found');
      return;
    }

    const tenant = tenants[0];
    console.log(`\nUpdating dashboard stats translations for tenant: ${tenant.name} (${tenant.id})\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const t of updates) {
      // Update Hebrew
      const heResult = await supabase
        .from('translations')
        .update({ translation_value: t.he })
        .eq('tenant_id', tenant.id)
        .eq('translation_key', t.key)
        .eq('language_code', 'he');

      if (heResult.error) {
        console.error(`❌ Error updating HE ${t.key}:`, heResult.error.message);
        errorCount++;
      } else {
        console.log(`✓ Updated HE: ${t.key} = ${t.he}`);
        successCount++;
      }

      // Update English
      const enResult = await supabase
        .from('translations')
        .update({ translation_value: t.en })
        .eq('tenant_id', tenant.id)
        .eq('translation_key', t.key)
        .eq('language_code', 'en');

      if (enResult.error) {
        console.error(`❌ Error updating EN ${t.key}:`, enResult.error.message);
        errorCount++;
      } else {
        console.log(`✓ Updated EN: ${t.key} = ${t.en}`);
        successCount++;
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateDashboardStatsTranslations();

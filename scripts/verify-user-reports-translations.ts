import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyTranslations() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  console.log('Verifying user reports translations...\n');

  // Fetch all user.reports.* translations
  const { data: heTranslations } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .like('translation_key', 'user.reports%')
    .order('translation_key');

  console.log(`Found ${heTranslations?.length || 0} Hebrew translations for user.reports.*\n`);

  if (heTranslations && heTranslations.length > 0) {
    console.log('✅ Sample translations:');
    console.log('='.repeat(80));

    // Group by category
    const categories = {
      'Page Header': heTranslations.filter(t => !t.translation_key.includes('.')),
      'Statistics': heTranslations.filter(t => t.translation_key.includes('.stats.')),
      'Charts': heTranslations.filter(t => t.translation_key.includes('.charts.')),
      'Days': heTranslations.filter(t => t.translation_key.includes('.days.')),
      'Courses': heTranslations.filter(t => t.translation_key.includes('.courses.')),
      'Activity': heTranslations.filter(t => t.translation_key.includes('.activity.')),
    };

    for (const [category, translations] of Object.entries(categories)) {
      if (translations.length > 0) {
        console.log(`\n📁 ${category}:`);
        translations.forEach(t => {
          console.log(`  ${t.translation_key.padEnd(50)} → ${t.translation_value}`);
        });
      }
    }
  } else {
    console.log('❌ No translations found!');
  }
}

verifyTranslations();

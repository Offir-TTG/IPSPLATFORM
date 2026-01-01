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

  console.log('Verifying command palette translations...\n');

  // Fetch all user.commandPalette.* translations
  const { data: heTranslations } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .like('translation_key', 'user.commandPalette%')
    .order('translation_key');

  console.log(`Found ${heTranslations?.length || 0} Hebrew translations for user.commandPalette.*\n`);

  if (heTranslations && heTranslations.length > 0) {
    console.log('✅ Command Palette Translations:');
    console.log('='.repeat(80));

    heTranslations.forEach(t => {
      console.log(`  ${t.translation_key.padEnd(50)} → ${t.translation_value}`);
    });
  } else {
    console.log('❌ No translations found!');
  }
}

verifyTranslations();

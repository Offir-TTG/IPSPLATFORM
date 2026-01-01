import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateBillingTranslation() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('No tenant found');
      return;
    }

    const tenant = tenants[0];
    console.log(`\nUpdating billing menu translation for tenant: ${tenant.name} (${tenant.id})\n`);

    const translationKey = 'user.layout.manageSubscriptions';
    const newEnglish = 'Manage billing';
    const newHebrew = 'ניהול חיוב';

    // Check if translation exists
    const { data: existing } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('translation_key', translationKey);

    console.log(`Found ${existing?.length || 0} existing translations for this key\n`);

    if (existing && existing.length > 0) {
      // Update existing translations
      for (const trans of existing) {
        const newValue = trans.language_code === 'en' ? newEnglish : newHebrew;

        const { error } = await supabase
          .from('translations')
          .update({ translation_value: newValue })
          .eq('id', trans.id);

        if (error) {
          console.error(`❌ Error updating ${trans.language_code}:`, error.message);
        } else {
          console.log(`✓ Updated ${trans.language_code}: ${trans.translation_value} → ${newValue}`);
        }
      }
    } else {
      // Insert new translations
      console.log('Translation does not exist, creating new ones...\n');

      // Insert Hebrew
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenant.id,
          translation_key: translationKey,
          translation_value: newHebrew,
          language_code: 'he',
          context: 'user'
        });

      if (heError) {
        console.error(`❌ Error inserting HE:`, heError.message);
      } else {
        console.log(`✓ Created HE: ${newHebrew}`);
      }

      // Insert English
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenant.id,
          translation_key: translationKey,
          translation_value: newEnglish,
          language_code: 'en',
          context: 'user'
        });

      if (enError) {
        console.error(`❌ Error inserting EN:`, enError.message);
      } else {
        console.log(`✓ Created EN: ${newEnglish}`);
      }
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateBillingTranslation();

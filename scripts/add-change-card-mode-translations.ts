import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Translation {
  key: string;
  en: string;
  he: string;
  context: string;
  category: string;
}

const translations: Translation[] = [
  // Change Card Mode
  {
    key: 'admin.payments.schedules.changeDefaultCard',
    en: 'Change Default Payment Method',
    he: 'שנה אמצעי תשלום ברירת מחדל',
    context: 'admin',
    category: 'payments',
  },
  {
    key: 'admin.payments.schedules.selectDefaultCardFor',
    en: 'Choose the default payment method for {name}',
    he: 'בחר את אמצעי התשלום המוגדר כברירת מחדל עבור {name}',
    context: 'admin',
    category: 'payments',
  },
  {
    key: 'admin.payments.schedules.selectDefaultCardDescription',
    en: 'Choose which card to set as default',
    he: 'בחר איזה כרטיס להגדיר כברירת מחדל',
    context: 'admin',
    category: 'payments',
  },
  {
    key: 'admin.payments.schedules.setAsDefault',
    en: 'Set as Default',
    he: 'הגדר כברירת מחדל',
    context: 'admin',
    category: 'payments',
  },
  {
    key: 'admin.payments.schedules.updating',
    en: 'Updating...',
    he: 'מעדכן...',
    context: 'admin',
    category: 'payments',
  },
  {
    key: 'admin.payments.schedules.cardUpdatedSuccess',
    en: 'Default payment method updated successfully',
    he: 'אמצעי התשלום המוגדר כברירת מחדל עודכן בהצלחה',
    context: 'admin',
    category: 'payments',
  },
  {
    key: 'admin.payments.schedules.cardUpdateError',
    en: 'Failed to update payment method',
    he: 'נכשל בעדכון אמצעי התשלום',
    context: 'admin',
    category: 'payments',
  },
];

async function addTranslations() {
  console.log('🌐 Adding Change Card Mode Hebrew Translations\n');
  console.log('='.repeat(60));

  try {
    // Get the default tenant ID
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

    let successCount = 0;
    let errorCount = 0;

    for (const translation of translations) {
      console.log(`Processing: ${translation.key}`);

      // Add English translation
      const { error: enError } = await supabase.rpc('upsert_translation', {
        p_language_code: 'en',
        p_translation_key: translation.key,
        p_translation_value: translation.en,
        p_category: translation.category,
        p_context: translation.context,
        p_tenant_id: tenantId
      });

      if (enError) {
        console.error(`  ❌ Error adding English:`, enError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Added English: "${translation.en}"`);
      }

      // Add Hebrew translation
      const { error: heError } = await supabase.rpc('upsert_translation', {
        p_language_code: 'he',
        p_translation_key: translation.key,
        p_translation_value: translation.he,
        p_category: translation.category,
        p_context: translation.context,
        p_tenant_id: tenantId
      });

      if (heError) {
        console.error(`  ❌ Error adding Hebrew:`, heError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Added Hebrew: "${translation.he}"`);
        successCount++;
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`✅ Translation process completed!`);
    console.log(`   Total translations: ${translations.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('');

    if (errorCount === 0) {
      console.log('🎉 All change card mode translations added successfully!');
    } else {
      console.warn(`⚠️  ${errorCount} translations had errors. Please review above.`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTranslations().then(() => process.exit(0));

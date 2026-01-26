import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  {
    key: 'admin.payments.plans.loadError',
    en: 'Failed to load payment plans',
    he: 'טעינת תבניות התשלום נכשלה'
  },
  {
    key: 'admin.payments.plans.deleteSuccess',
    en: 'Payment plan deleted successfully',
    he: 'תבנית התשלום נמחקה בהצלחה'
  },
  {
    key: 'admin.payments.plans.deleteError',
    en: 'Failed to delete payment plan',
    he: 'מחיקת תבנית התשלום נכשלה'
  },
  {
    key: 'admin.payments.plans.updateSuccess',
    en: 'Payment plan updated successfully',
    he: 'תבנית התשלום עודכנה בהצלחה'
  },
  {
    key: 'admin.payments.plans.createSuccess',
    en: 'Payment plan created successfully',
    he: 'תבנית התשלום נוצרה בהצלחה'
  },
  {
    key: 'admin.payments.plans.saveError',
    en: 'Failed to save payment plan',
    he: 'שמירת תבנית התשלום נכשלה'
  }
];

async function getTenantId(): Promise<string> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (error) throw error;
  return data.id;
}

async function addTranslations() {
  console.log('Adding payment plans toast translations...\n');

  const tenantId = await getTenantId();
  console.log(`Using tenant ID: ${tenantId}\n`);

  for (const translation of translations) {
    console.log(`Processing key: ${translation.key}`);

    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (!existingEn) {
      // Insert English translation
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
          category: 'admin',
          context: 'admin'
        });

      if (enError) {
        console.error(`  ✗ Error adding English translation: ${enError.message}`);
      } else {
        console.log(`  ✓ Added English translation`);
      }
    } else {
      console.log(`  ○ English translation already exists`);
    }

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (!existingHe) {
      // Insert Hebrew translation
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
          category: 'admin',
          context: 'admin'
        });

      if (heError) {
        console.error(`  ✗ Error adding Hebrew translation: ${heError.message}`);
      } else {
        console.log(`  ✓ Added Hebrew translation`);
      }
    } else {
      console.log(`  ○ Hebrew translation already exists`);
    }

    console.log('');
  }

  console.log('✅ All payment plans toast translations processed!');
}

addTranslations().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    console.log('Adding user-side payment type translations...\n');

    const translations = [
      // User-side payment types
      { key: 'user.payments.paymentType.deposit', en: 'Deposit', he: 'מקדמה' },
      { key: 'user.payments.paymentType.installment', en: 'Installment', he: 'תשלום' },
      { key: 'user.payments.paymentType.subscription', en: 'Subscription', he: 'מנוי' },
      { key: 'user.payments.paymentType.full', en: 'Full Payment', he: 'תשלום מלא' },
      { key: 'user.payments.paymentType.oneTime', en: 'One-Time Payment', he: 'תשלום חד פעמי' },
      { key: 'user.payments.paymentType.unknown', en: 'Unknown', he: 'לא ידוע' },
    ];

    for (const translation of translations) {
      // English
      const { error: enError } = await supabase.rpc('upsert_translation', {
        p_language_code: 'en',
        p_translation_key: translation.key,
        p_translation_value: translation.en,
        p_category: 'user',
        p_context: 'user',
        p_tenant_id: tenantId,
      });

      if (enError) {
        console.error(`Error adding EN for ${translation.key}:`, enError);
      } else {
        console.log(`✓ Added EN: ${translation.key} = "${translation.en}"`);
      }

      // Hebrew
      const { error: heError } = await supabase.rpc('upsert_translation', {
        p_language_code: 'he',
        p_translation_key: translation.key,
        p_translation_value: translation.he,
        p_category: 'user',
        p_context: 'user',
        p_tenant_id: tenantId,
      });

      if (heError) {
        console.error(`Error adding HE for ${translation.key}:`, heError);
      } else {
        console.log(`✓ Added HE: ${translation.key} = "${translation.he}"`);
      }

      console.log('');
    }

    console.log('✅ User payment type translations added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();

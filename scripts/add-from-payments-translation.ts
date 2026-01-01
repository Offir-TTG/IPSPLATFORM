import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTranslation() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    console.log('Adding "fromPayments" translation...\n');

    // English
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: 'admin.payments.fromPayments',
      p_translation_value: 'From {count} payments',
      p_category: 'admin',
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (enError) {
      console.error('Error adding EN:', enError);
    } else {
      console.log('✓ Added EN: admin.payments.fromPayments = "From {count} payments"');
    }

    // Hebrew
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: 'admin.payments.fromPayments',
      p_translation_value: 'מתוך {count} תשלומים',
      p_category: 'admin',
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (heError) {
      console.error('Error adding HE:', heError);
    } else {
      console.log('✓ Added HE: admin.payments.fromPayments = "מתוך {count} תשלומים"');
    }

    console.log('\n✅ Translation added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslation();

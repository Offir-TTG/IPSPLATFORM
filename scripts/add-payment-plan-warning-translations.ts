import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  {
    key: 'products.payment_plans.change_warning_title',
    en: 'Note: Payment Plan Changes',
    he: 'הערה: שינויי תוכניות תשלום'
  },
  {
    key: 'products.payment_plans.change_warning_desc',
    en: 'Changes to payment plans only affect NEW enrollments. Existing enrollments (including pending invitations) will keep their original payment terms.',
    he: 'שינויים בתוכניות התשלום ישפיעו רק על הרשמות חדשות. הרשמות קיימות (כולל הזמנות ממתינות) ישמרו את תנאי התשלום המקוריים שלהן.'
  },
  {
    key: 'products.payment_plans.active_enrollments_using_plans',
    en: 'Active enrollments using current plans: {count}',
    he: 'הרשמות פעילות המשתמשות בתוכניות נוכחיות: {count}'
  },
  {
    key: 'products.payment_plans.pending_invitations',
    en: 'Pending invitations: {count}',
    he: 'הזמנות ממתינות: {count}'
  }
];

async function addTranslations() {
  try {
    // Get tenant ID
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    console.log('Adding payment plan warning translations...\n');

    for (const { key, en, he } of translations) {
      console.log(`Adding translation for: ${key}`);

      const category = 'products';
      const context = 'admin';

      // Add English
      const { error: enError } = await supabase.rpc('upsert_translation', {
        p_language_code: 'en',
        p_translation_key: key,
        p_translation_value: en,
        p_category: category,
        p_context: context,
        p_tenant_id: tenantId,
      });

      if (enError) {
        console.error(`Error adding English translation for ${key}:`, enError);
        continue;
      }

      // Add Hebrew
      const { error: heError } = await supabase.rpc('upsert_translation', {
        p_language_code: 'he',
        p_translation_key: key,
        p_translation_value: he,
        p_category: category,
        p_context: context,
        p_tenant_id: tenantId,
      });

      if (heError) {
        console.error(`Error adding Hebrew translation for ${key}:`, heError);
        continue;
      }

      console.log(`✅ Added translations for ${key}`);
    }

    console.log('\n✅ All payment plan warning translations added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();

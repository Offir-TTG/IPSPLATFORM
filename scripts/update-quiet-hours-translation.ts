/**
 * Update quiet hours description translation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateTranslation() {
  console.log('\n🌍 Updating quiet hours translation...\n');

  try {
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name');

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`📋 Found ${tenants?.length || 0} tenants\n`);

    for (const tenant of tenants || []) {
      console.log(`🏢 Processing tenant: ${tenant.name}`);

      // Update English translation
      await supabase
        .from('translations')
        .update({
          translation_value: 'No external notifications (email, SMS) during these hours',
        })
        .eq('tenant_id', tenant.id)
        .eq('translation_key', 'user.notifications.preferences.quietHoursDesc')
        .eq('language_code', 'en');

      // Update Hebrew translation
      await supabase
        .from('translations')
        .update({
          translation_value: 'ללא התראות חיצוניות (מייל, SMS) בשעות אלו',
        })
        .eq('tenant_id', tenant.id)
        .eq('translation_key', 'user.notifications.preferences.quietHoursDesc')
        .eq('language_code', 'he');

      console.log('');
    }

    console.log('✅ Quiet hours translation updated!\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateTranslation();

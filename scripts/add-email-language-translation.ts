/**
 * Add translation for email language selector
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

const translation = {
  key: 'admin.notifications.emailLanguage',
  en: 'Email Language',
  he: 'שפת האימייל',
};

async function addTranslation() {
  console.log('\n🌍 Adding email language translation...\n');

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

      // Check if English translation already exists
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .single();

      if (!existingEn) {
        // Add English translation
        await supabase
          .from('translations')
          .insert({
            tenant_id: tenant.id,
            translation_key: translation.key,
            translation_value: translation.en,
            language_code: 'en',
            context: 'admin',
          });
        console.log(`   ✅ Added EN translation`);
      } else {
        console.log(`   ⏭️  EN translation already exists`);
      }

      // Check if Hebrew translation already exists
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .single();

      if (!existingHe) {
        // Add Hebrew translation
        await supabase
          .from('translations')
          .insert({
            tenant_id: tenant.id,
            translation_key: translation.key,
            translation_value: translation.he,
            language_code: 'he',
            context: 'admin',
          });
        console.log(`   ✅ Added HE translation\n`);
      } else {
        console.log(`   ⏭️  HE translation already exists\n`);
      }
    }

    console.log('✅ Email language translation complete!\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTranslation();

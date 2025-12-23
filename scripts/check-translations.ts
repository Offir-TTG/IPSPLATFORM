/**
 * Check Translations
 * Verifies password reset related translations exist
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTranslations() {
  console.log('🔍 Checking password reset translations...\n');

  const keysToCheck = [
    'emails.category.system',
    'email_template.system_password_reset.name',
    'email_template.system_password_reset.description',
  ];

  // Get all tenants
  const { data: tenants } = await supabase.from('tenants').select('id, name');

  if (!tenants || tenants.length === 0) {
    console.log('⚠️  No tenants found');
    return;
  }

  for (const tenant of tenants) {
    console.log(`\n📧 Tenant: ${tenant.name}`);
    console.log('='.repeat(60));

    for (const key of keysToCheck) {
      console.log(`\n🔑 ${key}:`);

      // Check EN
      const { data: enData } = await supabase
        .from('translations')
        .select('translation_value')
        .eq('tenant_id', tenant.id)
        .eq('language_code', 'en')
        .eq('translation_key', key)
        .single();

      if (enData) {
        console.log(`   ✅ EN: "${enData.translation_value}"`);
      } else {
        console.log(`   ❌ EN: NOT FOUND`);
      }

      // Check HE
      const { data: heData } = await supabase
        .from('translations')
        .select('translation_value')
        .eq('tenant_id', tenant.id)
        .eq('language_code', 'he')
        .eq('translation_key', key)
        .single();

      if (heData) {
        console.log(`   ✅ HE: "${heData.translation_value}"`);
      } else {
        console.log(`   ❌ HE: NOT FOUND`);
      }
    }
  }
}

checkTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

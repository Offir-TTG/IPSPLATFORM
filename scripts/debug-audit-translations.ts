/**
 * Debug Audit Translations
 * Tests what the API is returning for audit translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTranslations() {
  console.log('🔍 Debugging Audit Translations...\n');

  // Check tenant
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1);

  const tenantId = tenants?.[0]?.id;
  console.log('Tenant ID:', tenantId);
  console.log('Tenant Name:', tenants?.[0]?.name);
  console.log('');

  // Check audit.* translations in Hebrew
  console.log('1️⃣  Checking audit.* translations (Hebrew)...');
  const { data: heTranslations, error: heError } = await supabase
    .from('translations')
    .select('translation_key, translation_value, context')
    .eq('language_code', 'he')
    .eq('tenant_id', tenantId)
    .like('translation_key', 'audit.%')
    .order('translation_key');

  if (heError) {
    console.error('❌ Error:', heError.message);
  } else {
    console.log(`Found ${heTranslations?.length || 0} Hebrew audit translations:`);
    heTranslations?.slice(0, 10).forEach(t => {
      console.log(`   ${t.translation_key}: ${t.translation_value}`);
    });
  }
  console.log('');

  // Check specific keys we need
  console.log('2️⃣  Checking specific translation keys...');
  const keysToCheck = [
    'audit.action.updated',
    'audit.resource.profile',
    'audit.field.instagram_url',
    'admin.audit.table.action',
    'admin.audit.table.time',
  ];

  for (const key of keysToCheck) {
    const { data, error } = await supabase
      .from('translations')
      .select('translation_value, language_code')
      .eq('translation_key', key)
      .eq('tenant_id', tenantId);

    if (error) {
      console.log(`   ❌ ${key}: ERROR - ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`   ❌ ${key}: NOT FOUND`);
    } else {
      const heValue = data.find(t => t.language_code === 'he')?.translation_value;
      const enValue = data.find(t => t.language_code === 'en')?.translation_value;
      console.log(`   ✅ ${key}:`);
      console.log(`      he: ${heValue || 'MISSING'}`);
      console.log(`      en: ${enValue || 'MISSING'}`);
    }
  }
  console.log('');

  // Test what the API would return
  console.log('3️⃣  Testing API response format...');
  const { data: apiTest, error: apiError } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('language_code', 'he')
    .eq('tenant_id', tenantId)
    .eq('context', 'admin')
    .like('translation_key', 'audit.action.%')
    .limit(5);

  if (apiError) {
    console.error('❌ API test error:', apiError.message);
  } else {
    console.log('API would return:');
    apiTest?.forEach(t => {
      console.log(`   "${t.translation_key}": "${t.translation_value}"`);
    });
  }
  console.log('');

  // Check admin.audit.* translations
  console.log('4️⃣  Checking admin.audit.* translations (Hebrew)...');
  const { data: adminTranslations } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('language_code', 'he')
    .eq('tenant_id', tenantId)
    .like('translation_key', 'admin.audit.%')
    .limit(10);

  console.log(`Found ${adminTranslations?.length || 0} admin.audit translations:`);
  adminTranslations?.forEach(t => {
    console.log(`   ${t.translation_key}: ${t.translation_value}`);
  });
}

debugTranslations()
  .then(() => {
    console.log('\n✓ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Debug failed:', error);
    process.exit(1);
  });

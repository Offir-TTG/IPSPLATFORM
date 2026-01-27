/**
 * Verify invoice refund translations exist
 * Run: npx ts-node scripts/verify-invoice-translations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyTranslations() {
  try {
    console.log('🔍 Checking invoice refund translations...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');

    const tenantId = tenants.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    const keysToCheck = [
      'invoices.status.refunded',
      'invoices.status.partially_refunded',
      'invoices.refunded_amount',
    ];

    console.log('=== CHECKING TRANSLATIONS ===\n');

    for (const key of keysToCheck) {
      console.log(`Key: ${key}`);

      // Check English
      const { data: enTranslation } = await supabase
        .from('translations')
        .select('translation_value, context')
        .eq('translation_key', key)
        .eq('language_code', 'en')
        .eq('tenant_id', tenantId)
        .single();

      // Check Hebrew
      const { data: heTranslation } = await supabase
        .from('translations')
        .select('translation_value, context')
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .eq('tenant_id', tenantId)
        .single();

      if (enTranslation) {
        console.log(`  ✓ EN: "${enTranslation.translation_value}" (context: ${enTranslation.context})`);
      } else {
        console.log(`  ❌ EN: NOT FOUND`);
      }

      if (heTranslation) {
        console.log(`  ✓ HE: "${heTranslation.translation_value}" (context: ${heTranslation.context})`);
      } else {
        console.log(`  ❌ HE: NOT FOUND`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyTranslations();

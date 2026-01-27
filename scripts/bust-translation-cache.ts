/**
 * Bust translation cache by updating all translation timestamps
 * Run: npx ts-node scripts/bust-translation-cache.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function bustCache() {
  try {
    console.log('🔄 Busting translation cache...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');

    const tenantId = tenants.id;

    // Update all invoice refund translations to trigger cache refresh
    const keysToUpdate = [
      'invoices.status.refunded',
      'invoices.status.partially_refunded',
      'invoices.refunded_amount',
    ];

    console.log('Updating translation timestamps...\n');

    for (const key of keysToUpdate) {
      const { error } = await supabase
        .from('translations')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('translation_key', key)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error(`❌ Error updating ${key}:`, error);
      } else {
        console.log(`✓ Updated: ${key}`);
      }
    }

    console.log('\n✅ Translation cache busted!');
    console.log('Users will get fresh translations on next page load.');

  } catch (error) {
    console.error('Error:', error);
  }
}

bustCache();

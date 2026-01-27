/**
 * Script to add PDF refund-related translations
 * Run: npx tsx scripts/add-pdf-refund-translations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Invoice translations
  {
    key: 'pdf.invoice.totalRefunded',
    en: 'Total Refunded',
    he: 'סה"כ הוחזר',
  },
  {
    key: 'pdf.invoice.netAmount',
    en: 'Net Amount',
    he: 'סכום נטו',
  },
  // Schedule translations
  {
    key: 'pdf.schedule.refunded',
    en: 'Refunded',
    he: 'הוחזר',
  },
  {
    key: 'pdf.schedule.partiallyRefunded',
    en: 'Partially Refunded',
    he: 'הוחזר חלקית',
  },
  {
    key: 'pdf.schedule.statusLabel.partially_refunded',
    en: 'Partially Refunded',
    he: 'הוחזר חלקית',
  },
];

async function addTranslations() {
  console.log('Starting PDF refund translation addition...\n');

  // Get all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name');

  if (tenantsError) {
    console.error('Error fetching tenants:', tenantsError);
    process.exit(1);
  }

  console.log(`Found ${tenants?.length || 0} tenants\n`);

  // Get all active languages (languages table is global, not per-tenant)
  const { data: languages, error: languagesError } = await supabase
    .from('languages')
    .select('code, is_active')
    .eq('is_active', true);

  if (languagesError) {
    console.error('Error fetching languages:', languagesError);
    process.exit(1);
  }

  const activeLangCodes = languages?.map(l => l.code) || [];
  console.log(`Active languages: ${activeLangCodes.join(', ')}\n`);

  for (const tenant of tenants || []) {
    console.log(`Processing tenant: ${tenant.name} (${tenant.id})`);

    for (const translation of translations) {
      for (const langCode of activeLangCodes) {
        const value = langCode === 'he' ? translation.he : translation.en;

        // Check if translation already exists
        const { data: existing } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', langCode)
          .single();

        if (existing) {
          console.log(`  ✓ Translation already exists: ${translation.key} [${langCode}]`);
          continue;
        }

        // Insert translation
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenant.id,
            translation_key: translation.key,
            language_code: langCode,
            translation_value: value,
          });

        if (insertError) {
          console.error(`  ✗ Error adding translation ${translation.key} [${langCode}]:`, insertError.message);
        } else {
          console.log(`  ✓ Added translation: ${translation.key} [${langCode}] = "${value}"`);
        }
      }
    }

    console.log('');
  }

  console.log('PDF refund translation addition complete!');
}

addTranslations().catch(console.error);

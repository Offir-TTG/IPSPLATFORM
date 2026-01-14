import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TENANT_ID = '70d86807-7e7c-49cd-8601-98235444e2ac';

const translations = [
  {
    key: 'enrollment.header.title.selfEnrolled',
    category: 'enrollment',
    en: 'Complete Your Enrollment',
    he: 'השלם את ההרשמה שלך'
  },
  {
    key: 'enrollment.header.subtitle.selfEnrolled',
    category: 'enrollment',
    en: 'You\'re enrolling in the following:',
    he: 'אתה נרשם לתוכנית הבאה:'
  }
];

async function addTranslations() {
  console.log('Starting to add self-enrollment translations...\n');
  console.log(`Using tenant ID: ${TENANT_ID}\n`);

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const trans of translations) {
    console.log(`Processing: ${trans.key}`);

    // Check English
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', TENANT_ID)
      .eq('translation_key', trans.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existingEn) {
      if (existingEn.translation_value !== trans.en) {
        await supabase
          .from('translations')
          .update({ translation_value: trans.en, updated_at: new Date().toISOString() })
          .eq('id', existingEn.id);
        console.log(`  ✓ Updated EN: "${trans.en}"`);
        updated++;
      } else {
        console.log(`  - Skipped EN (same value)`);
        skipped++;
      }
    } else {
      const { error } = await supabase
        .from('translations')
        .insert({
          tenant_id: TENANT_ID,
          language_code: 'en',
          translation_key: trans.key,
          translation_value: trans.en,
          category: trans.category,
          context: 'user',
        });

      if (error) {
        console.error(`  ✗ Failed to add EN:`, error.message);
      } else {
        console.log(`  ✓ Added EN: "${trans.en}"`);
        added++;
      }
    }

    // Check Hebrew
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', TENANT_ID)
      .eq('translation_key', trans.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (existingHe) {
      if (existingHe.translation_value !== trans.he) {
        await supabase
          .from('translations')
          .update({ translation_value: trans.he, updated_at: new Date().toISOString() })
          .eq('id', existingHe.id);
        console.log(`  ✓ Updated HE: "${trans.he}"`);
        updated++;
      } else {
        console.log(`  - Skipped HE (same value)`);
        skipped++;
      }
    } else {
      const { error } = await supabase
        .from('translations')
        .insert({
          tenant_id: TENANT_ID,
          language_code: 'he',
          translation_key: trans.key,
          translation_value: trans.he,
          category: trans.category,
          context: 'user',
        });

      if (error) {
        console.error(`  ✗ Failed to add HE:`, error.message);
      } else {
        console.log(`  ✓ Added HE: "${trans.he}"`);
        added++;
      }
    }

    console.log('');
  }

  console.log('\nSummary:');
  console.log(`  Added: ${added}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('\n✅ Done!');
}

addTranslations().catch(console.error);

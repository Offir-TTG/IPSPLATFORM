import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TranslationItem {
  key: string;
  en: string;
  he: string;
}

const translations: TranslationItem[] = [
  { key: 'navigation.nameUpdated', en: 'Name updated successfully', he: 'השם עודכן בהצלחה' },
  { key: 'navigation.updateError', en: 'Failed to update name', he: 'נכשל בעדכון השם' },
];

async function getTenantId(): Promise<string> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (error) throw error;
  return data.id;
}

async function addTranslations() {
  try {
    console.log('Adding navigation edit translations...\n');

    const tenantId = await getTenantId();
    console.log(`Using tenant ID: ${tenantId}\n`);

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const translation of translations) {
      console.log(`Processing: ${translation.key}`);

      // Check English
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .maybeSingle();

      if (existingEn) {
        if (existingEn.translation_value !== translation.en) {
          await supabase
            .from('translations')
            .update({ translation_value: translation.en, updated_at: new Date().toISOString() })
            .eq('id', existingEn.id);
          console.log(`  ✓ Updated EN: "${translation.en}"`);
          updatedCount++;
        } else {
          console.log(`  - Skipped EN (same value)`);
          skippedCount++;
        }
      } else {
        const { error } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            language_code: 'en',
            translation_key: translation.key,
            translation_value: translation.en,
            category: translation.key.split('.')[0],
            context: 'admin',
          });

        if (error) {
          console.error(`  ✗ Failed to add EN:`, error.message);
        } else {
          console.log(`  ✓ Added EN: "${translation.en}"`);
          addedCount++;
        }
      }

      // Check Hebrew
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .maybeSingle();

      if (existingHe) {
        if (existingHe.translation_value !== translation.he) {
          await supabase
            .from('translations')
            .update({ translation_value: translation.he, updated_at: new Date().toISOString() })
            .eq('id', existingHe.id);
          console.log(`  ✓ Updated HE: "${translation.he}"`);
          updatedCount++;
        } else {
          console.log(`  - Skipped HE (same value)`);
          skippedCount++;
        }
      } else {
        const { error } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            language_code: 'he',
            translation_key: translation.key,
            translation_value: translation.he,
            category: translation.key.split('.')[0],
            context: 'admin',
          });

        if (error) {
          console.error(`  ✗ Failed to add HE:`, error.message);
        } else {
          console.log(`  ✓ Added HE: "${translation.he}"`);
          addedCount++;
        }
      }

      console.log('');
    }

    console.log('Summary:');
    console.log(`  Added: ${addedCount}`);
    console.log(`  Updated: ${updatedCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTranslations();

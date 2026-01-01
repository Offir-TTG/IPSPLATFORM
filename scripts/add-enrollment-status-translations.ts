import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Enrollment status translations
  { key: 'enrollments.status.active', en: 'Active', he: 'פעיל' },
  { key: 'enrollments.status.pending', en: 'Pending', he: 'ממתין' },
  { key: 'enrollments.status.draft', en: 'Draft', he: 'טיוטה' },
  { key: 'enrollments.status.completed', en: 'Completed', he: 'הושלם' },
  { key: 'enrollments.status.cancelled', en: 'Cancelled', he: 'בוטל' },
  { key: 'enrollments.status.suspended', en: 'Suspended', he: 'מושהה' },
];

async function addTranslations() {
  try {
    console.log('Adding enrollment status translations...\n');

    // Get tenant_id
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.error('No tenants found');
      return;
    }

    const tenantId = tenants[0].id;
    console.log(`Using tenant ID: ${tenantId}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const translation of translations) {
      try {
        // Determine category from key (first part)
        const parts = translation.key.split('.');
        const category = parts[0]; // 'enrollments'
        const context = 'admin';

        const { error: enError } = await supabase.rpc('upsert_translation', {
          p_language_code: 'en',
          p_translation_key: translation.key,
          p_translation_value: translation.en,
          p_category: category,
          p_context: context,
          p_tenant_id: tenantId,
        });

        if (enError) {
          console.error(`Error adding EN for ${translation.key}:`, enError.message);
          errorCount++;
          continue;
        }

        // Add Hebrew translation
        const { error: heError } = await supabase.rpc('upsert_translation', {
          p_language_code: 'he',
          p_translation_key: translation.key,
          p_translation_value: translation.he,
          p_category: category,
          p_context: context,
          p_tenant_id: tenantId,
        });

        if (heError) {
          console.error(`Error adding HE for ${translation.key}:`, heError.message);
          errorCount++;
          continue;
        }

        console.log(`✓ ${translation.key}`);
        console.log(`  EN: ${translation.en}`);
        console.log(`  HE: ${translation.he}`);
        successCount++;
      } catch (err) {
        console.error(`Error processing ${translation.key}:`, err);
        errorCount++;
      }
    }

    console.log(`\n✅ Successfully added ${successCount} translations`);
    if (errorCount > 0) {
      console.log(`❌ Failed to add ${errorCount} translations`);
    }
    console.log(`\nTotal translation keys: ${translations.length}`);
  } catch (error) {
    console.error('Error adding translations:', error);
  }
}

addTranslations();

/**
 * Add missing translations for compact notification form
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

const translations = [
  // Select labels
  { key: 'admin.notifications.selectUsers', en: 'Select Students', he: 'בחר תלמידים' },
  { key: 'admin.notifications.selectCourses', en: 'Select Courses', he: 'בחר קורסים' },
  { key: 'admin.notifications.selectPrograms', en: 'Select Programs', he: 'בחר תוכניות' },

  // Search placeholders
  { key: 'admin.notifications.searchUsers', en: 'Search students...', he: 'חפש תלמידים...' },
  { key: 'admin.notifications.searchCourses', en: 'Search courses...', he: 'חפש קורסים...' },
  { key: 'admin.notifications.searchPrograms', en: 'Search programs...', he: 'חפש תוכניות...' },

  // Common
  { key: 'common.noResults', en: 'No results found', he: 'לא נמצאו תוצאות' },
  { key: 'common.selected', en: 'selected', he: 'נבחרו' },
];

async function addTranslations() {
  console.log('\n🌍 Adding missing compact form translations...\n');

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

    let addedCount = 0;
    let skippedCount = 0;

    for (const tenant of tenants || []) {
      console.log(`🏢 Processing tenant: ${tenant.name}`);

      for (const translation of translations) {
        // Check if English translation already exists
        const { data: existingEn } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'en')
          .single();

        if (!existingEn) {
          await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              translation_key: translation.key,
              translation_value: translation.en,
              language_code: 'en',
              context: 'admin',
            });
          addedCount++;
        } else {
          skippedCount++;
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
          await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              translation_key: translation.key,
              translation_value: translation.he,
              language_code: 'he',
              context: 'admin',
            });
          addedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log('');
    }

    console.log('✅ Missing translations added!\n');
    console.log(`   Added: ${addedCount} translations`);
    console.log(`   Skipped (already exist): ${skippedCount} translations\n`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTranslations();

/**
 * Add translations for notification entity types
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
  // English - Entity Types
  { key: 'admin.notifications.entityType.student', en: 'Student', he: 'תלמיד' },
  { key: 'admin.notifications.entityType.course', en: 'Course', he: 'קורס' },
  { key: 'admin.notifications.entityType.program', en: 'Program', he: 'תוכנית' },
  { key: 'admin.notifications.entityType.allUsers', en: 'All Users', he: 'כל המשתמשים' },

  // Table headers
  { key: 'admin.notifications.table.title', en: 'Title', he: 'כותרת' },
  { key: 'admin.notifications.table.recipient', en: 'Sent To', he: 'נשלח אל' },
  { key: 'admin.notifications.table.scope', en: 'Scope', he: 'טווח' },
  { key: 'admin.notifications.table.category', en: 'Category', he: 'קטגוריה' },
  { key: 'admin.notifications.table.priority', en: 'Priority', he: 'עדיפות' },
  { key: 'admin.notifications.table.date', en: 'Date', he: 'תאריך' },
  { key: 'admin.notifications.table.reads', en: 'Reads', he: 'נקראו' },

  // Filter labels
  { key: 'admin.notifications.filterScope', en: 'Filter by Scope', he: 'סנן לפי טווח' },
  { key: 'admin.notifications.filterCategory', en: 'Filter by Category', he: 'סנן לפי קטגוריה' },
  { key: 'admin.notifications.filterPriority', en: 'Filter by Priority', he: 'סנן לפי עדיפות' },
  { key: 'admin.notifications.noMatchingFilters', en: 'No notifications match your filters', he: 'אין התראות התואמות את הסינון' },
];

async function addTranslations() {
  console.log('\n🌍 Adding notification entity type translations...\n');

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
          console.log(`   ✅ Added EN: ${translation.key}`);
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
          console.log(`   ✅ Added HE: ${translation.key}`);
        }
      }

      console.log('');
    }

    console.log('✅ Notification entity translations complete!\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTranslations();

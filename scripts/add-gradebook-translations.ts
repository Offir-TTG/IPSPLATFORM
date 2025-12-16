import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addGradebookTranslations() {
  try {
    console.log('🚀 Adding gradebook translations...\n');

    // Get the first tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      throw new Error('No tenant found. Please create a tenant first.');
    }

    const tenantId = tenant.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Delete existing translations to avoid duplicates
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'admin.grading.gradebook.%');

    if (deleteError) {
      console.error('Warning: Error deleting old translations:', deleteError.message);
    } else {
      console.log('✓ Cleaned up existing translations\n');
    }

    // Prepare translations
    const translations = [
      // Gradebook Page Header
      { key: 'admin.grading.gradebook.title', en: 'Gradebook', he: 'ספר ציונים' },
      { key: 'admin.grading.gradebook.subtitle', en: 'Manage student grades for this course', he: 'נהל ציוני תלמידים עבור קורס זה' },

      // Gradebook Actions
      { key: 'admin.grading.gradebook.export', en: 'Export', he: 'ייצא' },
      { key: 'admin.grading.gradebook.import', en: 'Import', he: 'ייבא' },

      // Gradebook Table
      { key: 'admin.grading.gradebook.student', en: 'Student', he: 'תלמיד' },
      { key: 'admin.grading.gradebook.total', en: 'Total', he: 'סה"כ' },

      // Gradebook Empty States
      { key: 'admin.grading.gradebook.empty.title', en: 'No Data Available', he: 'אין נתונים זמינים' },
      { key: 'admin.grading.gradebook.empty.noStudents', en: 'No students enrolled in this course', he: 'אין תלמידים רשומים לקורס זה' },
      { key: 'admin.grading.gradebook.empty.noItems', en: 'No grade items created for this course', he: 'לא נוצרו פריטי ציון עבור קורס זה' },

      // Gradebook Messages
      { key: 'admin.grading.gradebook.noChanges', en: 'No changes to save', he: 'אין שינויים לשמור' },
      { key: 'admin.grading.gradebook.success.saved', en: 'Grades saved successfully', he: 'הציונים נשמרו בהצלחה' },

      // Gradebook Errors
      { key: 'admin.grading.gradebook.error.load', en: 'Failed to load gradebook data', he: 'נכשל בטעינת נתוני ספר הציונים' },
      { key: 'admin.grading.gradebook.error.save', en: 'Failed to save grades', he: 'נכשל בשמירת הציונים' },
    ];

    // Insert all translations
    const translationsToInsert = [];
    for (const trans of translations) {
      translationsToInsert.push({
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: trans.key,
        translation_value: trans.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      translationsToInsert.push({
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: trans.key,
        translation_value: trans.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const { error: insertError } = await supabase
      .from('translations')
      .insert(translationsToInsert);

    if (insertError) {
      throw new Error(`Failed to insert translations: ${insertError.message}`);
    }

    console.log('✅ Added gradebook translations');
    console.log(`Total translations added: ${translations.length} keys × 2 languages = ${translationsToInsert.length} entries\n`);

    console.log('📋 Translation keys added:');
    translations.forEach((trans, index) => {
      console.log(`  ${index + 1}. ${trans.key}`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addGradebookTranslations();

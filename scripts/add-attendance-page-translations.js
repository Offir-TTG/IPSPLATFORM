const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Attendance Page
  { key: 'user.attendance.title', en: 'My Attendance', he: 'הנוכחות שלי' },
  { key: 'user.attendance.subtitle', en: 'View all your attendance records', he: 'צפה בכל רישומי הנוכחות שלך' },
  { key: 'user.attendance.errorTitle', en: 'Error loading attendance', he: 'שגיאה בטעינת הנוכחות' },
  { key: 'user.attendance.errorMessage', en: 'Failed to load your attendance data. Please try again.', he: 'נכשל בטעינת נתוני הנוכחות שלך. אנא נסה שוב.' },
  { key: 'user.attendance.retry', en: 'Retry', he: 'נסה שוב' },

  // Filters
  { key: 'user.attendance.filter.all', en: 'All Records', he: 'כל הרישומים' },

  // Empty States
  { key: 'user.attendance.noRecords', en: 'No attendance records', he: 'אין רישומי נוכחות' },
  { key: 'user.attendance.noRecordsAll', en: 'Your attendance will appear here once recorded', he: 'הנוכחות שלך תופיע כאן לאחר רישום' },
  { key: 'user.attendance.noRecordsPresent', en: 'No present records found', he: 'לא נמצאו רישומי נוכחות' },
  { key: 'user.attendance.noRecordsAbsent', en: 'No absent records found', he: 'לא נמצאו רישומי היעדרות' },
];

async function addTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;
    let addedCount = 0;
    let updatedCount = 0;

    console.log(`Processing ${translations.length} translation keys...\n`);

    for (const translation of translations) {
      const { key, en, he } = translation;

      // Process Hebrew translation
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he');

      if (existingHe && existingHe.length > 0) {
        const { error: updateError } = await supabase
          .from('translations')
          .update({ translation_value: he })
          .eq('tenant_id', tenantId)
          .eq('translation_key', key)
          .eq('language_code', 'he');

        if (!updateError) {
          updatedCount++;
          console.log(`✅ Updated HE: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: he,
            language_code: 'he',
            context: 'user'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added HE: ${key}`);
        }
      }

      // Process English translation
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en');

      if (existingEn && existingEn.length > 0) {
        const { error: updateError } = await supabase
          .from('translations')
          .update({ translation_value: en })
          .eq('tenant_id', tenantId)
          .eq('translation_key', key)
          .eq('language_code', 'en');

        if (!updateError) {
          updatedCount++;
          console.log(`✅ Updated EN: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: en,
            language_code: 'en',
            context: 'user'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added EN: ${key}`);
        }
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(`Total added: ${addedCount}`);
    console.log(`Total updated: ${updatedCount}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();

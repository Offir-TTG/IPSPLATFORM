const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runTranslations() {
  console.log('Adding lesson status and duration translations...\n');

  // Read the SQL file
  const sql = fs.readFileSync(
    './supabase/SQL Scripts/20250117_add_lesson_status_translations.sql',
    'utf8'
  );

  try {
    // Get tenant ID first
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // Delete existing translations
    const keysToDelete = [
      'user.courses.status.completed',
      'user.courses.status.notCompleted',
      'user.courses.status.inProgress',
      'user.courses.status.notStarted',
      'user.courses.duration.hours',
      'user.courses.duration.minutes',
      'user.courses.duration.hoursShort',
      'user.courses.duration.minutesShort'
    ];

    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .in('translation_key', keysToDelete);

    if (deleteError) {
      console.log('Note: Could not delete existing translations:', deleteError.message);
    } else {
      console.log('✓ Deleted existing translations');
    }

    // Insert new translations
    const translations = [
      // English
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.status.completed', translation_value: 'Completed', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.status.notCompleted', translation_value: 'Not Completed', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.status.inProgress', translation_value: 'In Progress', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.status.notStarted', translation_value: 'Not Started', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.duration.hours', translation_value: 'hours', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.duration.minutes', translation_value: 'minutes', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.duration.hoursShort', translation_value: 'h', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.duration.minutesShort', translation_value: 'm', context: 'user' },

      // Hebrew
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.status.completed', translation_value: 'הושלם', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.status.notCompleted', translation_value: 'לא הושלם', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.status.inProgress', translation_value: 'בתהליך', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.status.notStarted', translation_value: 'לא התחיל', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.duration.hours', translation_value: 'שעות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.duration.minutes', translation_value: 'דקות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.duration.hoursShort', translation_value: 'שעה', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.duration.minutesShort', translation_value: 'דק\'', context: 'user' },
    ];

    const { error: insertError } = await supabase
      .from('translations')
      .insert(translations);

    if (insertError) {
      throw insertError;
    }

    console.log('✓ Added status translations: completed, notCompleted, inProgress, notStarted');
    console.log('✓ Added duration unit translations for both English and Hebrew');
    console.log('\n✅ Translations added successfully!');
    console.log('\nYou can now see:');
    console.log('  - "Completed" / "הושלם" badges');
    console.log('  - "Not Completed" / "לא הושלם" badges');
    console.log('  - Duration units: "2h 30m" / "2שעה 30דק\'"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

runTranslations();

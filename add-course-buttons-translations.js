const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslations() {
  console.log('Adding user courses page translations...\n');

  try {
    // Get tenant ID
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
      'user.courses.actions.startLearning',
      'user.courses.actions.continueLearning',
      'user.courses.actions.review',
      'user.courses.actions.getCertificate',
      'user.courses.actions.viewGrades',
      'user.courses.actions.viewAttendance',
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
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.actions.startLearning', translation_value: 'Start Learning', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.actions.continueLearning', translation_value: 'Continue Learning', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.actions.review', translation_value: 'Review Course', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.actions.getCertificate', translation_value: 'Get Certificate', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.actions.viewGrades', translation_value: 'View Grades', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.courses.actions.viewAttendance', translation_value: 'View Attendance', context: 'user' },

      // Hebrew
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.actions.startLearning', translation_value: 'התחל ללמוד', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.actions.continueLearning', translation_value: 'המשך ללמוד', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.actions.review', translation_value: 'סקור קורס', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.actions.getCertificate', translation_value: 'קבל תעודה', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.actions.viewGrades', translation_value: 'צפה בציונים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.courses.actions.viewAttendance', translation_value: 'צפה בנוכחות', context: 'user' },
    ];

    const { error: insertError } = await supabase
      .from('translations')
      .insert(translations);

    if (insertError) {
      throw insertError;
    }

    console.log('✓ Added course action button translations');
    console.log('\n✅ Translations added successfully!');
    console.log('\nButton translations added:');
    console.log('  - Start Learning / התחל ללמוד');
    console.log('  - Continue Learning / המשך ללמוד');
    console.log('  - Review Course / סקור קורס');
    console.log('  - Get Certificate / קבל תעודה');
    console.log('  - View Grades / צפה בציונים');
    console.log('  - View Attendance / צפה בנוכחות');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

addTranslations();

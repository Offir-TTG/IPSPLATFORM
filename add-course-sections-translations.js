const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // English - Course Sections
  { lang: 'en', key: 'user.courses.sections.programCourses', value: 'Program Courses', ctx: 'user' },
  { lang: 'en', key: 'user.courses.sections.programCoursesDesc', value: 'Courses that are part of your enrolled programs', ctx: 'user' },
  { lang: 'en', key: 'user.courses.sections.standaloneCourses', value: 'Standalone Courses', ctx: 'user' },
  { lang: 'en', key: 'user.courses.sections.standaloneCoursesDesc', value: 'Independent courses not part of any program', ctx: 'user' },

  // Hebrew - Course Sections
  { lang: 'he', key: 'user.courses.sections.programCourses', value: 'קורסים במסגרת תוכנית', ctx: 'user' },
  { lang: 'he', key: 'user.courses.sections.programCoursesDesc', value: 'קורסים שהם חלק מהתוכניות שלך', ctx: 'user' },
  { lang: 'he', key: 'user.courses.sections.standaloneCourses', value: 'קורסים עצמאיים', ctx: 'user' },
  { lang: 'he', key: 'user.courses.sections.standaloneCoursesDesc', value: 'קורסים עצמאיים שאינם חלק מתוכנית', ctx: 'user' },
];

async function addTranslations() {
  console.log('Adding course sections translations...\n');

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

    // Delete existing translations with these keys first
    console.log('Cleaning up existing translations...');
    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.courses.sections.%');

    console.log('✓ Cleaned up existing translations\n');

    console.log(`\nInserting ${translations.length} translations...\n`);

    const records = translations.map(t => ({
      language_code: t.lang,
      translation_key: t.key,
      translation_value: t.value,
      context: t.ctx,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('translations')
      .insert(records);

    if (insertError) {
      console.error('Error inserting translations:', insertError);
      throw insertError;
    }

    console.log('✅ All course sections translations added successfully!');
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

addTranslations();

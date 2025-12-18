import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslations() {
  try {
    // Get the first tenant
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
      'admin.attendance.program',
      'admin.attendance.course',
      'admin.attendance.allPrograms',
      'admin.attendance.allCourses',
      'admin.attendance.selectProgram',
      'admin.attendance.selectCourse',
      'admin.attendance.noProgramsFound',
      'admin.attendance.noCoursesFound',
      'admin.attendance.clearAll'
    ];

    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .in('translation_key', keysToDelete);

    if (deleteError) {
      console.error('Error deleting old translations:', deleteError);
    } else {
      console.log('Deleted old translations');
    }

    // Insert new translations
    const translations = [
      // Program filter
      { language_code: 'en', translation_key: 'admin.attendance.program', translation_value: 'Program' },
      { language_code: 'he', translation_key: 'admin.attendance.program', translation_value: 'תוכנית' },
      { language_code: 'en', translation_key: 'admin.attendance.allPrograms', translation_value: 'All Programs' },
      { language_code: 'he', translation_key: 'admin.attendance.allPrograms', translation_value: 'כל התוכניות' },
      { language_code: 'en', translation_key: 'admin.attendance.selectProgram', translation_value: 'Select program...' },
      { language_code: 'he', translation_key: 'admin.attendance.selectProgram', translation_value: 'בחר תוכנית...' },
      { language_code: 'en', translation_key: 'admin.attendance.noProgramsFound', translation_value: 'No programs found' },
      { language_code: 'he', translation_key: 'admin.attendance.noProgramsFound', translation_value: 'לא נמצאו תוכניות' },

      // Course filter
      { language_code: 'en', translation_key: 'admin.attendance.course', translation_value: 'Course' },
      { language_code: 'he', translation_key: 'admin.attendance.course', translation_value: 'קורס' },
      { language_code: 'en', translation_key: 'admin.attendance.allCourses', translation_value: 'All Courses' },
      { language_code: 'he', translation_key: 'admin.attendance.allCourses', translation_value: 'כל הקורסים' },
      { language_code: 'en', translation_key: 'admin.attendance.selectCourse', translation_value: 'Select course...' },
      { language_code: 'he', translation_key: 'admin.attendance.selectCourse', translation_value: 'בחר קורס...' },
      { language_code: 'en', translation_key: 'admin.attendance.noCoursesFound', translation_value: 'No courses found' },
      { language_code: 'he', translation_key: 'admin.attendance.noCoursesFound', translation_value: 'לא נמצאו קורסים' },

      // Clear All button
      { language_code: 'en', translation_key: 'admin.attendance.clearAll', translation_value: 'Clear All' },
      { language_code: 'he', translation_key: 'admin.attendance.clearAll', translation_value: 'נקה הכל' },
    ];

    const translationsWithTenant = translations.map(t => ({
      ...t,
      tenant_id: tenantId,
      context: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('translations')
      .insert(translationsWithTenant);

    if (error) {
      console.error('Error inserting translations:', error);
      throw error;
    }

    console.log('✅ Successfully added attendance filter translations');
    console.log(`Total: ${translations.length} translations (${translations.length / 2} keys × 2 languages)`);

  } catch (error) {
    console.error('Failed to add translations:', error);
    process.exit(1);
  }
}

addTranslations();

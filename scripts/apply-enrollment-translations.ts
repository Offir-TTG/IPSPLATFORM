import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyTranslations() {
  console.log('🚀 Starting translation migration...');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251126_add_enrollment_dialog_translations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📝 Executing SQL...');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  RPC method not available, trying direct execution...');

      // Parse and execute the migration manually
      await executeTranslationMigration();
    } else {
      console.log('✅ Migration executed successfully!');
      console.log(data);
    }

    // Verify translations were added
    console.log('\n🔍 Verifying translations...');
    const { data: translations, error: verifyError } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .like('translation_key', 'admin.enrollments.create%')
      .order('translation_key')
      .order('language_code');

    if (verifyError) {
      console.error('❌ Error verifying translations:', verifyError);
    } else {
      console.log(`✅ Found ${translations?.length || 0} translations`);
      console.log('\nSample translations:');
      translations?.slice(0, 6).forEach(t => {
        console.log(`  ${t.language_code} - ${t.translation_key}: ${t.translation_value}`);
      });
    }

  } catch (error) {
    console.error('❌ Error applying translations:', error);
    process.exit(1);
  }
}

async function executeTranslationMigration() {
  console.log('📝 Executing translation migration directly...');

  // Get default tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'default')
    .single();

  if (tenantError || !tenant) {
    throw new Error('Default tenant not found');
  }

  const tenantId = tenant.id;
  console.log(`✅ Found tenant: ${tenantId}`);

  // Delete existing translations
  const keysToDelete = [
    'admin.enrollments.createEnrollment',
    'admin.enrollments.create.title',
    'admin.enrollments.create.description',
    'admin.enrollments.create.user',
    'admin.enrollments.create.selectUser',
    'admin.enrollments.create.noUsers',
    'admin.enrollments.create.contentType',
    'admin.enrollments.create.program',
    'admin.enrollments.create.course',
    'admin.enrollments.create.selectProgram',
    'admin.enrollments.create.selectCourse',
    'admin.enrollments.create.selectProgramPlaceholder',
    'admin.enrollments.create.selectCoursePlaceholder',
    'admin.enrollments.create.noPrograms',
    'admin.enrollments.create.noCourses',
    'admin.enrollments.create.requirePayment',
    'admin.enrollments.create.expiryDate',
    'admin.enrollments.create.notes',
    'admin.enrollments.create.notesPlaceholder',
    'admin.enrollments.create.alert',
    'admin.enrollments.create.submit',
    'admin.enrollments.create.success',
    'admin.enrollments.create.error',
    'admin.enrollments.create.validationError'
  ];

  console.log('🗑️  Deleting existing translations...');
  const { error: deleteError } = await supabase
    .from('translations')
    .delete()
    .in('translation_key', keysToDelete);

  if (deleteError) {
    console.warn('⚠️  Warning deleting old translations:', deleteError.message);
  }

  // Insert new translations
  const translations = [
    // English translations
    { language_code: 'en', translation_key: 'admin.enrollments.createEnrollment', translation_value: 'Create Enrollment', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.title', translation_value: 'Create Manual Enrollment', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.description', translation_value: 'Manually enroll a user in a program or course', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.user', translation_value: 'Select User', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.selectUser', translation_value: 'Choose a user...', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.noUsers', translation_value: 'No users found', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.contentType', translation_value: 'Content Type', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.program', translation_value: 'Program', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.course', translation_value: 'Course', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.selectProgram', translation_value: 'Select Program', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.selectCourse', translation_value: 'Select Course', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.selectProgramPlaceholder', translation_value: 'Choose a program...', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.selectCoursePlaceholder', translation_value: 'Choose a course...', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.noPrograms', translation_value: 'No programs found', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.noCourses', translation_value: 'No courses found', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.requirePayment', translation_value: 'Require payment (enrollment pending until paid)', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.expiryDate', translation_value: 'Expiry Date (Optional)', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.notes', translation_value: 'Notes (Optional)', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.notesPlaceholder', translation_value: 'e.g., Company-sponsored enrollment', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.alert', translation_value: 'This enrollment will be marked as admin-assigned and will bypass the normal purchase flow.', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.submit', translation_value: 'Create Enrollment', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.success', translation_value: 'Enrollment created successfully', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.error', translation_value: 'Failed to create enrollment', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'en', translation_key: 'admin.enrollments.create.validationError', translation_value: 'Please select both user and content', category: 'admin', context: 'both', tenant_id: tenantId },

    // Hebrew translations
    { language_code: 'he', translation_key: 'admin.enrollments.createEnrollment', translation_value: 'צור רישום', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.title', translation_value: 'צור רישום ידני', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.description', translation_value: 'רשום משתמש באופן ידני לתוכנית או קורס', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.user', translation_value: 'בחר משתמש', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.selectUser', translation_value: 'בחר משתמש...', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.noUsers', translation_value: 'לא נמצאו משתמשים', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.contentType', translation_value: 'סוג תוכן', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.program', translation_value: 'תוכנית', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.course', translation_value: 'קורס', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.selectProgram', translation_value: 'בחר תוכנית', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.selectCourse', translation_value: 'בחר קורס', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.selectProgramPlaceholder', translation_value: 'בחר תוכנית...', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.selectCoursePlaceholder', translation_value: 'בחר קורס...', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.noPrograms', translation_value: 'לא נמצאו תוכניות', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.noCourses', translation_value: 'לא נמצאו קורסים', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.requirePayment', translation_value: 'דרוש תשלום (הרישום ממתין עד לתשלום)', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.expiryDate', translation_value: 'תאריך תפוגה (אופציונלי)', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.notes', translation_value: 'הערות (אופציונלי)', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.notesPlaceholder', translation_value: 'לדוגמה: רישום ממומן על ידי חברה', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.alert', translation_value: 'רישום זה יסומן כמוקצה על ידי מנהל ויעקוף את תהליך הרכישה הרגיל.', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.submit', translation_value: 'צור רישום', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.success', translation_value: 'הרישום נוצר בהצלחה', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.error', translation_value: 'נכשל ביצירת הרישום', category: 'admin', context: 'both', tenant_id: tenantId },
    { language_code: 'he', translation_key: 'admin.enrollments.create.validationError', translation_value: 'אנא בחר גם משתמש וגם תוכן', category: 'admin', context: 'both', tenant_id: tenantId },
  ];

  console.log(`📝 Inserting ${translations.length} translations...`);

  const { data, error } = await supabase
    .from('translations')
    .upsert(translations, {
      onConflict: 'translation_key,language_code,tenant_id',
      ignoreDuplicates: false
    });

  if (error) {
    throw error;
  }

  console.log('✅ Translations inserted successfully!');
}

applyTranslations();

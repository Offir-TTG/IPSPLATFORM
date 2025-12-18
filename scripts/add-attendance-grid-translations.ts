const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  { key: 'admin.attendance.grid', en: 'Attendance Grid', he: 'רשת נוכחות' },
  { key: 'admin.attendance.selectDate', en: 'Select Date', he: 'בחר תאריך' },
  { key: 'admin.attendance.legend', en: 'Legend', he: 'מקרא' },
  { key: 'admin.attendance.actions', en: 'Actions', he: 'פעולות' },
  { key: 'admin.attendance.markAllPresent', en: 'Mark all present', he: 'סמן הכל כנוכחים' },
  { key: 'admin.attendance.markAllAbsent', en: 'Mark all absent', he: 'סמן הכל כנעדרים' },
  { key: 'admin.attendance.lessons', en: 'Lessons', he: 'שיעורים' },
  { key: 'admin.attendance.noData', en: 'No students or lessons found for this course', he: 'לא נמצאו תלמידים או שיעורים לקורס זה' },
];

async function addTranslations() {
  try {
    console.log('🚀 Adding Attendance Grid translations...\n');

    // Get tenant
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      console.error('❌ No tenant found');
      process.exit(1);
    }

    const tenantId = tenants[0].id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Insert translations
    for (const trans of translations) {
      // Admin English
      await supabase.from('translations').upsert({
        tenant_id: tenantId,
        key: trans.key,
        value: trans.en,
        language: 'en',
        category: 'admin',
      }, { onConflict: 'tenant_id,key,language,category' });

      // Admin Hebrew
      await supabase.from('translations').upsert({
        tenant_id: tenantId,
        key: trans.key,
        value: trans.he,
        language: 'he',
        category: 'admin',
      }, { onConflict: 'tenant_id,key,language,category' });
    }

    console.log('✅ Added Attendance Grid translations');
    console.log(`Total translations added: ${translations.length} keys × 2 languages = ${translations.length * 2} entries\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTranslations();

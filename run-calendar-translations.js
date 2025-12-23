const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: '.env.local' });

async function runTranslations() {
  // Read environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read SQL file
  const sqlPath = path.join(__dirname, 'supabase', 'SQL Scripts', '20251218_calendar_translations.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Running calendar translations script...');

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

  if (error) {
    console.error('Error executing SQL:', error);

    // Try direct execution as fallback
    console.log('Trying direct execution...');

    // Parse and execute the SQL commands
    const cleanSql = sql
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/DO \$\$/gi, '')
      .replace(/END \$\$;/gi, '');

    // Get tenant
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      process.exit(1);
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // Delete existing calendar translations
    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.calendar.%');

    console.log('Deleted existing calendar translations');

    // Insert English translations
    const enTranslations = [
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.title', translation_value: 'My Calendar', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.subtitle', translation_value: 'View all your upcoming sessions and meetings', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.filter.all', translation_value: 'All Sessions', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.filter.today', translation_value: 'Today', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.filter.next24h', translation_value: 'Next 24h', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.instructor', translation_value: 'Instructor', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.starts', translation_value: 'Starts', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.joinSession', translation_value: 'Join Session', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.noSessions', translation_value: 'No sessions found', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.noSessionsAll', translation_value: 'You have no upcoming sessions scheduled', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.noSessionsToday', translation_value: 'You have no sessions scheduled for today', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.noSessionsNext24h', translation_value: 'You have no sessions in the next 24 hours', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.browseCourses', translation_value: 'Browse Courses', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.showing', translation_value: 'Showing', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.session', translation_value: 'session', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.sessions', translation_value: 'sessions', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.viewAll', translation_value: 'View All', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.errorTitle', translation_value: 'Error loading calendar', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.errorMessage', translation_value: 'Failed to load your calendar data. Please try again.', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.calendar.retry', translation_value: 'Retry', context: 'user' },
    ];

    const { error: enError } = await supabase
      .from('translations')
      .insert(enTranslations);

    if (enError) {
      console.error('Error inserting English translations:', enError);
      process.exit(1);
    }

    console.log('Inserted English translations');

    // Insert Hebrew translations
    const heTranslations = [
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.title', translation_value: 'היומן שלי', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.subtitle', translation_value: 'צפה בכל המפגשים והפגישות הקרובים שלך', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.filter.all', translation_value: 'כל המפגשים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.filter.today', translation_value: 'היום', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.filter.next24h', translation_value: '24 השעות הקרובות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.instructor', translation_value: 'מרצה', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.starts', translation_value: 'מתחיל', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.joinSession', translation_value: 'הצטרף למפגש', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.noSessions', translation_value: 'לא נמצאו מפגשים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.noSessionsAll', translation_value: 'אין לך מפגשים קרובים מתוזמנים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.noSessionsToday', translation_value: 'אין לך מפגשים מתוזמנים להיום', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.noSessionsNext24h', translation_value: 'אין לך מפגשים ב-24 השעות הקרובות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.browseCourses', translation_value: 'עיין בקורסים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.showing', translation_value: 'מציג', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.session', translation_value: 'מפגש', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.sessions', translation_value: 'מפגשים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.viewAll', translation_value: 'הצג הכל', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.errorTitle', translation_value: 'שגיאה בטעינת היומן', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.errorMessage', translation_value: 'נכשל בטעינת נתוני היומן. אנא נסה שנית.', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.calendar.retry', translation_value: 'נסה שוב', context: 'user' },
    ];

    const { error: heError } = await supabase
      .from('translations')
      .insert(heTranslations);

    if (heError) {
      console.error('Error inserting Hebrew translations:', heError);
      process.exit(1);
    }

    console.log('Inserted Hebrew translations');
    console.log('✅ Calendar translations added successfully!');
    process.exit(0);
  }

  console.log('✅ SQL executed successfully!');
}

runTranslations();

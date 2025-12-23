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
  // Calendar Page
  { key: 'user.calendar.title', en: 'My Calendar', he: 'לוח השנה שלי' },
  { key: 'user.calendar.subtitle', en: 'View all your upcoming sessions and meetings', he: 'צפה בכל המפגשים והפגישות הקרובים שלך' },
  { key: 'user.calendar.errorTitle', en: 'Error loading calendar', he: 'שגיאה בטעינת לוח השנה' },
  { key: 'user.calendar.errorMessage', en: 'Failed to load your calendar data. Please try again.', he: 'נכשל בטעינת נתוני לוח השנה שלך. אנא נסה שוב.' },
  { key: 'user.calendar.retry', en: 'Retry', he: 'נסה שוב' },

  // Filters
  { key: 'user.calendar.filter.all', en: 'All Sessions', he: 'כל המפגשים' },
  { key: 'user.calendar.filter.today', en: 'Today', he: 'היום' },
  { key: 'user.calendar.filter.next24h', en: 'Next 24h', he: '24 שעות הקרובות' },

  // Empty States
  { key: 'user.calendar.noSessions', en: 'No sessions found', he: 'לא נמצאו מפגשים' },
  { key: 'user.calendar.noSessionsAll', en: 'You have no upcoming sessions scheduled', he: 'אין לך מפגשים מתוכננים' },
  { key: 'user.calendar.noSessionsToday', en: 'You have no sessions scheduled for today', he: 'אין לך מפגשים מתוכננים להיום' },
  { key: 'user.calendar.noSessionsNext24h', en: 'You have no sessions in the next 24 hours', he: 'אין לך מפגשים ב-24 השעות הקרובות' },
  { key: 'user.calendar.browseCourses', en: 'Browse Courses', he: 'עיין בקורסים' },

  // Session Details
  { key: 'user.calendar.instructor', en: 'Instructor', he: 'מדריך' },
  { key: 'user.calendar.starts', en: 'Starts', he: 'מתחיל' },
  { key: 'user.calendar.joinSession', en: 'Join Session', he: 'הצטרף למפגש' },

  // Summary
  { key: 'user.calendar.showing', en: 'Showing', he: 'מציג' },
  { key: 'user.calendar.session', en: 'session', he: 'מפגש' },
  { key: 'user.calendar.sessions', en: 'sessions', he: 'מפגשים' },
  { key: 'user.calendar.viewAll', en: 'View All', he: 'צפה בהכל' },
];

async function addTranslations() {
  try {
    // Get the default tenant
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

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

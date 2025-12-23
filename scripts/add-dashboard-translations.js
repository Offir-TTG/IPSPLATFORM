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
  // Stats Cards
  { key: 'user.dashboard.stats.studyHours', en: 'Study Hours', he: 'שעות לימוד' },
  { key: 'user.dashboard.stats.allTime', en: 'All time learning', he: 'סך כל הלימוד' },
  { key: 'user.dashboard.stats.completionRate', en: 'Completion Rate', he: 'שיעור השלמה' },
  { key: 'user.dashboard.stats.courses', en: 'courses', he: 'קורסים' },
  { key: 'user.dashboard.stats.upcomingSessions', en: 'Upcoming Sessions', he: 'שיעורים קרובים' },
  { key: 'user.dashboard.stats.thisWeek', en: 'This week', he: 'השבוע' },
  { key: 'user.dashboard.stats.attendance', en: 'Attendance', he: 'נוכחות' },
  { key: 'user.dashboard.stats.thisMonth', en: 'This month', he: 'החודש' },
  { key: 'user.dashboard.stats.today', en: 'Today', he: 'היום' },
  { key: 'user.dashboard.stats.tomorrow', en: 'Tomorrow', he: 'מחר' },
  { key: 'user.dashboard.stats.noUpcoming', en: 'No sessions', he: 'אין שיעורים' },

  // Weekly Activity
  { key: 'user.dashboard.weeklyActivity.title', en: 'Weekly Activity', he: 'פעילות שבועית' },
  { key: 'user.dashboard.weeklyActivity.subtitle', en: 'Your learning this week', he: 'הלימוד שלך השבוע' },
  { key: 'user.dashboard.weeklyActivity.lessons', en: 'lessons', he: 'שיעורים' },
  { key: 'user.dashboard.weeklyActivity.avgDaily', en: 'Avg Daily', he: 'ממוצע יומי' },
  { key: 'user.dashboard.weeklyActivity.activeDays', en: 'Active Days', he: 'ימי לימוד' },

  // Progress Overview
  { key: 'user.dashboard.progress.title', en: 'Progress Overview', he: 'סקירת התקדמות' },
  { key: 'user.dashboard.progress.subtitle', en: 'Your learning journey at a glance', he: 'מסע הלימוד שלך במבט חטוף' },
  { key: 'user.dashboard.progress.completed', en: 'Completed', he: 'הושלמו' },
  { key: 'user.dashboard.progress.inProgress', en: 'In Progress', he: 'בתהליך' },
  { key: 'user.dashboard.progress.lessons', en: 'lessons', he: 'שיעורים' },
  { key: 'user.dashboard.progress.done', en: 'Done', he: 'הושלם' },
  { key: 'user.dashboard.progress.completedCourses', en: 'Completed', he: 'הושלמו' },
  { key: 'user.dashboard.progress.activeCourses', en: 'Active', he: 'פעילים' },
  { key: 'user.dashboard.progress.totalCourses', en: 'Total', he: 'סך הכל' },

  // Welcome Hero
  { key: 'user.dashboard.hero.greeting.morning', en: 'Good morning', he: 'בוקר טוב' },
  { key: 'user.dashboard.hero.greeting.afternoon', en: 'Good afternoon', he: 'אחר צהריים טובים' },
  { key: 'user.dashboard.hero.greeting.evening', en: 'Good evening', he: 'ערב טוב' },
  { key: 'user.dashboard.hero.welcome', en: 'Welcome back', he: 'שמחים לראותך שוב' },
  { key: 'user.dashboard.hero.subtitle', en: "You're making great progress! Let's continue your learning journey today.", he: 'אתה מתקדם בצורה מעולה! בוא נמשיך את מסע הלימוד שלך היום.' },
  { key: 'user.dashboard.hero.stats.studyTime', en: 'study time', he: 'זמן לימוד' },
  { key: 'user.dashboard.hero.stats.completed', en: 'completion rate', he: 'שיעור השלמה' },
  { key: 'user.dashboard.hero.actions.programs', en: 'My Programs', he: 'התוכניות שלי' },
  { key: 'user.dashboard.hero.actions.courses', en: 'My Courses', he: 'הקורסים שלי' },
  { key: 'user.dashboard.hero.actions.notifications', en: 'Notifications', he: 'התראות' },
  { key: 'user.dashboard.hero.actions.profile', en: 'Profile', he: 'פרופיל' },

  // Dashboard errors and general
  { key: 'user.dashboard.errorTitle', en: 'Error loading dashboard', he: 'שגיאה בטעינת לוח הבקרה' },
  { key: 'user.dashboard.errorMessage', en: 'Failed to load your dashboard data. Please try again.', he: 'נכשל בטעינת נתוני לוח הבקרה. אנא נסה שוב.' },
  { key: 'user.dashboard.retry', en: 'Retry', he: 'נסה שוב' },
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

    console.log('\n========================================');
    console.log('Dashboard translations completed!');
    console.log(`Added: ${addedCount} translations`);
    console.log(`Updated: ${updatedCount} translations`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();

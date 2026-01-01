import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  // Page Header
  { key: 'user.reports.title', en: 'My Reports', he: 'הדוחות שלי' },
  { key: 'user.reports.subtitle', en: 'Track your learning progress and achievements', he: 'עקוב אחר התקדמות הלמידה וההישגים שלך' },
  { key: 'user.reports.exportReport', en: 'Export Report', he: 'ייצוא דוח' },
  { key: 'user.reports.filter', en: 'Filter', he: 'סינון' },

  // Stats Cards
  { key: 'user.reports.stats.totalLearningTime', en: 'Total Learning Time', he: 'סך זמן למידה' },
  { key: 'user.reports.stats.hrs', en: 'hrs', he: 'שעות' },
  { key: 'user.reports.stats.lessonsCompleted', en: 'Lessons Completed', he: 'שיעורים שהושלמו' },
  { key: 'user.reports.stats.certificatesEarned', en: 'Certificates Earned', he: 'תעודות שהושגו' },
  { key: 'user.reports.stats.averageScore', en: 'Average Score', he: 'ציון ממוצע' },

  // Charts
  { key: 'user.reports.charts.learningActivity', en: 'Learning Activity', he: 'פעילות למידה' },
  { key: 'user.reports.charts.last7Days', en: 'Last 7 days', he: '7 הימים האחרונים' },
  { key: 'user.reports.charts.courseProgress', en: 'Course Progress', he: 'התקדמות קורסים' },
  { key: 'user.reports.charts.yourActiveCourses', en: 'Your active courses', he: 'הקורסים הפעילים שלך' },

  // Days of the week
  { key: 'user.reports.days.mon', en: 'Mon', he: 'ב\'' },
  { key: 'user.reports.days.tue', en: 'Tue', he: 'ג\'' },
  { key: 'user.reports.days.wed', en: 'Wed', he: 'ד\'' },
  { key: 'user.reports.days.thu', en: 'Thu', he: 'ה\'' },
  { key: 'user.reports.days.fri', en: 'Fri', he: 'ו\'' },
  { key: 'user.reports.days.sat', en: 'Sat', he: 'ש\'' },
  { key: 'user.reports.days.sun', en: 'Sun', he: 'א\'' },

  // Sample Course Names
  { key: 'user.reports.courses.advancedReactPatterns', en: 'Advanced React Patterns', he: 'תבניות React מתקדמות' },
  { key: 'user.reports.courses.typescriptMastery', en: 'TypeScript Mastery', he: 'שליטה ב-TypeScript' },
  { key: 'user.reports.courses.nodejsBackend', en: 'Node.js Backend Development', he: 'פיתוח Backend ב-Node.js' },
  { key: 'user.reports.courses.uiuxDesign', en: 'UI/UX Design Fundamentals', he: 'יסודות עיצוב UI/UX' },

  // Recent Activity
  { key: 'user.reports.activity.title', en: 'Recent Activity', he: 'פעילות אחרונה' },
  { key: 'user.reports.activity.subtitle', en: 'Your latest achievements and milestones', he: 'ההישגים ואבני הדרך האחרונים שלך' },
  { key: 'user.reports.activity.certificateEarned', en: 'Certificate Earned', he: 'תעודה הושגה' },
  { key: 'user.reports.activity.reactCertification', en: 'Advanced React Certification', he: 'הסמכת React מתקדם' },
  { key: 'user.reports.activity.lessonCompleted', en: 'Lesson Completed', he: 'שיעור הושלם' },
  { key: 'user.reports.activity.typescriptGenerics', en: 'TypeScript Generics & Advanced Types', he: 'TypeScript Generics וסוגים מתקדמים' },
  { key: 'user.reports.activity.milestoneReached', en: 'Milestone Reached', he: 'אבן דרך הושגה' },
  { key: 'user.reports.activity.nodejsMilestone', en: '50% Complete in Node.js Backend', he: '50% הושלמו ב-Backend Node.js' },
  { key: 'user.reports.activity.quizPassed', en: 'Quiz Passed', he: 'מבחן עבר בהצלחה' },
  { key: 'user.reports.activity.uiuxQuiz', en: 'UI/UX Principles Quiz - Score: 95%', he: 'מבחן עקרונות UI/UX - ציון: 95%' },
  { key: 'user.reports.activity.hoursAgo', en: '{{hours}} hours ago', he: 'לפני {{hours}} שעות' },
  { key: 'user.reports.activity.daysAgo', en: '{{days}} days ago', he: 'לפני {{days}} ימים' },
];

async function insertTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('No tenant found');
      return;
    }

    const tenant = tenants[0];
    console.log(`\nInserting user reports translations for tenant: ${tenant.name} (${tenant.id})`);
    console.log(`Total translation keys: ${translations.length}`);
    console.log(`Total translations to insert: ${translations.length * 2} (Hebrew + English)\n`);

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const t of translations) {
      // Insert Hebrew
      const heResult = await supabase
        .from('translations')
        .insert({
          tenant_id: tenant.id,
          translation_key: t.key,
          translation_value: t.he,
          language_code: 'he',
          context: 'user'
        });

      if (heResult.error) {
        if (heResult.error.message.includes('duplicate')) {
          duplicateCount++;
        } else {
          console.error(`❌ Error inserting HE ${t.key}:`, heResult.error.message);
          errorCount++;
        }
      } else {
        console.log(`✓ Added HE: ${t.key}`);
        successCount++;
      }

      // Insert English
      const enResult = await supabase
        .from('translations')
        .insert({
          tenant_id: tenant.id,
          translation_key: t.key,
          translation_value: t.en,
          language_code: 'en',
          context: 'user'
        });

      if (enResult.error) {
        if (enResult.error.message.includes('duplicate')) {
          duplicateCount++;
        } else {
          console.error(`❌ Error inserting EN ${t.key}:`, enResult.error.message);
          errorCount++;
        }
      } else {
        console.log(`✓ Added EN: ${t.key}`);
        successCount++;
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`Successfully inserted: ${successCount}`);
    console.log(`Duplicates (already exist): ${duplicateCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

insertTranslations();

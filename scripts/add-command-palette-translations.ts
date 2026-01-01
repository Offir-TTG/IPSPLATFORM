import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  // Command Palette General
  { key: 'user.commandPalette.placeholder', en: 'Type a command or search...', he: 'הקלד פקודה או חפש...' },
  { key: 'user.commandPalette.noResults', en: 'No results found.', he: 'לא נמצאו תוצאות.' },

  // Group Headers
  { key: 'user.commandPalette.navigation', en: 'Navigation', he: 'ניווט' },
  { key: 'user.commandPalette.community', en: 'Community', he: 'קהילה' },
  { key: 'user.commandPalette.profile', en: 'Profile', he: 'פרופיל' },
  { key: 'user.commandPalette.quickActions', en: 'Quick Actions', he: 'פעולות מהירות' },

  // Navigation Items
  { key: 'user.commandPalette.dashboard', en: 'Dashboard', he: 'לוח בקרה' },
  { key: 'user.commandPalette.myLearning', en: 'My Learning', he: 'הלמידה שלי' },
  { key: 'user.commandPalette.assignments', en: 'Assignments', he: 'משימות' },
  { key: 'user.commandPalette.calendar', en: 'Calendar', he: 'יומן' },
  { key: 'user.commandPalette.progress', en: 'Progress', he: 'התקדמות' },

  // Community Items
  { key: 'user.commandPalette.communityHub', en: 'Community', he: 'קהילה' },
  { key: 'user.commandPalette.discussions', en: 'Discussions', he: 'דיונים' },

  // Profile Items
  { key: 'user.commandPalette.achievements', en: 'Achievements', he: 'הישגים' },
  { key: 'user.commandPalette.certificates', en: 'Certificates', he: 'תעודות' },
  { key: 'user.commandPalette.settings', en: 'Settings', he: 'הגדרות' },

  // Quick Actions
  { key: 'user.commandPalette.searchCourses', en: 'Search Courses', he: 'חפש קורסים' },
  { key: 'user.commandPalette.submitAssignment', en: 'Submit Assignment', he: 'הגש משימה' },
];

async function insertTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('No tenant found');
      return;
    }

    const tenant = tenants[0];
    console.log(`\nInserting command palette translations for tenant: ${tenant.name} (${tenant.id})`);
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

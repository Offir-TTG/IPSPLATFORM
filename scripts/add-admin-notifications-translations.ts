import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Navigation
  { key: 'admin.nav.communications', he: 'תקשורת' },
  { key: 'admin.nav.notifications', he: 'התראות' },

  // Page header
  { key: 'admin.notifications.title', he: 'התראות' },
  { key: 'admin.notifications.subtitle', he: 'שלח התראות למשתמשים, קורסים, תוכניות או לכל הארגון' },

  // Stats cards
  { key: 'admin.notifications.totalSent', he: 'סך הכל נשלחו' },
  { key: 'admin.notifications.allTime', he: 'מאז ומעולם' },
  { key: 'admin.notifications.todaySent', he: 'נשלחו היום' },
  { key: 'admin.notifications.last24Hours', he: '24 שעות אחרונות' },
  { key: 'admin.notifications.unreadTotal', he: 'סך הכל לא נקראו' },
  { key: 'admin.notifications.acrossAllUsers', he: 'בכל המשתמשים' },

  // Create form
  { key: 'admin.notifications.createTitle', he: 'צור התראה' },
  { key: 'admin.notifications.createDescription', he: 'שלח התראה למשתמשים שלך' },

  // Scope and targets
  { key: 'admin.notifications.scope', he: 'היקף' },
  { key: 'admin.notifications.individual', he: 'משתמש בודד' },
  { key: 'admin.notifications.course', he: 'קורס' },
  { key: 'admin.notifications.program', he: 'תוכנית' },
  { key: 'admin.notifications.tenant', he: 'כל הארגון' },

  { key: 'admin.notifications.targetUser', he: 'משתמש' },
  { key: 'admin.notifications.selectUser', he: 'בחר משתמש...' },
  { key: 'admin.notifications.targetCourse', he: 'קורס' },
  { key: 'admin.notifications.selectCourse', he: 'בחר קורס...' },
  { key: 'admin.notifications.targetProgram', he: 'תוכנית' },
  { key: 'admin.notifications.selectProgram', he: 'בחר תוכנית...' },

  // Category and priority
  { key: 'admin.notifications.category', he: 'קטגוריה' },
  { key: 'admin.notifications.categories.lesson', he: 'שיעור' },
  { key: 'admin.notifications.categories.assignment', he: 'מ과과ה' },
  { key: 'admin.notifications.categories.payment', he: 'תשלום' },
  { key: 'admin.notifications.categories.enrollment', he: 'הרשמה' },
  { key: 'admin.notifications.categories.attendance', he: 'נוכחות' },
  { key: 'admin.notifications.categories.achievement', he: 'הישג' },
  { key: 'admin.notifications.categories.announcement', he: 'הודעה' },
  { key: 'admin.notifications.categories.system', he: 'מערכת' },

  { key: 'admin.notifications.priority', he: 'עדיפות' },
  { key: 'admin.notifications.priorities.low', he: 'נמוכה' },
  { key: 'admin.notifications.priorities.medium', he: 'בינונית' },
  { key: 'admin.notifications.priorities.high', he: 'גבוהה' },
  { key: 'admin.notifications.priorities.urgent', he: 'דחוף' },

  // Content fields
  { key: 'admin.notifications.titleLabel', he: 'כותרת' },
  { key: 'admin.notifications.titlePlaceholder', he: 'כותרת ההתראה...' },
  { key: 'admin.notifications.messageLabel', he: 'הודעה' },
  { key: 'admin.notifications.messagePlaceholder', he: 'תוכן ההתראה...' },

  // Action fields
  { key: 'admin.notifications.actionUrl', he: 'קישור לפעולה' },
  { key: 'admin.notifications.actionLabel', he: 'תווית הפעולה' },
  { key: 'admin.notifications.actionLabelPlaceholder', he: 'צפה בפרטים' },

  // Expiration
  { key: 'admin.notifications.expiresAt', he: 'תפוגה' },
  { key: 'admin.notifications.expiresAtHelp', he: 'ההתראה תוסר אוטומטית לאחר מועד זה' },

  // Preview
  { key: 'admin.notifications.preview', he: 'תצוגה מקדימה' },

  // Buttons
  { key: 'admin.notifications.send', he: 'שלח התראה' },
  { key: 'admin.notifications.sending', he: 'שולח...' },

  // Messages
  { key: 'admin.notifications.sendSuccess', he: 'ההתראה נשלחה בהצלחה' },
  { key: 'admin.notifications.sendError', he: 'שליחת ההתראה נכשלה' },

  // Errors
  { key: 'admin.notifications.errors.titleRequired', he: 'כותרת היא שדה חובה' },
  { key: 'admin.notifications.errors.messageRequired', he: 'הודעה היא שדה חובה' },
  { key: 'admin.notifications.errors.userRequired', he: 'יש לבחור משתמש להתראות אישיות' },
  { key: 'admin.notifications.errors.courseRequired', he: 'יש לבחור קורס להתראות קורס' },
  { key: 'admin.notifications.errors.programRequired', he: 'יש לבחור תוכנית להתראות תוכנית' },

  // Help section
  { key: 'admin.notifications.helpTitle', he: 'איך התראות עובדות' },
  { key: 'admin.notifications.help1', he: 'בודד: שלח למשתמש ספציפי' },
  { key: 'admin.notifications.help2', he: 'קורס: שלח לכל הסטודנטים הרשומים לקורס' },
  { key: 'admin.notifications.help3', he: 'תוכנית: שלח לכל הסטודנטים הרשומים לתוכנית' },
  { key: 'admin.notifications.help4', he: 'ארגון: שלח לכל המשתמשים בארגון שלך' },
  { key: 'admin.notifications.help5', he: 'התראות בעדיפות דחוף/גבוה מציגות התראת טוסט' },
  { key: 'admin.notifications.help6', he: 'משתמשים יכולים להגדיר את העדפות ההתראות שלהם' },

  // Common
  { key: 'common.optional', he: '(אופציונלי)' },
];

async function addTranslations() {
  try {
    console.log('Adding admin notifications translations...');

    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id');

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.id}`);

      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const translation of translations) {
        // Check if translation exists
        const { data: existing, error: checkError } = await supabase
          .from('translations')
          .select('id, translation_value')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'he')
          .eq('context', 'admin')
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking translation ${translation.key}:`, checkError);
          continue;
        }

        if (existing) {
          // Update if Hebrew is different or missing
          if (!existing.translation_value || existing.translation_value !== translation.he) {
            const { error: updateError } = await supabase
              .from('translations')
              .update({ translation_value: translation.he })
              .eq('id', existing.id);

            if (updateError) {
              console.error(`Error updating translation ${translation.key}:`, updateError);
            } else {
              updatedCount++;
            }
          } else {
            skippedCount++;
          }
        } else {
          // Insert new translation
          const { error: insertError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              language_code: 'he',
              translation_key: translation.key,
              translation_value: translation.he,
              context: 'admin',
            });

          if (insertError) {
            console.error(`Error inserting translation ${translation.key}:`, insertError);
          } else {
            addedCount++;
          }
        }
      }

      console.log(`✅ Tenant ${tenant.id}: Added ${addedCount}, Updated ${updatedCount}, Skipped ${skippedCount}`);
    }

    console.log('\n✅ All translations added successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addTranslations();

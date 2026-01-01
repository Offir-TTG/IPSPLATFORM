/**
 * Add complete Hebrew translations for admin notifications page
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Page titles
  { key: 'admin.notifications.pageTitle', en: 'Notifications', he: 'התראות' },
  { key: 'admin.notifications.pageDescription', en: 'Manage and send notifications to users', he: 'נהל ושלח התראות למשתמשים' },

  // Stats cards
  { key: 'admin.notifications.totalSent', en: 'Total Sent', he: 'סה"כ נשלחו' },
  { key: 'admin.notifications.todaySent', en: 'Sent Today', he: 'נשלחו היום' },
  { key: 'admin.notifications.unreadTotal', en: 'Total Unread', he: 'סה"כ לא נקראו' },
  { key: 'admin.notifications.last24Hours', en: 'Last 24 hours', he: '24 שעות אחרונות' },
  { key: 'admin.notifications.acrossAllUsers', en: 'Across all users', he: 'בקרב כל המשתמשים' },

  // Create notification form
  { key: 'admin.notifications.createTitle', en: 'Create Notification', he: 'יצירת התראה' },
  { key: 'admin.notifications.createDescription', en: 'Send a notification to your users', he: 'שלח התראה למשתמשים שלך' },

  // Scope
  { key: 'admin.notifications.scope', en: 'Scope', he: 'טווח' },
  { key: 'admin.notifications.individual', en: 'Individual User', he: 'משתמש בודד' },
  { key: 'admin.notifications.course', en: 'Course Students', he: 'תלמידי קורס' },
  { key: 'admin.notifications.program', en: 'Program Students', he: 'תלמידי תוכנית' },
  { key: 'admin.notifications.tenant', en: 'All Users', he: 'כל המשתמשים' },

  // Scope badges
  { key: 'admin.notifications.scope.individual', en: 'Individual', he: 'אישי' },
  { key: 'admin.notifications.scope.course', en: 'Course', he: 'קורס' },
  { key: 'admin.notifications.scope.program', en: 'Program', he: 'תוכנית' },
  { key: 'admin.notifications.scope.tenant', en: 'Tenant', he: 'ארגון' },

  // Target selection
  { key: 'admin.notifications.selectUser', en: 'Select User', he: 'בחר משתמש' },
  { key: 'admin.notifications.selectCourse', en: 'Select Course', he: 'בחר קורס' },
  { key: 'admin.notifications.selectProgram', en: 'Select Program', he: 'בחר תוכנית' },
  { key: 'admin.notifications.searchUsers', en: 'Search users...', he: 'חפש משתמשים...' },
  { key: 'admin.notifications.searchCourses', en: 'Search courses...', he: 'חפש קורסים...' },
  { key: 'admin.notifications.searchPrograms', en: 'Search programs...', he: 'חפש תוכניות...' },

  // Category & Priority
  { key: 'admin.notifications.categoryLabel', en: 'Category', he: 'קטגוריה' },
  { key: 'admin.notifications.priorityLabel', en: 'Priority', he: 'עדיפות' },

  // Priority levels
  { key: 'admin.notifications.priority.low', en: 'Low', he: 'נמוכה' },
  { key: 'admin.notifications.priority.medium', en: 'Medium', he: 'בינונית' },
  { key: 'admin.notifications.priority.high', en: 'High', he: 'גבוהה' },
  { key: 'admin.notifications.priority.urgent', en: 'Urgent', he: 'דחוף' },

  // Content
  { key: 'admin.notifications.titleLabel', en: 'Title', he: 'כותרת' },
  { key: 'admin.notifications.titlePlaceholder', en: 'Notification title...', he: 'כותרת ההתראה...' },
  { key: 'admin.notifications.messageLabel', en: 'Message', he: 'הודעה' },
  { key: 'admin.notifications.messagePlaceholder', en: 'Notification message...', he: 'תוכן ההתראה...' },

  // Action
  { key: 'admin.notifications.actionUrl', en: 'Action URL', he: 'כתובת פעולה' },
  { key: 'admin.notifications.actionLabel', en: 'Action Label', he: 'תווית פעולה' },
  { key: 'admin.notifications.actionLabelPlaceholder', en: 'View Details', he: 'הצג פרטים' },

  // Expiration
  { key: 'admin.notifications.expiresAt', en: 'Expires At', he: 'תפוגה' },
  { key: 'admin.notifications.expiresAtHelp', en: 'Notification will be automatically removed after this time', he: 'ההתראה תוסר אוטומטית לאחר זמן זה' },

  // Delivery channels
  { key: 'admin.notifications.deliveryChannels', en: 'Delivery Channels', he: 'ערוצי משלוח' },
  { key: 'admin.notifications.inAppAlways', en: 'In-App (Always Enabled)', he: 'באפליקציה (תמיד מופעל)' },
  { key: 'admin.notifications.emailChannel', en: 'Email', he: 'אימייל' },
  { key: 'admin.notifications.smsChannel', en: 'SMS (Urgent Only)', he: 'SMS (דחוף בלבד)' },
  { key: 'admin.notifications.pushChannel', en: 'Browser Push', he: 'התראות דפדפן' },
  { key: 'admin.notifications.emailLanguage', en: 'Email Language', he: 'שפת האימייל' },

  // Preview
  { key: 'admin.notifications.preview', en: 'Preview', he: 'תצוגה מקדימה' },

  // Actions
  { key: 'admin.notifications.send', en: 'Send Notification', he: 'שלח התראה' },
  { key: 'admin.notifications.sending', en: 'Sending...', he: 'שולח...' },

  // Success messages
  { key: 'admin.notifications.success', en: 'Notification sent successfully', he: 'ההתראה נשלחה בהצלחה' },
  { key: 'admin.notifications.successIndividual', en: 'Notification sent to user', he: 'ההתראה נשלחה למשתמש' },
  { key: 'admin.notifications.successCourse', en: 'Notification sent to course students', he: 'ההתראה נשלחה לתלמידי הקורס' },
  { key: 'admin.notifications.successProgram', en: 'Notification sent to program students', he: 'ההתראה נשלחה לתלמידי התוכנית' },
  { key: 'admin.notifications.successTenant', en: 'Notification sent to all users', he: 'ההתראה נשלחה לכל המשתמשים' },

  // Error messages
  { key: 'admin.notifications.errorSending', en: 'Failed to send notification', he: 'נכשל בשליחת ההתראה' },
  { key: 'admin.notifications.errorMissingFields', en: 'Please fill in all required fields', he: 'נא למלא את כל השדות הנדרשים' },

  // Sent history
  { key: 'admin.notifications.sentHistory', en: 'Sent Notifications', he: 'התראות שנשלחו' },
  { key: 'admin.notifications.sentHistoryDesc', en: 'Recent notifications sent by admins', he: 'התראות אחרונות שנשלחו על ידי מנהלים' },
  { key: 'admin.notifications.noHistory', en: 'No notifications sent yet', he: 'עדיין לא נשלחו התראות' },

  // Help section
  { key: 'admin.notifications.helpTitle', en: 'How notifications work', he: 'איך ההתראות עובדות' },
  { key: 'admin.notifications.help1', en: 'Individual: Send to a specific user', he: 'אישי: שלח למשתמש ספציפי' },
  { key: 'admin.notifications.help2', en: 'Course: Send to all students enrolled in a course', he: 'קורס: שלח לכל התלמידים הרשומים לקורס' },
  { key: 'admin.notifications.help3', en: 'Program: Send to all students enrolled in a program', he: 'תוכנית: שלח לכל התלמידים הרשומים לתוכנית' },
  { key: 'admin.notifications.help4', en: 'Tenant: Send to all users in your organization', he: 'ארגון: שלח לכל המשתמשים בארגון שלך' },
  { key: 'admin.notifications.help5', en: 'Urgent/High priority notifications show toast alerts', he: 'התראות דחופות/בעדיפות גבוהה מציגות התראות צפות' },
  { key: 'admin.notifications.help6', en: 'Email channel requires users to have email addresses', he: 'ערוץ אימייל דורש שלמשתמשים יהיו כתובות אימייל' },

  // Common
  { key: 'common.optional', en: '(Optional)', he: '(אופציונלי)' },
  { key: 'common.all', en: 'All', he: 'הכל' },
  { key: 'common.refresh', en: 'Refresh', he: 'רענן' },
];

async function addTranslations() {
  console.log('\n🌍 Adding full admin notifications translations...\n');

  try {
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name');

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`📋 Found ${tenants?.length || 0} tenants\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const tenant of tenants || []) {
      console.log(`🏢 Processing tenant: ${tenant.name}`);

      for (const translation of translations) {
        // Check if English translation already exists
        const { data: existingEn } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'en')
          .single();

        if (!existingEn) {
          await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              translation_key: translation.key,
              translation_value: translation.en,
              language_code: 'en',
              context: 'admin',
            });
          addedCount++;
        } else {
          skippedCount++;
        }

        // Check if Hebrew translation already exists
        const { data: existingHe } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'he')
          .single();

        if (!existingHe) {
          await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              translation_key: translation.key,
              translation_value: translation.he,
              language_code: 'he',
              context: 'admin',
            });
          addedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log('');
    }

    console.log('✅ Full admin notifications translations complete!\n');
    console.log(`   Added: ${addedCount} translations`);
    console.log(`   Skipped (already exist): ${skippedCount} translations\n`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTranslations();

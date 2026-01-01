/**
 * Add comprehensive translations for notification preferences
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
  // Notification Preferences - Master Channels
  { key: 'user.notifications.preferences.masterChannels', en: 'Delivery Channels', he: 'ערוצי תקשורת' },
  { key: 'user.notifications.preferences.masterChannelsDesc', en: 'Control which channels you want to receive notifications through', he: 'בחר דרך אילו ערוצים תרצה לקבל התראות' },

  // In-App
  { key: 'user.notifications.preferences.inApp', en: 'In-App Notifications', he: 'התראות באפליקציה' },
  { key: 'user.notifications.preferences.inAppDesc', en: 'Notifications within the platform', he: 'התראות בתוך הפלטפורמה' },
  { key: 'user.notifications.preferences.inAppShort', en: 'In-App', he: 'באפליקציה' },

  // Email
  { key: 'user.notifications.preferences.email', en: 'Email Notifications', he: 'התראות במייל' },
  { key: 'user.notifications.preferences.emailDesc', en: 'Receive notifications via email', he: 'קבל התראות באמצעות מייל' },
  { key: 'user.notifications.preferences.emailShort', en: 'Email', he: 'מייל' },

  // SMS
  { key: 'user.notifications.preferences.sms', en: 'SMS/WhatsApp Notifications', he: 'התראות SMS/וואטסאפ' },
  { key: 'user.notifications.preferences.smsDesc', en: 'Receive urgent notifications via SMS', he: 'קבל התראות דחופות ב-SMS' },
  { key: 'user.notifications.preferences.smsShort', en: 'SMS', he: 'SMS' },
  { key: 'user.notifications.preferences.phoneNumber', en: 'Phone Number for SMS', he: 'מספר טלפון ל-SMS' },
  { key: 'user.notifications.preferences.phoneRequired', en: 'Phone number is required for SMS notifications', he: 'מספר טלפון נדרש להתראות SMS' },
  { key: 'user.notifications.preferences.phoneInvalid', en: 'Please enter a valid phone number with country code', he: 'אנא הזן מספר טלפון תקין עם קוד מדינה' },
  { key: 'user.notifications.preferences.phoneInvalidSimple', en: 'Please enter a valid phone number', he: 'אנא הזן מספר טלפון תקין' },
  { key: 'user.notifications.preferences.phoneTooLong', en: 'Phone number is too long (max 17 characters)', he: 'מספר הטלפון ארוך מדי (מקסימום 17 תווים)' },

  // Category Settings
  { key: 'user.notifications.preferences.categorySettings', en: 'Notification Categories', he: 'קטגוריות התראות' },
  { key: 'user.notifications.preferences.categorySettingsDesc', en: 'Choose which channels to use for each type of notification', he: 'בחר אילו ערוצים להשתמש עבור כל סוג של התראה' },
  { key: 'user.notifications.preferences.category', en: 'Category', he: 'קטגוריה' },

  // Categories
  { key: 'user.notifications.categories.lesson', en: 'Lessons', he: 'שיעורים' },
  { key: 'user.notifications.categories.lesson_desc', en: 'Class schedules, reminders, recordings', he: 'לוח זמנים, תזכורות, הקלטות' },

  { key: 'user.notifications.categories.assignment', en: 'Assignments', he: 'מטלות' },
  { key: 'user.notifications.categories.assignment_desc', en: 'Assignment deadlines and reminders', he: 'מועדי הגשה ותזכורות' },

  { key: 'user.notifications.categories.payment', en: 'Payments', he: 'תשלומים' },
  { key: 'user.notifications.categories.payment_desc', en: 'Payment due dates, receipts, invoices', he: 'מועדי תשלום, קבלות, חשבוניות' },

  { key: 'user.notifications.categories.enrollment', en: 'Enrollments', he: 'הרשמות' },
  { key: 'user.notifications.categories.enrollment_desc', en: 'Course enrollment confirmations', he: 'אישורי הרשמה לקורסים' },

  { key: 'user.notifications.categories.attendance', en: 'Attendance', he: 'נוכחות' },
  { key: 'user.notifications.categories.attendance_desc', en: 'Attendance records and alerts', he: 'רישומי נוכחות והתראות' },

  { key: 'user.notifications.categories.achievement', en: 'Achievements', he: 'הישגים' },
  { key: 'user.notifications.categories.achievement_desc', en: 'Certificates, badges, milestones', he: 'תעודות, תגים, אבני דרך' },

  { key: 'user.notifications.categories.announcement', en: 'Announcements', he: 'הודעות' },
  { key: 'user.notifications.categories.announcement_desc', en: 'Important announcements and updates', he: 'הודעות ועדכונים חשובים' },

  { key: 'user.notifications.categories.system', en: 'System', he: 'מערכת' },
  { key: 'user.notifications.categories.system_desc', en: 'System notifications and alerts', he: 'התראות והודעות מערכת' },

  // Quiet Hours
  { key: 'user.notifications.preferences.quietHours', en: 'Quiet Hours', he: 'שעות שקט' },
  { key: 'user.notifications.preferences.quietHoursDesc', en: 'No external notifications (email, SMS) during these hours', he: 'ללא התראות חיצוניות (מייל, SMS) בשעות אלו' },
  { key: 'user.notifications.preferences.quietStart', en: 'Start Time', he: 'שעת התחלה' },
  { key: 'user.notifications.preferences.quietEnd', en: 'End Time', he: 'שעת סיום' },
  { key: 'user.notifications.preferences.timezone', en: 'Timezone', he: 'אזור זמן' },

  // Save
  { key: 'user.notifications.preferences.save', en: 'Save Preferences', he: 'שמור העדפות' },
  { key: 'user.notifications.preferences.saving', en: 'Saving...', he: 'שומר...' },
  { key: 'user.notifications.preferences.saveSuccess', en: 'Preferences saved successfully', he: 'ההעדפות נשמרו בהצלחה' },
  { key: 'user.notifications.preferences.saveError', en: 'Failed to save preferences', he: 'שמירת ההעדפות נכשלה' },

  // Load
  { key: 'user.notifications.preferences.fetchError', en: 'Failed to load preferences', he: 'טעינת ההעדפות נכשלה' },
  { key: 'user.notifications.preferences.loadError', en: 'Failed to load preferences', he: 'טעינת ההעדפות נכשלה' },
];

async function addTranslations() {
  console.log('\n🌍 Adding notification preferences translations...\n');

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
              context: 'user',
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
              context: 'user',
            });
          addedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log('');
    }

    console.log('✅ Notification preferences translations added!\n');
    console.log(`   Added: ${addedCount} translations`);
    console.log(`   Skipped (already exist): ${skippedCount} translations\n`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTranslations();

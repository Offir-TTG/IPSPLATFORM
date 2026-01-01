/**
 * Add translations for compact notification form
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
  // Recipients tab/section
  { key: 'admin.notifications.recipients', en: 'Recipients', he: 'נמענים' },
  { key: 'admin.notifications.selectStudents', en: 'Select students...', he: 'בחר תלמידים...' },
  { key: 'admin.notifications.studentsSelected', en: 'students selected', he: 'תלמידים נבחרו' },
  { key: 'admin.notifications.coursesSelected', en: 'courses selected', he: 'קורסים נבחרו' },
  { key: 'admin.notifications.programsSelected', en: 'programs selected', he: 'תוכניות נבחרו' },

  // Compact form labels
  { key: 'admin.notifications.content', en: 'Content', he: 'תוכן' },
  { key: 'admin.notifications.advancedOptions', en: 'Advanced Options', he: 'אפשרויות מתקדמות' },
  { key: 'admin.notifications.sendingTo', en: 'Sending to:', he: 'שולח אל:' },
  { key: 'admin.notifications.recipients_count', en: 'recipient(s)', he: 'נמען/ים' },

  // Channel labels (inline)
  { key: 'admin.notifications.channels', en: 'Channels:', he: 'ערוצים:' },
  { key: 'admin.notifications.inApp', en: 'In-App', he: 'באפליקציה' },
  { key: 'admin.notifications.email', en: 'Email', he: 'אימייל' },
  { key: 'admin.notifications.sms', en: 'SMS', he: 'SMS' },
  { key: 'admin.notifications.push', en: 'Push', he: 'התראות דפדפן' },

  // Search placeholders
  { key: 'admin.notifications.searchStudents', en: 'Search students...', he: 'חפש תלמידים...' },
  { key: 'admin.notifications.noResultsFound', en: 'No results found', he: 'לא נמצאו תוצאות' },

  // Multi-select labels
  { key: 'admin.notifications.selected', en: 'selected', he: 'נבחרו' },
  { key: 'admin.notifications.selectAll', en: 'Select All', he: 'בחר הכל' },

  // Validation errors
  { key: 'admin.notifications.errors.noRecipients', en: 'Please select at least one recipient', he: 'נא לבחור לפחות נמען אחד' },
  { key: 'admin.notifications.errors.titleRequired', en: 'Title is required', he: 'כותרת היא שדה חובה' },
  { key: 'admin.notifications.errors.messageRequired', en: 'Message is required', he: 'הודעה היא שדה חובה' },

  // Success messages
  { key: 'admin.notifications.sendSuccess', en: 'Notification sent successfully', he: 'ההתראה נשלחה בהצלחה' },
  { key: 'admin.notifications.sendError', en: 'Failed to send notification', he: 'נכשל בשליחת ההתראה' },

  // Categories (if missing)
  { key: 'admin.notifications.categories.lesson', en: 'Lesson', he: 'שיעור' },
  { key: 'admin.notifications.categories.assignment', en: 'Assignment', he: 'מטלה' },
  { key: 'admin.notifications.categories.payment', en: 'Payment', he: 'תשלום' },
  { key: 'admin.notifications.categories.enrollment', en: 'Enrollment', he: 'רישום' },
  { key: 'admin.notifications.categories.attendance', en: 'Attendance', he: 'נוכחות' },
  { key: 'admin.notifications.categories.achievement', en: 'Achievement', he: 'הישג' },
  { key: 'admin.notifications.categories.announcement', en: 'Announcement', he: 'הודעה' },
  { key: 'admin.notifications.categories.system', en: 'System', he: 'מערכת' },

  // Priorities (if missing)
  { key: 'admin.notifications.priorities.low', en: 'Low', he: 'נמוכה' },
  { key: 'admin.notifications.priorities.medium', en: 'Medium', he: 'בינונית' },
  { key: 'admin.notifications.priorities.high', en: 'High', he: 'גבוהה' },
  { key: 'admin.notifications.priorities.urgent', en: 'Urgent', he: 'דחוף' },
];

async function addTranslations() {
  console.log('\n🌍 Adding compact notification form translations...\n');

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

    console.log('✅ Compact form translations complete!\n');
    console.log(`   Added: ${addedCount} translations`);
    console.log(`   Skipped (already exist): ${skippedCount} translations\n`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTranslations();

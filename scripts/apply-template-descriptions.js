const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running template description translations migration...');

  // Delete existing template description translations
  const { error: deleteError } = await supabase
    .from('translations')
    .delete()
    .is('tenant_id', null)
    .like('translation_key', 'email_template.%description');

  if (deleteError) {
    console.error('Error deleting old translations:', deleteError);
  }

  // Insert new translations
  const translations = [
    // Enrollment Confirmation
    { tenant_id: null, translation_key: 'email_template.enrollment_confirmation.description', language_code: 'en', translation_value: 'Sent when a user successfully enrolls in a course or program', context: 'admin' },
    { tenant_id: null, translation_key: 'email_template.enrollment_confirmation.description', language_code: 'he', translation_value: 'נשלח כאשר משתמש נרשם בהצלחה לקורס או תוכנית', context: 'admin' },

    // Enrollment Invitation
    { tenant_id: null, translation_key: 'email_template.enrollment_invitation.description', language_code: 'en', translation_value: 'Sent when admin invites a user to enroll via enrollment link', context: 'admin' },
    { tenant_id: null, translation_key: 'email_template.enrollment_invitation.description', language_code: 'he', translation_value: 'נשלח כאשר מנהל מזמין משתמש להירשם דרך קישור הרשמה', context: 'admin' },

    // Payment Receipt
    { tenant_id: null, translation_key: 'email_template.payment_receipt.description', language_code: 'en', translation_value: 'Sent when a payment is successfully processed', context: 'admin' },
    { tenant_id: null, translation_key: 'email_template.payment_receipt.description', language_code: 'he', translation_value: 'נשלח כאשר תשלום מעובד בהצלחה', context: 'admin' },

    // Lesson Reminder
    { tenant_id: null, translation_key: 'email_template.lesson_reminder.description', language_code: 'en', translation_value: 'Sent before a scheduled lesson starts', context: 'admin' },
    { tenant_id: null, translation_key: 'email_template.lesson_reminder.description', language_code: 'he', translation_value: 'נשלח לפני שיעור מתוכנן מתחיל', context: 'admin' },

    // Parent Progress Report
    { tenant_id: null, translation_key: 'email_template.parent_progress_report.description', language_code: 'en', translation_value: 'Sent to parents with student progress updates', context: 'admin' },
    { tenant_id: null, translation_key: 'email_template.parent_progress_report.description', language_code: 'he', translation_value: 'נשלח להורים עם עדכוני התקדמות תלמיד', context: 'admin' },

    // Enrollment Reminder
    { tenant_id: null, translation_key: 'email_template.enrollment_reminder.description', language_code: 'en', translation_value: 'Sent to remind users about pending enrollment or incomplete registration', context: 'admin' },
    { tenant_id: null, translation_key: 'email_template.enrollment_reminder.description', language_code: 'he', translation_value: 'נשלח כדי להזכיר למשתמשים על הרשמה ממתינה או רישום לא שלם', context: 'admin' }
  ];

  const { data, error } = await supabase
    .from('translations')
    .insert(translations);

  if (error) {
    console.error('Error inserting translations:', error);
    process.exit(1);
  }

  console.log('✅ Template description translations applied successfully!');
  console.log(`   Inserted ${translations.length} translations`);
  process.exit(0);
}

runMigration();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
  category: string;
}

const translations: Translation[] = [
  // Page titles and descriptions
  { key: 'triggers.title', en: 'Email Triggers', he: 'טריגרים לדוא"ל', category: 'emails' },
  { key: 'triggers.description', en: 'Automatically send emails when events occur', he: 'שלח דוא"ל אוטומטית כאשר אירועים מתרחשים', category: 'emails' },
  { key: 'triggers.create', en: 'Create Trigger', he: 'צור טריגר', category: 'emails' },
  { key: 'triggers.create_first', en: 'Create Your First Trigger', he: 'צור את הטריגר הראשון שלך', category: 'emails' },
  { key: 'triggers.empty', en: 'No triggers configured yet', he: 'אין טריגרים מוגדרים עדיין', category: 'emails' },

  // Stats
  { key: 'triggers.stats.total', en: 'Total Triggers', he: 'סה"כ טריגרים', category: 'emails' },
  { key: 'triggers.stats.active', en: 'Active Triggers', he: 'טריגרים פעילים', category: 'emails' },
  { key: 'triggers.stats.inactive', en: 'Inactive Triggers', he: 'טריגרים לא פעילים', category: 'emails' },

  // Status
  { key: 'triggers.status.active', en: 'Active', he: 'פעיל', category: 'emails' },
  { key: 'triggers.status.inactive', en: 'Inactive', he: 'לא פעיל', category: 'emails' },

  // Priority
  { key: 'triggers.priority.urgent', en: 'Urgent', he: 'דחוף', category: 'emails' },
  { key: 'triggers.priority.high', en: 'High', he: 'גבוה', category: 'emails' },
  { key: 'triggers.priority.normal', en: 'Normal', he: 'רגיל', category: 'emails' },
  { key: 'triggers.priority.low', en: 'Low', he: 'נמוך', category: 'emails' },

  // Actions
  { key: 'triggers.edit', en: 'Edit', he: 'ערוך', category: 'emails' },
  { key: 'triggers.delete', en: 'Delete', he: 'מחק', category: 'emails' },
  { key: 'triggers.test', en: 'Test Trigger', he: 'בדוק טריגר', category: 'emails' },
  { key: 'triggers.activate', en: 'Activate', he: 'הפעל', category: 'emails' },
  { key: 'triggers.deactivate', en: 'Deactivate', he: 'השבת', category: 'emails' },
  { key: 'triggers.activated', en: 'Trigger activated', he: 'הטריגר הופעל', category: 'emails' },
  { key: 'triggers.deactivated', en: 'Trigger deactivated', he: 'הטריגר הושבת', category: 'emails' },
  { key: 'triggers.deleted', en: 'Trigger deleted successfully', he: 'הטריגר נמחק בהצלחה', category: 'emails' },
  { key: 'triggers.created', en: 'Trigger created successfully', he: 'הטריגר נוצר בהצלחה', category: 'emails' },
  { key: 'triggers.updated', en: 'Trigger updated successfully', he: 'הטריגר עודכן בהצלחה', category: 'emails' },

  // Confirmations
  { key: 'triggers.delete_confirm', en: 'Are you sure you want to delete this trigger?', he: 'האם אתה בטוח שברצונך למחוק טריגר זה?', category: 'emails' },

  // Errors
  { key: 'triggers.load_error', en: 'Failed to load triggers', he: 'שגיאה בטעינת הטריגרים', category: 'emails' },
  { key: 'triggers.toggle_error', en: 'Failed to toggle trigger', he: 'שגיאה בשינוי סטטוס הטריגר', category: 'emails' },
  { key: 'triggers.delete_error', en: 'Failed to delete trigger', he: 'שגיאה במחיקת הטריגר', category: 'emails' },
  { key: 'triggers.save_error', en: 'Failed to save trigger', he: 'שגיאה בשמירת הטריגר', category: 'emails' },
  { key: 'triggers.test_error', en: 'Failed to test trigger', he: 'שגיאה בבדיקת הטריגר', category: 'emails' },

  // Test results
  { key: 'triggers.test_success', en: 'Trigger test successful! Email would be sent to: ', he: 'בדיקת הטריגר הצליחה! דוא"ל יישלח אל: ', category: 'emails' },
  { key: 'triggers.test_no_send', en: 'Test completed but email would not be sent. Check conditions.', he: 'הבדיקה הושלמה אך הדוא"ל לא יישלח. בדוק את התנאים.', category: 'emails' },

  // Event types
  { key: 'triggers.event.enrollment_created', en: 'Enrollment Created', he: 'הרשמה נוצרה', category: 'emails' },
  { key: 'triggers.event.enrollment_created_desc', en: 'When a new enrollment is created', he: 'כאשר הרשמה חדשה נוצרת', category: 'emails' },
  { key: 'triggers.event.enrollment_completed', en: 'Enrollment Completed', he: 'הרשמה הושלמה', category: 'emails' },
  { key: 'triggers.event.enrollment_completed_desc', en: 'When user completes enrollment wizard', he: 'כאשר משתמש משלים את אשף ההרשמה', category: 'emails' },
  { key: 'triggers.event.payment_completed', en: 'Payment Completed', he: 'תשלום הושלם', category: 'emails' },
  { key: 'triggers.event.payment_completed_desc', en: 'When payment succeeds', he: 'כאשר תשלום מצליח', category: 'emails' },
  { key: 'triggers.event.payment_failed', en: 'Payment Failed', he: 'תשלום נכשל', category: 'emails' },
  { key: 'triggers.event.payment_failed_desc', en: 'When payment fails', he: 'כאשר תשלום נכשל', category: 'emails' },
  { key: 'triggers.event.recording_ready', en: 'Recording Ready', he: 'הקלטה מוכנה', category: 'emails' },
  { key: 'triggers.event.recording_ready_desc', en: 'When Zoom recording is processed', he: 'כאשר הקלטת Zoom מעובדת', category: 'emails' },
  { key: 'triggers.event.lesson_reminder', en: 'Lesson Reminder', he: 'תזכורת לשיעור', category: 'emails' },
  { key: 'triggers.event.lesson_reminder_desc', en: 'Send reminders before lessons', he: 'שלח תזכורות לפני שיעורים', category: 'emails' },

  // Timing
  { key: 'triggers.timing.immediate', en: 'Immediately', he: 'מיידי', category: 'emails' },
  { key: 'triggers.timing.at_time', en: 'At ', he: 'ב-', category: 'emails' },
  { key: 'triggers.timing.days_before', en: ' days before', he: ' ימים לפני', category: 'emails' },
  { key: 'triggers.timing.delayed_hours', en: ' after event', he: ' אחרי האירוע', category: 'emails' },
  { key: 'triggers.timing.delayed_minutes', en: ' after event', he: ' אחרי האירוע', category: 'emails' },

  // Dialog
  { key: 'triggers.create_title', en: 'Create New Trigger', he: 'צור טריגר חדש', category: 'emails' },
  { key: 'triggers.edit_title', en: 'Edit Trigger', he: 'ערוך טריגר', category: 'emails' },
  { key: 'triggers.dialog_description', en: 'Configure automated email sending based on platform events', he: 'הגדר שליחת דוא"ל אוטומטית על בסיס אירועי המערכת', category: 'emails' },

  // Tabs
  { key: 'triggers.tab.basic', en: 'Basic', he: 'בסיסי', category: 'emails' },
  { key: 'triggers.tab.timing', en: 'Timing', he: 'תזמון', category: 'emails' },
  { key: 'triggers.tab.advanced', en: 'Advanced', he: 'מתקדם', category: 'emails' },

  // Fields
  { key: 'triggers.field.name', en: 'Trigger Name', he: 'שם הטריגר', category: 'emails' },
  { key: 'triggers.field.name_placeholder', en: 'e.g., Send Welcome Email', he: 'לדוגמה, שלח דוא"ל ברוכים הבאים', category: 'emails' },
  { key: 'triggers.field.event', en: 'Event Type', he: 'סוג אירוע', category: 'emails' },
  { key: 'triggers.field.event_placeholder', en: 'Select event type', he: 'בחר סוג אירוע', category: 'emails' },
  { key: 'triggers.field.template', en: 'Email Template', he: 'תבנית דוא"ל', category: 'emails' },
  { key: 'triggers.field.template_placeholder', en: 'Select template', he: 'בחר תבנית', category: 'emails' },
  { key: 'triggers.field.priority', en: 'Priority', he: 'עדיפות', category: 'emails' },
  { key: 'triggers.field.timing', en: 'When to send', he: 'מתי לשלוח', category: 'emails' },
  { key: 'triggers.field.delay_minutes', en: 'Delay (minutes)', he: 'עיכוב (דקות)', category: 'emails' },
  { key: 'triggers.field.delay_hint', en: 'Tip: 60 = 1 hour, 1440 = 1 day', he: 'טיפ: 60 = שעה, 1440 = יום', category: 'emails' },
  { key: 'triggers.field.send_time', en: 'Send at time', he: 'שלח בשעה', category: 'emails' },
  { key: 'triggers.field.send_time_hint', en: 'If time passed today, will send tomorrow', he: 'אם השעה עברה היום, ישלח מחר', category: 'emails' },
  { key: 'triggers.field.days_before', en: 'Days before event', he: 'ימים לפני האירוע', category: 'emails' },
  { key: 'triggers.field.days_before_hint', en: 'For lesson reminders and upcoming events', he: 'עבור תזכורות לשיעורים ואירועים קרובים', category: 'emails' },

  // Timing options
  { key: 'triggers.timing.immediate', en: 'Immediately after event', he: 'מיד לאחר האירוע', category: 'emails' },
  { key: 'triggers.timing.delayed', en: 'Delayed (minutes/hours after)', he: 'עם עיכוב (דקות/שעות אחרי)', category: 'emails' },
  { key: 'triggers.timing.scheduled', en: 'At specific time of day', he: 'בשעה מסוימת ביום', category: 'emails' },
  { key: 'triggers.timing.days_before', en: 'Days before event (reminders)', he: 'ימים לפני האירוע (תזכורות)', category: 'emails' },

  // Recipient
  { key: 'triggers.field.recipient', en: 'Recipient Strategy', he: 'אסטרטגיית נמען', category: 'emails' },
  { key: 'triggers.recipient.auto', en: 'Auto-detect from event data', he: 'זיהוי אוטומטי מנתוני האירוע', category: 'emails' },
  { key: 'triggers.recipient.field', en: 'Extract from specific field', he: 'חלץ משדה ספציפי', category: 'emails' },
  { key: 'triggers.recipient.role', en: 'Lookup by user role', he: 'חיפוש לפי תפקיד משתמש', category: 'emails' },
  { key: 'triggers.field.recipient_field', en: 'Field Path', he: 'נתיב שדה', category: 'emails' },
  { key: 'triggers.field.recipient_field_hint', en: 'e.g., "email", "user.email", "userEmail"', he: 'לדוגמה, "email", "user.email", "userEmail"', category: 'emails' },
  { key: 'triggers.field.recipient_role', en: 'User Role', he: 'תפקיד משתמש', category: 'emails' },
  { key: 'triggers.field.recipient_role_placeholder', en: 'Select role', he: 'בחר תפקיד', category: 'emails' },

  // Roles
  { key: 'triggers.role.student', en: 'Student', he: 'תלמיד', category: 'emails' },
  { key: 'triggers.role.instructor', en: 'Instructor', he: 'מדריך', category: 'emails' },
  { key: 'triggers.role.admin', en: 'Admin', he: 'מנהל', category: 'emails' },

  // Conditions
  { key: 'triggers.field.conditions', en: 'Conditions', he: 'תנאים', category: 'emails' },
  { key: 'triggers.field.conditions_desc', en: 'Only send if conditions match', he: 'שלח רק אם התנאים מתקיימים', category: 'emails' },
  { key: 'triggers.field.conditions_json', en: 'Conditions (JSON)', he: 'תנאים (JSON)', category: 'emails' },
  { key: 'triggers.field.conditions_examples', en: 'Examples', he: 'דוגמאות', category: 'emails' },

  // Other fields
  { key: 'triggers.template', en: 'Email Template', he: 'תבנית דוא"ל', category: 'emails' },
  { key: 'triggers.template_unknown', en: 'Unknown', he: 'לא ידוע', category: 'emails' },
  { key: 'triggers.recipient_field', en: 'Recipient Field', he: 'שדה נמען', category: 'emails' },
  { key: 'triggers.conditions', en: 'Conditions', he: 'תנאים', category: 'emails' },

  // Validation
  { key: 'triggers.validation.name_required', en: 'Trigger name is required', he: 'שם הטריגר הוא שדה חובה', category: 'emails' },
  { key: 'triggers.validation.event_required', en: 'Event type is required', he: 'סוג האירוע הוא שדה חובה', category: 'emails' },
  { key: 'triggers.validation.template_required', en: 'Email template is required', he: 'תבנית דוא"ל היא שדה חובה', category: 'emails' },
  { key: 'triggers.validation.invalid_json', en: 'Invalid conditions JSON', he: 'JSON תנאים לא תקין', category: 'emails' },

  // Common
  { key: 'triggers.update', en: 'Update Trigger', he: 'עדכן טריגר', category: 'emails' },
];

async function addTranslations() {
  console.log('Adding trigger translations...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const translation of translations) {
    try {
      // Upsert English translation
      const { error: enError } = await supabase
        .from('translations')
        .upsert(
          {
            key: translation.key,
            language: 'en',
            value: translation.en,
            category: translation.category,
          },
          {
            onConflict: 'key,language',
          }
        );

      if (enError) throw enError;

      // Upsert Hebrew translation
      const { error: heError } = await supabase
        .from('translations')
        .upsert(
          {
            key: translation.key,
            language: 'he',
            value: translation.he,
            category: translation.category,
          },
          {
            onConflict: 'key,language',
          }
        );

      if (heError) throw heError;

      successCount += 2; // EN + HE
      console.log(`✓ ${translation.key}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ ${translation.key}:`, error);
    }
  }

  console.log(`\n✅ Successfully added ${successCount} translations`);
  if (errorCount > 0) {
    console.log(`❌ Failed to add ${errorCount} translations`);
  }
}

addTranslations()
  .then(() => {
    console.log('\n✨ Translation script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

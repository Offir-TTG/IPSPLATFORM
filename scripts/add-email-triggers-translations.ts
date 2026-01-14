// This script adds Hebrew translations for the email triggers feature
// Note: Uses fetch API, so server must be running (npm run dev)

const API_URL = 'http://localhost:3000/api/admin/translations';

interface Translation {
  key: string;
  en: string;
  he: string;
  category: string;
}

const emailTriggerTranslations: Translation[] = [
  // Page title and description
  { key: 'emails.triggers.title', en: 'Email Triggers', he: 'טריגרים לדוא"ל', category: 'emails' },
  { key: 'emails.triggers.description', en: 'Automatically send emails when events occur', he: 'שליחת דוא"ל אוטומטית כאשר מתרחשים אירועים', category: 'emails' },
  { key: 'emails.triggers.createTrigger', en: 'Create Trigger', he: 'יצירת טריגר', category: 'emails' },
  { key: 'emails.triggers.createFirst', en: 'Create Your First Trigger', he: 'צור את הטריגר הראשון שלך', category: 'emails' },

  // Stats
  { key: 'emails.triggers.stats.total', en: 'Total Triggers', he: 'סך הכל טריגרים', category: 'emails' },
  { key: 'emails.triggers.stats.active', en: 'Active Triggers', he: 'טריגרים פעילים', category: 'emails' },
  { key: 'emails.triggers.stats.inactive', en: 'Inactive Triggers', he: 'טריגרים לא פעילים', category: 'emails' },

  // Empty state
  { key: 'emails.triggers.noTriggers', en: 'No triggers configured yet', he: 'אין עדיין טריגרים מוגדרים', category: 'emails' },

  // Event types
  { key: 'emails.triggers.events.enrollmentCreated', en: 'Enrollment Created', he: 'הרשמה נוצרה', category: 'emails' },
  { key: 'emails.triggers.events.enrollmentCompleted', en: 'Enrollment Completed', he: 'הרשמה הושלמה', category: 'emails' },
  { key: 'emails.triggers.events.paymentCompleted', en: 'Payment Completed', he: 'תשלום הושלם', category: 'emails' },
  { key: 'emails.triggers.events.paymentFailed', en: 'Payment Failed', he: 'תשלום נכשל', category: 'emails' },
  { key: 'emails.triggers.events.recordingReady', en: 'Recording Ready', he: 'הקלטה מוכנה', category: 'emails' },
  { key: 'emails.triggers.events.lessonReminder', en: 'Lesson Reminder', he: 'תזכורת שיעור', category: 'emails' },

  // Actions and messages
  { key: 'emails.triggers.loadFailed', en: 'Failed to load triggers', he: 'טעינת הטריגרים נכשלה', category: 'emails' },
  { key: 'emails.triggers.activated', en: 'Trigger activated', he: 'הטריגר הופעל', category: 'emails' },
  { key: 'emails.triggers.deactivated', en: 'Trigger deactivated', he: 'הטריגר בוטל', category: 'emails' },
  { key: 'emails.triggers.toggleFailed', en: 'Failed to toggle trigger', he: 'שינוי מצב הטריגר נכשל', category: 'emails' },
  { key: 'emails.triggers.deleteConfirm', en: 'Are you sure you want to delete this trigger?', he: 'האם אתה בטוח שברצונך למחוק טריגר זה?', category: 'emails' },
  { key: 'emails.triggers.deleted', en: 'Trigger deleted successfully', he: 'הטריגר נמחק בהצלחה', category: 'emails' },
  { key: 'emails.triggers.deleteFailed', en: 'Failed to delete trigger', he: 'מחיקת הטריגר נכשלה', category: 'emails' },

  // Test functionality
  { key: 'emails.triggers.testSuccess', en: 'Trigger test successful! Email would be sent to: ', he: 'בדיקת הטריגר הצליחה! דוא"ל יישלח אל: ', category: 'emails' },
  { key: 'emails.triggers.testNoSend', en: 'Test completed but email would not be sent. Check conditions.', he: 'הבדיקה הושלמה אך הדוא"ל לא יישלח. בדוק את התנאים.', category: 'emails' },
  { key: 'emails.triggers.testFailed', en: 'Failed to test trigger', he: 'בדיקת הטריגר נכשלה', category: 'emails' },

  // Fields
  { key: 'emails.triggers.emailTemplate', en: 'Email Template', he: 'תבנית דוא"ל', category: 'emails' },
  { key: 'emails.triggers.recipientField', en: 'Recipient Field', he: 'שדה נמען', category: 'emails' },
  { key: 'emails.triggers.conditions', en: 'Conditions', he: 'תנאים', category: 'emails' },

  // Dialog - Basic Tab
  { key: 'emails.triggers.dialog.title.create', en: 'Create Email Trigger', he: 'יצירת טריגר לדוא"ל', category: 'emails' },
  { key: 'emails.triggers.dialog.title.edit', en: 'Edit Email Trigger', he: 'עריכת טריגר לדוא"ל', category: 'emails' },
  { key: 'emails.triggers.dialog.description', en: 'Configure when and how to send automated emails', he: 'הגדר מתי וכיצד לשלוח דוא"ל אוטומטי', category: 'emails' },

  { key: 'emails.triggers.dialog.tabs.basic', en: 'Basic', he: 'בסיסי', category: 'emails' },
  { key: 'emails.triggers.dialog.tabs.timing', en: 'Timing', he: 'תזמון', category: 'emails' },
  { key: 'emails.triggers.dialog.tabs.advanced', en: 'Advanced', he: 'מתקדם', category: 'emails' },

  { key: 'emails.triggers.dialog.triggerName', en: 'Trigger Name', he: 'שם הטריגר', category: 'emails' },
  { key: 'emails.triggers.dialog.triggerName.placeholder', en: 'e.g., Welcome Email for New Students', he: 'לדוגמה, דוא"ל ברוכים הבאים לתלמידים חדשים', category: 'emails' },
  { key: 'emails.triggers.dialog.event', en: 'Trigger Event', he: 'אירוע מפעיל', category: 'emails' },
  { key: 'emails.triggers.dialog.event.select', en: 'Select event type...', he: 'בחר סוג אירוע...', category: 'emails' },
  { key: 'emails.triggers.dialog.template', en: 'Email Template', he: 'תבנית דוא"ל', category: 'emails' },
  { key: 'emails.triggers.dialog.template.select', en: 'Select template...', he: 'בחר תבנית...', category: 'emails' },
  { key: 'emails.triggers.dialog.priority', en: 'Priority', he: 'עדיפות', category: 'emails' },

  // Priority levels
  { key: 'emails.triggers.dialog.priority.urgent', en: 'Urgent', he: 'דחוף', category: 'emails' },
  { key: 'emails.triggers.dialog.priority.high', en: 'High', he: 'גבוה', category: 'emails' },
  { key: 'emails.triggers.dialog.priority.normal', en: 'Normal', he: 'רגיל', category: 'emails' },
  { key: 'emails.triggers.dialog.priority.low', en: 'Low', he: 'נמוך', category: 'emails' },

  // Timing Tab
  { key: 'emails.triggers.dialog.timing.immediate', en: 'Send Immediately', he: 'שלח מיד', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.immediate.desc', en: 'Email sent as soon as event occurs', he: 'דוא"ל נשלח מיד כאשר מתרחש האירוע', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.delayed', en: 'Delay Sending', he: 'עיכוב שליחה', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.delayed.desc', en: 'Wait specified time before sending', he: 'המתן זמן מוגדר לפני השליחה', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.scheduled', en: 'Scheduled Time', he: 'זמן מתוזמן', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.scheduled.desc', en: 'Send at specific time of day', he: 'שלח בשעה מסוימת ביום', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.daysBefore', en: 'Days Before Event', he: 'ימים לפני האירוע', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.daysBefore.desc', en: 'Send reminder before scheduled event', he: 'שלח תזכורת לפני אירוע מתוכנן', category: 'emails' },

  { key: 'emails.triggers.dialog.timing.delayMinutes', en: 'Delay (minutes)', he: 'עיכוב (דקות)', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.sendTime', en: 'Send Time', he: 'זמן שליחה', category: 'emails' },
  { key: 'emails.triggers.dialog.timing.daysBeforeCount', en: 'Days Before', he: 'ימים לפני', category: 'emails' },

  // Advanced Tab
  { key: 'emails.triggers.dialog.recipient.label', en: 'Recipient Strategy', he: 'אסטרטגיית נמען', category: 'emails' },
  { key: 'emails.triggers.dialog.recipient.auto', en: 'Auto-detect from event', he: 'זיהוי אוטומטי מהאירוע', category: 'emails' },
  { key: 'emails.triggers.dialog.recipient.auto.desc', en: 'Automatically find recipient from event data', he: 'מצא נמען אוטומטית מנתוני האירוע', category: 'emails' },
  { key: 'emails.triggers.dialog.recipient.field', en: 'Extract from field', he: 'חלץ משדה', category: 'emails' },
  { key: 'emails.triggers.dialog.recipient.field.desc', en: 'Specify exact field path', he: 'ציין נתיב שדה מדויק', category: 'emails' },
  { key: 'emails.triggers.dialog.recipient.role', en: 'By user role', he: 'לפי תפקיד משתמש', category: 'emails' },
  { key: 'emails.triggers.dialog.recipient.role.desc', en: 'Send to users with specific role', he: 'שלח למשתמשים עם תפקיד מסוים', category: 'emails' },

  { key: 'emails.triggers.dialog.recipient.fieldPath', en: 'Field Path', he: 'נתיב שדה', category: 'emails' },
  { key: 'emails.triggers.dialog.recipient.fieldPath.placeholder', en: 'e.g., user.email or enrollment.student.email', he: 'לדוגמה, user.email או enrollment.student.email', category: 'emails' },
  { key: 'emails.triggers.dialog.recipient.role.select', en: 'Select role...', he: 'בחר תפקיד...', category: 'emails' },

  // Conditions
  { key: 'emails.triggers.dialog.conditions.enable', en: 'Use Conditions', he: 'השתמש בתנאים', category: 'emails' },
  { key: 'emails.triggers.dialog.conditions.desc', en: 'Only send email if conditions are met', he: 'שלח דוא"ל רק אם התנאים מתקיימים', category: 'emails' },
  { key: 'emails.triggers.dialog.conditions.json', en: 'Conditions (JSON)', he: 'תנאים (JSON)', category: 'emails' },
  { key: 'emails.triggers.dialog.conditions.example', en: 'Example: {"paymentStatus": "paid", "amount": {"$gte": 100}}', he: 'דוגמה: {"paymentStatus": "paid", "amount": {"$gte": 100}}', category: 'emails' },
  { key: 'emails.triggers.dialog.conditions.invalid', en: 'Invalid JSON format', he: 'פורמט JSON לא תקין', category: 'emails' },

  // Buttons
  { key: 'emails.triggers.dialog.cancel', en: 'Cancel', he: 'ביטול', category: 'emails' },
  { key: 'emails.triggers.dialog.create', en: 'Create Trigger', he: 'צור טריגר', category: 'emails' },
  { key: 'emails.triggers.dialog.update', en: 'Update Trigger', he: 'עדכן טריגר', category: 'emails' },

  // Success/Error messages
  { key: 'emails.triggers.dialog.created', en: 'Trigger created successfully', he: 'הטריגר נוצר בהצלחה', category: 'emails' },
  { key: 'emails.triggers.dialog.updated', en: 'Trigger updated successfully', he: 'הטריגר עודכן בהצלחה', category: 'emails' },
  { key: 'emails.triggers.dialog.createFailed', en: 'Failed to create trigger', he: 'יצירת הטריגר נכשלה', category: 'emails' },
  { key: 'emails.triggers.dialog.updateFailed', en: 'Failed to update trigger', he: 'עדכון הטריגר נכשל', category: 'emails' },
  { key: 'emails.triggers.dialog.validation.name', en: 'Please enter a trigger name', he: 'נא להזין שם לטריגר', category: 'emails' },
  { key: 'emails.triggers.dialog.validation.event', en: 'Please select an event type', he: 'נא לבחור סוג אירוע', category: 'emails' },
  { key: 'emails.triggers.dialog.validation.template', en: 'Please select an email template', he: 'נא לבחור תבנית דוא"ל', category: 'emails' },
];

async function addTranslations() {
  console.log('Starting to add email trigger translations...');
  console.log(`Total translations to add: ${emailTriggerTranslations.length} keys × 2 languages = ${emailTriggerTranslations.length * 2} entries\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const translation of emailTriggerTranslations) {
    try {
      // Insert English translation via API
      const enResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_code: 'en',
          translation_key: translation.key,
          translation_value: translation.en,
          category: translation.category,
          context: 'admin',
        }),
      });

      const enData = await enResponse.json();
      if (!enData.success) {
        console.error(`✗ Error adding English translation for ${translation.key}:`, enData.error);
        errorCount++;
        continue;
      }

      // Insert Hebrew translation via API
      const heResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_code: 'he',
          translation_key: translation.key,
          translation_value: translation.he,
          category: translation.category,
          context: 'admin',
        }),
      });

      const heData = await heResponse.json();
      if (!heData.success) {
        console.error(`✗ Error adding Hebrew translation for ${translation.key}:`, heData.error);
        errorCount++;
        continue;
      }

      console.log(`✓ Added translations for: ${translation.key}`);
      successCount += 2; // Both English and Hebrew
    } catch (error) {
      console.error(`✗ Failed to add translation for ${translation.key}:`, error);
      errorCount += 2;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Translation addition complete!');
  console.log(`✓ Successfully added: ${successCount} translations`);
  if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} translations`);
  }
  console.log('='.repeat(60));
}

console.log('⚠️  Make sure the development server is running (npm run dev) before proceeding!');
console.log('Starting in 3 seconds...\n');

setTimeout(() => {
  addTranslations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}, 3000);

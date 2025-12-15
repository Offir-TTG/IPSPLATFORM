import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTranslations() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  const translations = [
    // Payment Schedules Page
    { key: 'admin.payments.schedules.title', en: 'Payment Schedules', he: 'לוח תשלומים' },
    { key: 'admin.payments.schedules.description', en: 'Manage all payment schedules across all enrollments', he: 'ניהול כל לוחות התשלומים עבור כל ההרשמות' },
    { key: 'admin.payments.schedules.loadError', en: 'Failed to load payment schedules', he: 'שגיאה בטעינת לוחות התשלומים' },
    { key: 'admin.payments.schedules.noSchedulesFound', en: 'No Schedules Found', he: 'לא נמצאו לוחות תשלומים' },
    { key: 'admin.payments.schedules.noSchedulesMatch', en: 'No payment schedules match your current filters', he: 'אין לוחות תשלומים התואמים את הסינון הנוכחי' },

    // Table Headers
    { key: 'admin.payments.schedules.paymentNumber', en: 'Payment #', he: 'תשלום מס׳' },
    { key: 'admin.payments.schedules.scheduledDate', en: 'Scheduled Date', he: 'תאריך מתוכנן' },
    { key: 'admin.payments.schedules.original', en: 'Original', he: 'מקורי' },

    // Actions
    { key: 'admin.payments.schedules.adjustDate', en: 'Adjust Date', he: 'שינוי תאריך' },
    { key: 'admin.payments.schedules.adjustSuccess', en: 'Payment date adjusted successfully', he: 'תאריך התשלום שונה בהצלחה' },
    { key: 'admin.payments.schedules.adjustError', en: 'Failed to adjust payment date', he: 'שגיאה בשינוי תאריך התשלום' },
    { key: 'admin.payments.schedules.retryPayment', en: 'Retry Payment', he: 'ניסיון תשלום חוזר' },
    { key: 'admin.payments.schedules.retrySuccess', en: 'Payment retry initiated', he: 'ניסיון תשלום חוזר החל' },
    { key: 'admin.payments.schedules.retryError', en: 'Failed to retry payment', he: 'שגיאה בניסיון תשלום חוזר' },
    { key: 'admin.payments.schedules.pausePayment', en: 'Pause Payment', he: 'השהיית תשלום' },
    { key: 'admin.payments.schedules.pauseSuccess', en: 'Payment paused successfully', he: 'התשלום הושהה בהצלחה' },
    { key: 'admin.payments.schedules.pauseError', en: 'Failed to pause payment', he: 'שגיאה בהשהיית התשלום' },
    { key: 'admin.payments.schedules.resumePayment', en: 'Resume Payment', he: 'חידוש תשלום' },
    { key: 'admin.payments.schedules.resumeSuccess', en: 'Payment resumed successfully', he: 'התשלום חודש בהצלחה' },
    { key: 'admin.payments.schedules.resumeError', en: 'Failed to resume payment', he: 'שגיאה בחידוש התשלום' },

    // Bulk Actions
    { key: 'admin.payments.schedules.schedulesSelected', en: '{count} schedule(s) selected', he: '{count} לוחות תשלומים נבחרו' },
    { key: 'admin.payments.schedules.delayPayments', en: 'Delay Payments', he: 'דחיית תשלומים' },
    { key: 'admin.payments.schedules.pausePayments', en: 'Pause Payments', he: 'השהיית תשלומים' },
    { key: 'admin.payments.schedules.cancelPayments', en: 'Cancel Payments', he: 'ביטול תשלומים' },
    { key: 'admin.payments.schedules.bulkDelaySuccess', en: '{count} payments delayed successfully', he: '{count} תשלומים נדחו בהצלחה' },
    { key: 'admin.payments.schedules.bulkDelayError', en: 'Failed to delay payments', he: 'שגיאה בדחיית התשלומים' },

    // Dialogs
    { key: 'admin.payments.schedules.adjustPaymentDate', en: 'Adjust Payment Date', he: 'שינוי תאריך תשלום' },
    { key: 'admin.payments.schedules.changeScheduledDate', en: "Change the scheduled date for {name}'s payment #{number}", he: 'שינוי תאריך התשלום עבור {name} תשלום מס׳ {number}' },
    { key: 'admin.payments.schedules.newDate', en: 'New Date', he: 'תאריך חדש' },
    { key: 'admin.payments.schedules.reasonPlaceholder', en: 'e.g., User requested extension', he: 'למשל, המשתמש ביקש דחייה' },
    { key: 'admin.payments.schedules.delaySelectedPayments', en: 'Delay {count} selected payment(s) by a specified number of days', he: 'דחיית {count} תשלומים נבחרים במספר ימים מוגדר' },
    { key: 'admin.payments.schedules.daysToDelay', en: 'Days to Delay', he: 'מספר ימים לדחייה' },
    { key: 'admin.payments.schedules.delayReasonPlaceholder', en: 'e.g., Program start date delayed', he: 'למשל, תאריך התחלת התוכנית נדחה' },

    // Pagination
    { key: 'admin.payments.schedules.page', en: 'Page', he: 'עמוד' },
    { key: 'admin.payments.schedules.of', en: 'of', he: 'מתוך' },
  ];

  console.log('Adding payment schedules translations...\n');

  for (const translation of translations) {
    // English
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: translation.key.split('.')[0],
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (enError) {
      console.error(`Error adding EN translation for ${translation.key}:`, enError);
    } else {
      console.log(`✓ Added EN: ${translation.key}`);
    }

    // Hebrew
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: translation.key.split('.')[0],
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (heError) {
      console.error(`Error adding HE translation for ${translation.key}:`, heError);
    } else {
      console.log(`✓ Added HE: ${translation.key}`);
    }
  }

  console.log('\n✅ All payment schedules translations added successfully!');
}

addTranslations().catch(console.error);

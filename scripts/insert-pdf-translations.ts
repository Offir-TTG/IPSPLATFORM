import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  { key: 'pdf.invoice.title', en: 'Enrollment Invoice', he: 'חשבונית הרשמה' },
  { key: 'pdf.invoice.number', en: 'Invoice #', he: 'חשבונית מס\'' },
  { key: 'pdf.invoice.date', en: 'Date', he: 'תאריך' },
  { key: 'pdf.invoice.billTo', en: 'Bill To', he: 'חייב ל' },
  { key: 'pdf.invoice.email', en: 'Email', he: 'דוא"ל' },
  { key: 'pdf.invoice.phone', en: 'Phone', he: 'טלפון' },
  { key: 'pdf.invoice.address', en: 'Address', he: 'כתובת' },
  { key: 'pdf.invoice.website', en: 'Website', he: 'אתר' },
  { key: 'pdf.invoice.taxId', en: 'Tax ID', he: 'מספר עוסק' },
  { key: 'pdf.invoice.enrollmentDetails', en: 'Enrollment Details', he: 'פרטי הרשמה' },
  { key: 'pdf.invoice.product', en: 'Product', he: 'מוצר' },
  { key: 'pdf.invoice.type', en: 'Type', he: 'סוג' },
  { key: 'pdf.invoice.enrolledDate', en: 'Enrollment Date', he: 'תאריך הרשמה' },
  { key: 'pdf.invoice.paymentPlan', en: 'Payment Plan', he: 'תוכנית תשלום' },
  { key: 'pdf.invoice.paymentSummary', en: 'Payment Summary', he: 'סיכום תשלום' },
  { key: 'pdf.invoice.totalAmount', en: 'Total Amount', he: 'סכום כולל' },
  { key: 'pdf.invoice.paidAmount', en: 'Paid Amount', he: 'סכום ששולם' },
  { key: 'pdf.invoice.remainingBalance', en: 'Remaining Balance', he: 'יתרה' },
  { key: 'pdf.invoice.officialDocument', en: 'This is an official enrollment invoice', he: 'זוהי חשבונית הרשמה רשמית' },
  { key: 'pdf.invoice.questions', en: 'Questions? Contact us at', he: 'שאלות? צור קשר ב' },
  { key: 'pdf.invoice.productType.course', en: 'Course', he: 'קורס' },
  { key: 'pdf.invoice.productType.program', en: 'Program', he: 'תכנית' },
  { key: 'pdf.schedule.title', en: 'Payment Schedule', he: 'לוח תשלומים' },
  { key: 'pdf.schedule.date', en: 'Date', he: 'תאריך' },
  { key: 'pdf.schedule.student', en: 'Student Information', he: 'פרטי תלמיד' },
  { key: 'pdf.schedule.name', en: 'Name', he: 'שם' },
  { key: 'pdf.schedule.email', en: 'Email', he: 'דוא"ל' },
  { key: 'pdf.schedule.paymentsTitle', en: 'Payment Schedule', he: 'לוח תשלומים' },
  { key: 'pdf.schedule.number', en: '#', he: 'מס\'' },
  { key: 'pdf.schedule.type', en: 'Type', he: 'סוג' },
  { key: 'pdf.schedule.scheduledDate', en: 'Scheduled', he: 'מתוזמן' },
  { key: 'pdf.schedule.paidDate', en: 'Paid Date', he: 'תאריך תשלום' },
  { key: 'pdf.schedule.amount', en: 'Amount', he: 'סכום' },
  { key: 'pdf.schedule.status', en: 'Status', he: 'סטטוס' },
  { key: 'pdf.schedule.paymentType.deposit', en: 'Deposit', he: 'מקדמה' },
  { key: 'pdf.schedule.paymentType.installment', en: 'Installment', he: 'תשלום' },
  { key: 'pdf.schedule.paymentType.full', en: 'Full Payment', he: 'תשלום מלא' },
  { key: 'pdf.schedule.statusLabel.paid', en: 'PAID', he: 'שולם' },
  { key: 'pdf.schedule.statusLabel.pending', en: 'PENDING', he: 'ממתין' },
  { key: 'pdf.schedule.statusLabel.overdue', en: 'OVERDUE', he: 'באיחור' },
  { key: 'pdf.schedule.officialDocument', en: 'This is an official payment schedule', he: 'זהו לוח תשלומים רשמי' },
  { key: 'pdf.schedule.questions', en: 'Questions? Contact us at', he: 'שאלות? צור קשר ב' },
];

async function insertTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('No tenant found');
      return;
    }

    const tenant = tenants[0];
    console.log(`\nInserting PDF translations for tenant: ${tenant.name} (${tenant.id})`);
    console.log(`Total translations: ${translations.length * 2}\n`);

    let successCount = 0;
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
          context: 'admin'
        });

      if (heResult.error) {
        if (!heResult.error.message.includes('duplicate')) {
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
          context: 'admin'
        });

      if (enResult.error) {
        if (!enResult.error.message.includes('duplicate')) {
          console.error(`❌ Error inserting EN ${t.key}:`, enResult.error.message);
          errorCount++;
        }
      } else {
        console.log(`✓ Added EN: ${t.key}`);
        successCount++;
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Duplicates: ${(translations.length * 2) - successCount - errorCount}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

insertTranslations();

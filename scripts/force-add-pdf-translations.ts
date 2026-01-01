import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // PDF Receipt Content
  { key: 'pdf.receipt.title', en: 'Payment Receipt', he: 'קבלה על תשלום' },
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

  // PDF Content - Payment Schedule
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
  { key: 'pdf.schedule.paymentType.registration', en: 'Registration', he: 'רישום' },
  { key: 'pdf.schedule.paymentType.deposit', en: 'Deposit', he: 'מקדמה' },
  { key: 'pdf.schedule.paymentType.installment', en: 'Installment', he: 'תשלום' },
  { key: 'pdf.schedule.paymentType.full', en: 'Full Payment', he: 'תשלום מלא' },
  { key: 'pdf.schedule.statusLabel.paid', en: 'PAID', he: 'שולם' },
  { key: 'pdf.schedule.statusLabel.pending', en: 'PENDING', he: 'ממתין' },
  { key: 'pdf.schedule.statusLabel.overdue', en: 'OVERDUE', he: 'באיחור' },
  { key: 'pdf.schedule.officialDocument', en: 'This is an official payment schedule', he: 'זהו לוח תשלומים רשמי' },
  { key: 'pdf.schedule.questions', en: 'Questions? Contact us at', he: 'שאלות? צור קשר ב' },
];

async function forceAddTranslations() {
  try {
    console.log('Fetching all tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name');

    if (tenantsError) {
      throw tenantsError;
    }

    if (!tenants || tenants.length === 0) {
      console.log('No tenants found');
      return;
    }

    console.log(`Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.name} (${tenant.id})`);
      let addedCount = 0;

      // Prepare bulk upsert data
      const upsertData = [];

      for (const translation of translations) {
        upsertData.push({
          tenant_id: tenant.id,
          translation_key: translation.key,
          translation_value: translation.he,
          language_code: 'he',
          context: 'admin'
        });

        upsertData.push({
          tenant_id: tenant.id,
          translation_key: translation.key,
          translation_value: translation.en,
          language_code: 'en',
          context: 'admin'
        });
      }

      console.log(`Upserting ${upsertData.length} translations...`);

      // Upsert in batches of 100
      for (let i = 0; i < upsertData.length; i += 100) {
        const batch = upsertData.slice(i, i + 100);

        const { error: upsertError } = await supabase
          .from('translations')
          .upsert(batch, {
            onConflict: 'tenant_id,translation_key,language_code'
          });

        if (upsertError) {
          console.error(`Error upserting batch ${i / 100 + 1}:`, upsertError.message);
        } else {
          addedCount += batch.length;
          console.log(`✓ Batch ${i / 100 + 1} completed (${batch.length} translations)`);
        }
      }

      console.log(`✓ Total ${addedCount} translations upserted for ${tenant.name}`);
    }

    console.log('\n✅ All translations added successfully!');
  } catch (error) {
    console.error('Error adding translations:', error);
    process.exit(1);
  }
}

forceAddTranslations();

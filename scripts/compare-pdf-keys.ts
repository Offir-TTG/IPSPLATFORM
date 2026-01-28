import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Keys expected by EnrollmentInvoiceTemplate.tsx
const expectedInvoiceKeys = [
  'pdf.invoice.title',
  'pdf.invoice.number',
  'pdf.invoice.date',
  'pdf.invoice.billTo',
  'pdf.invoice.email',
  'pdf.invoice.phone',
  'pdf.invoice.address',
  'pdf.invoice.website',
  'pdf.invoice.taxId',
  'pdf.invoice.enrollmentDetails',
  'pdf.invoice.product',
  'pdf.invoice.type',
  'pdf.invoice.enrolledDate',
  'pdf.invoice.paymentPlan',
  'pdf.invoice.paymentSummary',
  'pdf.invoice.totalAmount',
  'pdf.invoice.paidAmount',
  'pdf.invoice.remainingBalance',
  'pdf.invoice.officialDocument',
  'pdf.invoice.questions',
  'pdf.invoice.productType.course',
  'pdf.invoice.productType.program',
];

// Keys expected by PaymentScheduleTemplate.tsx
const expectedScheduleKeys = [
  'pdf.schedule.title',
  'pdf.schedule.date',
  'pdf.schedule.student',
  'pdf.schedule.email',
  'pdf.schedule.paymentsTitle',
  'pdf.schedule.number',
  'pdf.schedule.type',
  'pdf.schedule.scheduledDate',
  'pdf.schedule.paidDate',
  'pdf.schedule.amount',
  'pdf.schedule.status',
  'pdf.schedule.officialDocument',
  'pdf.schedule.questions',
  'pdf.schedule.paymentType.deposit',
  'pdf.schedule.paymentType.installment',
  'pdf.schedule.paymentType.full',
  'pdf.schedule.statusLabel.paid',
  'pdf.schedule.statusLabel.pending',
  'pdf.schedule.statusLabel.overdue',
  'pdf.invoice.number', // Used by schedule template too
];

async function compareKeys() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  // Fetch all PDF translations from database
  const { data: dbTranslations } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .like('translation_key', 'pdf%');

  const dbKeys = new Set(dbTranslations?.map(t => t.translation_key) || []);

  console.log('Database has', dbKeys.size, 'PDF translation keys\n');

  // Check invoice template keys
  console.log('=== INVOICE TEMPLATE KEYS ===');
  const missingInvoiceKeys = expectedInvoiceKeys.filter(k => !dbKeys.has(k));
  console.log('Missing keys:', missingInvoiceKeys.length);
  missingInvoiceKeys.forEach(k => console.log('  ❌', k));

  const foundInvoiceKeys = expectedInvoiceKeys.filter(k => dbKeys.has(k));
  console.log('\nFound keys:', foundInvoiceKeys.length);
  foundInvoiceKeys.slice(0, 5).forEach(k => console.log('  ✓', k));

  // Check schedule template keys
  console.log('\n=== SCHEDULE TEMPLATE KEYS ===');
  const uniqueScheduleKeys = [...new Set(expectedScheduleKeys)];
  const missingScheduleKeys = uniqueScheduleKeys.filter(k => !dbKeys.has(k));
  console.log('Missing keys:', missingScheduleKeys.length);
  missingScheduleKeys.forEach(k => console.log('  ❌', k));

  const foundScheduleKeys = uniqueScheduleKeys.filter(k => dbKeys.has(k));
  console.log('\nFound keys:', foundScheduleKeys.length);
  foundScheduleKeys.slice(0, 5).forEach(k => console.log('  ✓', k));

  // Show what's in the database
  console.log('\n=== DATABASE KEYS (first 20) ===');
  [...dbKeys].slice(0, 20).forEach(k => console.log('  ', k));
}

compareKeys();

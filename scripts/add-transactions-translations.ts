import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Page Title & Description
  { key: 'admin.payments.transactions.title', en: 'Transactions', he: 'עסקאות' },
  { key: 'admin.payments.transactions.description', en: 'View and manage all payment transactions', he: 'צפייה וניהול כל עסקאות התשלום' },

  // Actions
  { key: 'admin.payments.transactions.export', en: 'Export', he: 'ייצוא' },
  { key: 'admin.payments.transactions.refresh', en: 'Refresh', he: 'רענון' },
  { key: 'admin.payments.transactions.exportSuccess', en: 'Transactions exported successfully', he: 'העסקאות יוצאו בהצלחה' },
  { key: 'admin.payments.transactions.exportError', en: 'Failed to export transactions', he: 'ייצוא העסקאות נכשל' },
  { key: 'admin.payments.transactions.loadError', en: 'Failed to load transactions', he: 'טעינת העסקאות נכשלה' },

  // Summary Cards
  { key: 'admin.payments.transactions.totalTransactions', en: 'Total Transactions', he: 'סה"כ עסקאות' },
  { key: 'admin.payments.transactions.totalAmount', en: 'Total Amount', he: 'סכום כולל' },
  { key: 'admin.payments.transactions.completed', en: 'Completed', he: 'הושלמו' },
  { key: 'admin.payments.transactions.refunded', en: 'Refunded', he: 'הוחזרו' },

  // Filters
  { key: 'admin.payments.transactions.filters', en: 'Filters', he: 'סינון' },
  { key: 'admin.payments.transactions.search', en: 'Search', he: 'חיפוש' },
  { key: 'admin.payments.transactions.searchPlaceholder', en: 'Search by user, email, or transaction ID...', he: 'חיפוש לפי משתמש, אימייל או מזהה עסקה...' },
  { key: 'admin.payments.transactions.allStatuses', en: 'All Statuses', he: 'כל הסטטוסים' },
  { key: 'admin.payments.transactions.clearFilters', en: 'Clear Filters', he: 'נקה סינון' },

  // Status
  { key: 'admin.payments.transactions.status.completed', en: 'Completed', he: 'הושלם' },
  { key: 'admin.payments.transactions.status.pending', en: 'Pending', he: 'בהמתנה' },
  { key: 'admin.payments.transactions.status.failed', en: 'Failed', he: 'נכשל' },
  { key: 'admin.payments.transactions.status.refunded', en: 'Refunded', he: 'הוחזר' },
  { key: 'admin.payments.transactions.status.partiallyRefunded', en: 'Partially Refunded', he: 'הוחזר חלקית' },

  // Payment Types (deposit, installment, subscription, full) - Admin
  { key: 'admin.payments.paymentType.deposit', en: 'Deposit', he: 'מקדמה' },
  { key: 'admin.payments.paymentType.installment', en: 'Installment', he: 'תשלום' },
  { key: 'admin.payments.paymentType.subscription', en: 'Subscription', he: 'מנוי' },
  { key: 'admin.payments.paymentType.full', en: 'Full Payment', he: 'תשלום מלא' },
  { key: 'admin.payments.paymentType.unknown', en: 'Unknown', he: 'לא ידוע' },

  // Payment Types - User
  { key: 'user.payments.paymentType.deposit', en: 'Deposit', he: 'מקדמה' },
  { key: 'user.payments.paymentType.installment', en: 'Installment', he: 'תשלום' },
  { key: 'user.payments.paymentType.subscription', en: 'Subscription', he: 'מנוי' },
  { key: 'user.payments.paymentType.full', en: 'Full Payment', he: 'תשלום מלא' },
  { key: 'user.payments.paymentType.unknown', en: 'Unknown', he: 'לא ידוע' },

  // Payment Status - User
  { key: 'user.payments.status.paid', en: 'Paid', he: 'שולם' },
  { key: 'user.payments.status.pending', en: 'Pending', he: 'בהמתנה' },
  { key: 'user.payments.status.failed', en: 'Failed', he: 'נכשל' },
  { key: 'user.payments.status.overdue', en: 'Overdue', he: 'באיחור' },
  { key: 'user.payments.status.completed', en: 'Completed', he: 'הושלם' },

  // Table
  { key: 'admin.payments.transactions.table.date', en: 'Date', he: 'תאריך' },
  { key: 'admin.payments.transactions.table.user', en: 'User', he: 'משתמש' },
  { key: 'admin.payments.transactions.table.product', en: 'Product', he: 'מוצר' },
  { key: 'admin.payments.transactions.table.installmentNumber', en: 'Installment #', he: 'מספר תשלום' },
  { key: 'admin.payments.transactions.table.amount', en: 'Amount', he: 'סכום' },
  { key: 'admin.payments.transactions.table.paymentType', en: 'Payment Type', he: 'סוג תשלום' },
  { key: 'admin.payments.transactions.table.status', en: 'Status', he: 'סטטוס' },
  { key: 'admin.payments.transactions.table.actions', en: 'Actions', he: 'פעולות' },
  { key: 'admin.payments.transactions.refundedAmount', en: 'Refunded', he: 'הוחזר' },

  // Empty State
  { key: 'admin.payments.transactions.noTransactionsFound', en: 'No Transactions Found', he: 'לא נמצאו עסקאות' },
  { key: 'admin.payments.transactions.noTransactionsMatch', en: 'No transactions match your current filters', he: 'אין עסקאות התואמות את הסינון הנוכחי' },

  // Refund Dialog
  { key: 'admin.payments.transactions.refund.title', en: 'Process Refund', he: 'ביצוע החזר' },
  { key: 'admin.payments.transactions.refund.description', en: 'Refund transaction for', he: 'החזר עסקה עבור' },
  { key: 'admin.payments.transactions.refund.type', en: 'Refund Type', he: 'סוג החזר' },
  { key: 'admin.payments.transactions.refund.fullRefund', en: 'Full Refund', he: 'החזר מלא' },
  { key: 'admin.payments.transactions.refund.partialRefund', en: 'Partial Refund', he: 'החזר חלקי' },
  { key: 'admin.payments.transactions.refund.amount', en: 'Refund Amount', he: 'סכום החזר' },
  { key: 'admin.payments.transactions.refund.maximum', en: 'Maximum', he: 'מקסימום' },
  { key: 'admin.payments.transactions.refund.reasonPlaceholder', en: 'Enter reason for refund...', he: 'הזן סיבה להחזר...' },
  { key: 'admin.payments.transactions.refund.fullAlert', en: 'This will refund the full amount to the customer', he: 'פעולה זו תחזיר את הסכום המלא ללקוח' },
  { key: 'admin.payments.transactions.refund.partialAlert', en: 'This will refund the specified amount to the customer', he: 'פעולה זו תחזיר את הסכום שצוין ללקוח' },
  { key: 'admin.payments.transactions.refund.processButton', en: 'Process Refund', he: 'בצע החזר' },
  { key: 'admin.payments.transactions.refund.success', en: 'Refund processed successfully', he: 'החזר בוצע בהצלחה' },
  { key: 'admin.payments.transactions.refund.error', en: 'Failed to process refund', he: 'ביצוע ההחזר נכשל' },

  // Details Dialog
  { key: 'admin.payments.transactions.details.title', en: 'Transaction Details', he: 'פרטי עסקה' },
  { key: 'admin.payments.transactions.details.transactionId', en: 'Transaction ID', he: 'מזהה עסקה' },
  { key: 'admin.payments.transactions.details.stripePaymentIntent', en: 'Stripe Payment Intent', he: 'כוונת תשלום Stripe' },
  { key: 'admin.payments.transactions.details.failureReason', en: 'Failure Reason', he: 'סיבת כישלון' },
  { key: 'admin.payments.transactions.details.metadata', en: 'Metadata', he: 'מטא-דאטה' },
  { key: 'admin.payments.transactions.details.metadata.paymentNumber', en: 'Payment Number', he: 'מספר תשלום' },
  { key: 'admin.payments.transactions.details.metadata.paymentType', en: 'Payment Type', he: 'סוג תשלום' },
  { key: 'admin.payments.transactions.details.metadata.paidDate', en: 'Paid Date', he: 'תאריך תשלום' },
  { key: 'admin.payments.transactions.details.metadata.scheduledDate', en: 'Scheduled Date', he: 'תאריך מתוכנן' },
  { key: 'admin.payments.transactions.details.metadata.enrollmentId', en: 'Enrollment ID', he: 'מזהה הרשמה' },
  { key: 'admin.payments.transactions.details.metadata.scheduleId', en: 'Schedule ID', he: 'מזהה לוח זמנים' },
  { key: 'admin.payments.transactions.details.close', en: 'Close', he: 'סגור' },

  // Pagination
  { key: 'admin.payments.transactions.pagination.rowsPerPage', en: 'Rows per page:', he: 'שורות בעמוד:' },
  { key: 'admin.payments.transactions.pagination.showing', en: 'Showing', he: 'מציג' },
  { key: 'admin.payments.transactions.pagination.page', en: 'Page', he: 'עמוד' },
  { key: 'admin.payments.transactions.pagination.first', en: 'First', he: 'ראשון' },
  { key: 'admin.payments.transactions.pagination.previous', en: 'Previous', he: 'קודם' },
  { key: 'admin.payments.transactions.pagination.next', en: 'Next', he: 'הבא' },
  { key: 'admin.payments.transactions.pagination.last', en: 'Last', he: 'אחרון' },

  // Common
  { key: 'common.status', en: 'Status', he: 'סטטוס' },
  { key: 'common.dateFrom', en: 'Date From', he: 'מתאריך' },
  { key: 'common.dateTo', en: 'Date To', he: 'עד תאריך' },
  { key: 'common.reason', en: 'Reason', he: 'סיבה' },
  { key: 'common.cancel', en: 'Cancel', he: 'ביטול' },
  { key: 'common.success', en: 'Success', he: 'הצלחה' },
  { key: 'common.error', en: 'Error', he: 'שגיאה' },
  { key: 'common.back', en: 'Back', he: 'חזרה' },
  { key: 'common.null', en: 'N/A', he: 'לא זמין' },
];

async function addTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;
    let addedCount = 0;
    let updatedCount = 0;

    console.log(`\n📝 Adding/updating ${translations.length} translations for tenant: ${tenantId}\n`);

    for (const { key, en, he } of translations) {
      // Check Hebrew translation
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .single();

      if (existingHe) {
        if (existingHe.translation_value !== he) {
          const { error: updateError } = await supabase
            .from('translations')
            .update({ translation_value: he })
            .eq('id', existingHe.id);

          if (!updateError) {
            updatedCount++;
            console.log(`🔄 Updated HE: ${key}`);
          }
        } else {
          console.log(`✓ Exists HE: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: he,
            language_code: 'he',
            context: 'admin'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added HE: ${key}`);
        }
      }

      // Check English translation
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en')
        .single();

      if (existingEn) {
        if (existingEn.translation_value !== en) {
          const { error: updateError } = await supabase
            .from('translations')
            .update({ translation_value: en })
            .eq('id', existingEn.id);

          if (!updateError) {
            updatedCount++;
            console.log(`🔄 Updated EN: ${key}`);
          }
        } else {
          console.log(`✓ Exists EN: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: en,
            language_code: 'en',
            context: 'admin'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added EN: ${key}`);
        }
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(`Total added: ${addedCount}`);
    console.log(`Total updated: ${updatedCount}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  // Page headers
  { key: 'admin.payments.disputes.title', en: 'Payment Disputes', he: 'תביעות תשלום', context: 'admin' },
  { key: 'admin.payments.disputes.description', en: 'Manage chargebacks and payment disputes', he: 'ניהול חיובים חוזרים ותביעות תשלום', context: 'admin' },
  { key: 'admin.payments.disputes.refresh', en: 'Refresh', he: 'רענן', context: 'admin' },

  // Summary cards
  { key: 'admin.payments.disputes.totalDisputes', en: 'Total Disputes', he: 'סה"כ תביעות', context: 'admin' },
  { key: 'admin.payments.disputes.needsResponse', en: 'Needs Response', he: 'דורש מענה', context: 'admin' },
  { key: 'admin.payments.disputes.won', en: 'Won', he: 'זכינו', context: 'admin' },
  { key: 'admin.payments.disputes.lost', en: 'Lost', he: 'הפסדנו', context: 'admin' },

  // Filters
  { key: 'admin.payments.disputes.filters', en: 'Filters', he: 'סינון', context: 'admin' },
  { key: 'admin.payments.disputes.search', en: 'Search', he: 'חיפוש', context: 'admin' },
  { key: 'admin.payments.disputes.searchPlaceholder', en: 'User name, email, or dispute ID', he: 'שם משתמש, אימייל, או מזהה תביעה', context: 'admin' },
  { key: 'admin.payments.disputes.allStatuses', en: 'All Statuses', he: 'כל הסטטוסים', context: 'admin' },
  { key: 'admin.payments.disputes.clearFilters', en: 'Clear Filters', he: 'נקה סינון', context: 'admin' },

  // Status labels
  { key: 'admin.payments.disputes.status.needsResponse', en: 'Needs Response', he: 'דורש מענה', context: 'admin' },
  { key: 'admin.payments.disputes.status.underReview', en: 'Under Review', he: 'בבדיקה', context: 'admin' },
  { key: 'admin.payments.disputes.status.won', en: 'Won', he: 'זכינו', context: 'admin' },
  { key: 'admin.payments.disputes.status.lost', en: 'Lost', he: 'הפסדנו', context: 'admin' },
  { key: 'admin.payments.disputes.status.closed', en: 'Closed', he: 'סגור', context: 'admin' },

  // Urgent alerts
  { key: 'admin.payments.disputes.urgent', en: 'Urgent', he: 'דחוף', context: 'admin' },
  { key: 'admin.payments.disputes.urgentMessage', en: '{count} dispute(s) have passed their evidence deadline!', he: '{count} תביעות עברו את מועד הגשת הראיות!', context: 'admin' },

  // Table headers
  { key: 'admin.payments.disputes.table.created', en: 'Created', he: 'נוצר', context: 'admin' },
  { key: 'admin.payments.disputes.table.user', en: 'User', he: 'משתמש', context: 'admin' },
  { key: 'admin.payments.disputes.table.product', en: 'Product', he: 'מוצר', context: 'admin' },
  { key: 'admin.payments.disputes.table.amount', en: 'Amount', he: 'סכום', context: 'admin' },
  { key: 'admin.payments.disputes.table.reason', en: 'Reason', he: 'סיבה', context: 'admin' },
  { key: 'admin.payments.disputes.table.status', en: 'Status', he: 'סטטוס', context: 'admin' },
  { key: 'admin.payments.disputes.table.evidenceDue', en: 'Evidence Due', he: 'מועד הגשת ראיות', context: 'admin' },
  { key: 'admin.payments.disputes.table.actions', en: 'Actions', he: 'פעולות', context: 'admin' },
  { key: 'admin.payments.disputes.overdue', en: 'OVERDUE', he: 'פג תוקף', context: 'admin' },

  // Empty state
  { key: 'admin.payments.disputes.noDisputes', en: 'No Disputes', he: 'אין תביעות', context: 'admin' },
  { key: 'admin.payments.disputes.noDisputesDescription', en: 'There are no payment disputes at this time', he: 'אין תביעות תשלום כרגע', context: 'admin' },

  // Details dialog
  { key: 'admin.payments.disputes.details.title', en: 'Dispute Details', he: 'פרטי תביעה', context: 'admin' },
  { key: 'admin.payments.disputes.details.disputeId', en: 'Dispute ID', he: 'מזהה תביעה', context: 'admin' },
  { key: 'admin.payments.disputes.details.user', en: 'User', he: 'משתמש', context: 'admin' },
  { key: 'admin.payments.disputes.details.product', en: 'Product', he: 'מוצר', context: 'admin' },
  { key: 'admin.payments.disputes.details.amount', en: 'Amount', he: 'סכום', context: 'admin' },
  { key: 'admin.payments.disputes.details.reason', en: 'Reason', he: 'סיבה', context: 'admin' },
  { key: 'admin.payments.disputes.details.created', en: 'Created', he: 'נוצר', context: 'admin' },
  { key: 'admin.payments.disputes.details.evidenceDue', en: 'Evidence Due', he: 'מועד הגשת ראיות', context: 'admin' },
  { key: 'admin.payments.disputes.details.transactionId', en: 'Transaction ID', he: 'מזהה עסקה', context: 'admin' },
  { key: 'admin.payments.disputes.details.evidenceSubmitted', en: 'Evidence Submitted', he: 'ראיות הוגשו', context: 'admin' },
  { key: 'admin.payments.disputes.details.yes', en: 'Yes', he: 'כן', context: 'admin' },
  { key: 'admin.payments.disputes.details.no', en: 'No', he: 'לא', context: 'admin' },
  { key: 'admin.payments.disputes.details.stripeAlert', en: 'View full dispute details and submit evidence in the Stripe Dashboard.', he: 'צפה בפרטי התביעה המלאים והגש ראיות ב-Stripe Dashboard.', context: 'admin' },
  { key: 'admin.payments.disputes.details.close', en: 'Close', he: 'סגור', context: 'admin' },
  { key: 'admin.payments.disputes.details.openInStripe', en: 'Open in Stripe', he: 'פתח ב-Stripe', context: 'admin' },

  // Evidence dialog
  { key: 'admin.payments.disputes.evidence.title', en: 'Submit Dispute Evidence', he: 'הגשת ראיות לתביעה', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.description', en: 'Provide evidence to contest the dispute for {user}', he: 'ספק ראיות כדי לערער על התביעה עבור {user}', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.deadlineAlert', en: 'Evidence must be submitted by {date}. Submit comprehensive evidence to increase chances of winning.', he: 'יש להגיש ראיות עד {date}. הגש ראיות מקיפות כדי להגדיל את הסיכוי לזכות.', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.customerName', en: 'Customer Name', he: 'שם לקוח', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.customerEmail', en: 'Customer Email', he: 'אימייל לקוח', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.customerPurchaseIp', en: 'Customer Purchase IP', he: 'IP רכישת לקוח', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.customerPurchaseIpPlaceholder', en: 'e.g., 192.168.1.1', he: 'לדוגמה, 192.168.1.1', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.receiptUrl', en: 'Receipt URL', he: 'קישור לקבלה', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.receiptUrlPlaceholder', en: 'https://...', he: 'https://...', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.productDescription', en: 'Product Description', he: 'תיאור מוצר', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.productDescriptionPlaceholder', en: 'Detailed description of the product/service provided', he: 'תיאור מפורט של המוצר/שירות שסופק', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.customerCommunication', en: 'Customer Communication', he: 'תקשורת עם לקוח', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.customerCommunicationPlaceholder', en: 'Any email exchanges, support tickets, or other communications with the customer', he: 'כל חילופי אימיילים, פניות תמיכה, או תקשורת אחרת עם הלקוח', context: 'admin' },
  { key: 'admin.payments.disputes.evidence.submit', en: 'Submit Evidence', he: 'הגש ראיות', context: 'admin' },

  // Toast messages
  { key: 'admin.payments.disputes.loadError', en: 'Failed to load disputes', he: 'נכשל בטעינת תביעות', context: 'admin' },
  { key: 'admin.payments.disputes.evidenceSuccess', en: 'Evidence submitted successfully', he: 'ראיות הוגשו בהצלחה', context: 'admin' },
  { key: 'admin.payments.disputes.evidenceError', en: 'Failed to submit evidence', he: 'נכשל בהגשת ראיות', context: 'admin' },
];

async function addTranslations() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  console.log('🌐 Adding Disputes Page Translations\n');

  for (const translation of translations) {
    for (const lang of ['en', 'he']) {
      // Check if exists
      const { data: existing } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', lang)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('translations')
          .update({
            translation_value: translation[lang as 'en' | 'he'],
            context: translation.context
          })
          .eq('id', existing.id);

        if (error) {
          console.log(`❌ ${translation.key} (${lang}): ${error.message}`);
        } else {
          console.log(`✅ ${translation.key} (${lang}): "${translation[lang as 'en' | 'he']}" (updated)`);
        }
      } else {
        // Insert
        const { error } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            language_code: lang,
            translation_value: translation[lang as 'en' | 'he'],
            context: translation.context
          });

        if (error) {
          console.log(`❌ ${translation.key} (${lang}): ${error.message}`);
        } else {
          console.log(`✅ ${translation.key} (${lang}): "${translation[lang as 'en' | 'he']}" (created)`);
        }
      }
    }
  }

  console.log(`\n✅ Done! Added ${translations.length} translation keys (${translations.length * 2} total translations)`);
}

addTranslations().then(() => process.exit(0));

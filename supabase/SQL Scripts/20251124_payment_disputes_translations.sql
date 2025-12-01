-- ============================================================================
-- Payment Disputes Page Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for payment disputes page
-- Author: System
-- Date: 2025-11-24

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      -- Page header
      'admin.payments.disputes.title',
      'admin.payments.disputes.description',
      'admin.payments.disputes.refresh',
      -- Summary cards
      'admin.payments.disputes.totalDisputes',
      'admin.payments.disputes.needsResponse',
      'admin.payments.disputes.won',
      'admin.payments.disputes.lost',
      -- Filters
      'admin.payments.disputes.filters',
      'admin.payments.disputes.search',
      'admin.payments.disputes.searchPlaceholder',
      'admin.payments.disputes.allStatuses',
      'admin.payments.disputes.clearFilters',
      -- Status values
      'admin.payments.disputes.status.needsResponse',
      'admin.payments.disputes.status.underReview',
      'admin.payments.disputes.status.won',
      'admin.payments.disputes.status.lost',
      'admin.payments.disputes.status.closed',
      -- Urgent alert
      'admin.payments.disputes.urgent',
      'admin.payments.disputes.urgentMessage',
      -- Table headers
      'admin.payments.disputes.table.created',
      'admin.payments.disputes.table.user',
      'admin.payments.disputes.table.product',
      'admin.payments.disputes.table.amount',
      'admin.payments.disputes.table.reason',
      'admin.payments.disputes.table.status',
      'admin.payments.disputes.table.evidenceDue',
      'admin.payments.disputes.table.actions',
      -- Table content
      'admin.payments.disputes.overdue',
      -- Empty state
      'admin.payments.disputes.noDisputes',
      'admin.payments.disputes.noDisputesDescription',
      -- Details dialog
      'admin.payments.disputes.details.title',
      'admin.payments.disputes.details.disputeId',
      'admin.payments.disputes.details.user',
      'admin.payments.disputes.details.product',
      'admin.payments.disputes.details.amount',
      'admin.payments.disputes.details.reason',
      'admin.payments.disputes.details.created',
      'admin.payments.disputes.details.evidenceDue',
      'admin.payments.disputes.details.transactionId',
      'admin.payments.disputes.details.evidenceSubmitted',
      'admin.payments.disputes.details.yes',
      'admin.payments.disputes.details.no',
      'admin.payments.disputes.details.stripeAlert',
      'admin.payments.disputes.details.close',
      'admin.payments.disputes.details.openInStripe',
      -- Evidence dialog
      'admin.payments.disputes.evidence.title',
      'admin.payments.disputes.evidence.description',
      'admin.payments.disputes.evidence.deadlineAlert',
      'admin.payments.disputes.evidence.deadlineAlertMessage',
      'admin.payments.disputes.evidence.customerName',
      'admin.payments.disputes.evidence.customerEmail',
      'admin.payments.disputes.evidence.customerPurchaseIp',
      'admin.payments.disputes.evidence.customerPurchaseIpPlaceholder',
      'admin.payments.disputes.evidence.receiptUrl',
      'admin.payments.disputes.evidence.receiptUrlPlaceholder',
      'admin.payments.disputes.evidence.productDescription',
      'admin.payments.disputes.evidence.productDescriptionPlaceholder',
      'admin.payments.disputes.evidence.customerCommunication',
      'admin.payments.disputes.evidence.customerCommunicationPlaceholder',
      'admin.payments.disputes.evidence.submit',
      -- Toast messages
      'admin.payments.disputes.loadError',
      'admin.payments.disputes.evidenceSuccess',
      'admin.payments.disputes.evidenceError'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- Page header
  (v_tenant_id, 'en', 'admin.payments.disputes.title', 'Payment Disputes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.title', 'מחלוקות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.description', 'Manage chargebacks and payment disputes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.description', 'ניהול חיובים חוזרים ומחלוקות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.refresh', 'Refresh', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.refresh', 'רענן', 'admin', NOW(), NOW()),

  -- Summary cards
  (v_tenant_id, 'en', 'admin.payments.disputes.totalDisputes', 'Total Disputes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.totalDisputes', 'סה"כ מחלוקות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.needsResponse', 'Needs Response', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.needsResponse', 'דורש תגובה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.won', 'Won', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.won', 'זכינו', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.lost', 'Lost', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.lost', 'הפסדנו', 'admin', NOW(), NOW()),

  -- Filters
  (v_tenant_id, 'en', 'admin.payments.disputes.filters', 'Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.filters', 'מסננים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.search', 'Search', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.search', 'חיפוש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.searchPlaceholder', 'User name, email, or dispute ID', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.searchPlaceholder', 'שם משתמש, אימייל או מזהה מחלוקת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.allStatuses', 'All Statuses', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.allStatuses', 'כל הסטטוסים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.clearFilters', 'Clear Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.clearFilters', 'נקה מסננים', 'admin', NOW(), NOW()),

  -- Status values
  (v_tenant_id, 'en', 'admin.payments.disputes.status.needsResponse', 'Needs Response', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.status.needsResponse', 'דורש תגובה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.status.underReview', 'Under Review', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.status.underReview', 'בבדיקה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.status.won', 'Won', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.status.won', 'זכינו', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.status.lost', 'Lost', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.status.lost', 'הפסדנו', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.status.closed', 'Closed', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.status.closed', 'סגור', 'admin', NOW(), NOW()),

  -- Urgent alert
  (v_tenant_id, 'en', 'admin.payments.disputes.urgent', 'Urgent', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.urgent', 'דחוף', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.urgentMessage', '{count} dispute(s) have passed their evidence deadline!', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.urgentMessage', '{count} מחלוקות עברו את המועד האחרון להגשת ראיות!', 'admin', NOW(), NOW()),

  -- Table headers
  (v_tenant_id, 'en', 'admin.payments.disputes.table.created', 'Created', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.table.created', 'נוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.table.user', 'User', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.table.user', 'משתמש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.table.product', 'Product', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.table.product', 'מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.table.amount', 'Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.table.amount', 'סכום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.table.reason', 'Reason', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.table.reason', 'סיבה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.table.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.table.status', 'סטטוס', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.table.evidenceDue', 'Evidence Due', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.table.evidenceDue', 'מועד הגשת ראיות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.table.actions', 'Actions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.table.actions', 'פעולות', 'admin', NOW(), NOW()),

  -- Table content
  (v_tenant_id, 'en', 'admin.payments.disputes.overdue', 'OVERDUE', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.overdue', 'באיחור', 'admin', NOW(), NOW()),

  -- Empty state
  (v_tenant_id, 'en', 'admin.payments.disputes.noDisputes', 'No Disputes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.noDisputes', 'אין מחלוקות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.noDisputesDescription', 'There are no payment disputes at this time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.noDisputesDescription', 'אין מחלוקות תשלום כרגע', 'admin', NOW(), NOW()),

  -- Details dialog
  (v_tenant_id, 'en', 'admin.payments.disputes.details.title', 'Dispute Details', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.title', 'פרטי מחלוקת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.disputeId', 'Dispute ID', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.disputeId', 'מזהה מחלוקת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.user', 'User', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.user', 'משתמש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.product', 'Product', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.product', 'מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.amount', 'Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.amount', 'סכום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.reason', 'Reason', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.reason', 'סיבה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.created', 'Created', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.created', 'נוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.evidenceDue', 'Evidence Due', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.evidenceDue', 'מועד הגשת ראיות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.transactionId', 'Transaction ID', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.transactionId', 'מזהה עסקה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.evidenceSubmitted', 'Evidence Submitted', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.evidenceSubmitted', 'ראיות הוגשו', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.yes', 'Yes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.yes', 'כן', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.no', 'No', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.no', 'לא', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.stripeAlert', 'View full dispute details and submit evidence in the Stripe Dashboard.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.stripeAlert', 'הצג את פרטי המחלוקת המלאים והגש ראיות בלוח הבקרה של Stripe.', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.close', 'Close', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.close', 'סגור', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.details.openInStripe', 'Open in Stripe', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.details.openInStripe', 'פתח ב-Stripe', 'admin', NOW(), NOW()),

  -- Evidence dialog
  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.title', 'Submit Dispute Evidence', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.title', 'הגש ראיות למחלוקת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.description', 'Provide evidence to contest the dispute for {user}', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.description', 'ספק ראיות לחלוק על המחלוקת עבור {user}', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.deadlineAlert', 'Evidence must be submitted by {date}. Submit comprehensive evidence to increase chances of winning.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.deadlineAlert', 'ראיות חייבות להיות מוגשות עד {date}. הגש ראיות מקיפות כדי להגדיל את הסיכויים לזכות.', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.customerName', 'Customer Name', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.customerName', 'שם לקוח', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.customerEmail', 'Customer Email', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.customerEmail', 'אימייל לקוח', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.customerPurchaseIp', 'Customer Purchase IP', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.customerPurchaseIp', 'כתובת IP של הרכישה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.customerPurchaseIpPlaceholder', 'e.g., 192.168.1.1', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.customerPurchaseIpPlaceholder', 'לדוגמה: 192.168.1.1', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.receiptUrl', 'Receipt URL', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.receiptUrl', 'כתובת קבלה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.receiptUrlPlaceholder', 'https://...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.receiptUrlPlaceholder', 'https://...', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.productDescription', 'Product Description', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.productDescription', 'תיאור מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.productDescriptionPlaceholder', 'Detailed description of the product/service provided', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.productDescriptionPlaceholder', 'תיאור מפורט של המוצר/שירות שסופק', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.customerCommunication', 'Customer Communication', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.customerCommunication', 'תקשורת עם הלקוח', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.customerCommunicationPlaceholder', 'Any email exchanges, support tickets, or other communications with the customer', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.customerCommunicationPlaceholder', 'כל חילופי אימייל, פניות תמיכה או תקשורת אחרת עם הלקוח', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidence.submit', 'Submit Evidence', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidence.submit', 'הגש ראיות', 'admin', NOW(), NOW()),

  -- Toast messages
  (v_tenant_id, 'en', 'admin.payments.disputes.loadError', 'Failed to load disputes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.loadError', 'טעינת מחלוקות נכשלה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidenceSuccess', 'Evidence submitted successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidenceSuccess', 'ראיות הוגשו בהצלחה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.disputes.evidenceError', 'Failed to submit evidence', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.disputes.evidenceError', 'הגשת ראיות נכשלה', 'admin', NOW(), NOW());

  RAISE NOTICE 'Payment disputes translations added successfully';

END $$;

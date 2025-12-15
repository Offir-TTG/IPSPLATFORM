-- ============================================================================
-- Payment Disputes Page Complete Translations (English & Hebrew)
-- ============================================================================
-- Description: Add all translations for the payment disputes page
-- This migration adds global translations (tenant_id = NULL) for all users
-- Author: Claude Code Assistant
-- Date: 2025-11-27

DO $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Delete existing disputes translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'admin.payments.disputes.%';

  -- ============================================================================
  -- PAYMENT DISPUTES PAGE - MAIN TRANSLATIONS
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Page Header
    ('admin.payments.disputes.title', 'en', 'Payment Disputes', 'admin', NULL::uuid),
    ('admin.payments.disputes.title', 'he', 'מחלוקות תשלום', 'admin', NULL::uuid),
    ('admin.payments.disputes.description', 'en', 'Manage chargebacks and payment disputes', 'admin', NULL::uuid),
    ('admin.payments.disputes.description', 'he', 'נהל חיובים חוזרים ומחלוקות תשלום', 'admin', NULL::uuid),
    ('admin.payments.disputes.refresh', 'en', 'Refresh', 'admin', NULL::uuid),
    ('admin.payments.disputes.refresh', 'he', 'רענן', 'admin', NULL::uuid),

    -- Summary Cards
    ('admin.payments.disputes.totalDisputes', 'en', 'Total Disputes', 'admin', NULL::uuid),
    ('admin.payments.disputes.totalDisputes', 'he', 'סך המחלוקות', 'admin', NULL::uuid),
    ('admin.payments.disputes.needsResponse', 'en', 'Needs Response', 'admin', NULL::uuid),
    ('admin.payments.disputes.needsResponse', 'he', 'דרוש מענה', 'admin', NULL::uuid),
    ('admin.payments.disputes.won', 'en', 'Won', 'admin', NULL::uuid),
    ('admin.payments.disputes.won', 'he', 'זכינו', 'admin', NULL::uuid),
    ('admin.payments.disputes.lost', 'en', 'Lost', 'admin', NULL::uuid),
    ('admin.payments.disputes.lost', 'he', 'הפסדנו', 'admin', NULL::uuid),

    -- Filters
    ('admin.payments.disputes.filters', 'en', 'Filters', 'admin', NULL::uuid),
    ('admin.payments.disputes.filters', 'he', 'סינון', 'admin', NULL::uuid),
    ('admin.payments.disputes.search', 'en', 'Search', 'admin', NULL::uuid),
    ('admin.payments.disputes.search', 'he', 'חיפוש', 'admin', NULL::uuid),
    ('admin.payments.disputes.searchPlaceholder', 'en', 'User name, email, or dispute ID', 'admin', NULL::uuid),
    ('admin.payments.disputes.searchPlaceholder', 'he', 'שם משתמש, אימייל או מזהה מחלוקת', 'admin', NULL::uuid),
    ('admin.payments.disputes.allStatuses', 'en', 'All Statuses', 'admin', NULL::uuid),
    ('admin.payments.disputes.allStatuses', 'he', 'כל הסטטוסים', 'admin', NULL::uuid),
    ('admin.payments.disputes.clearFilters', 'en', 'Clear Filters', 'admin', NULL::uuid),
    ('admin.payments.disputes.clearFilters', 'he', 'נקה סינון', 'admin', NULL::uuid),

    -- Dispute Statuses
    ('admin.payments.disputes.status.needsResponse', 'en', 'Needs Response', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.needsResponse', 'he', 'דרוש מענה', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.underReview', 'en', 'Under Review', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.underReview', 'he', 'בבדיקה', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.won', 'en', 'Won', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.won', 'he', 'זכינו', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.lost', 'en', 'Lost', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.lost', 'he', 'הפסדנו', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.closed', 'en', 'Closed', 'admin', NULL::uuid),
    ('admin.payments.disputes.status.closed', 'he', 'סגור', 'admin', NULL::uuid),

    -- Urgent Alert
    ('admin.payments.disputes.urgent', 'en', 'Urgent', 'admin', NULL::uuid),
    ('admin.payments.disputes.urgent', 'he', 'דחוף', 'admin', NULL::uuid),
    ('admin.payments.disputes.urgentMessage', 'en', '{count} dispute(s) have passed their evidence deadline!', 'admin', NULL::uuid),
    ('admin.payments.disputes.urgentMessage', 'he', '{count} מחלוקות עברו את מועד הגשת הראיות!', 'admin', NULL::uuid),

    -- Table Headers
    ('admin.payments.disputes.table.created', 'en', 'Created', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.created', 'he', 'נוצר', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.user', 'en', 'User', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.user', 'he', 'משתמש', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.product', 'en', 'Product', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.product', 'he', 'מוצר', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.amount', 'en', 'Amount', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.amount', 'he', 'סכום', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.reason', 'en', 'Reason', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.reason', 'he', 'סיבה', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.status', 'en', 'Status', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.status', 'he', 'סטטוס', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.evidenceDue', 'en', 'Evidence Due', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.evidenceDue', 'he', 'מועד הגשת ראיות', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.actions', 'en', 'Actions', 'admin', NULL::uuid),
    ('admin.payments.disputes.table.actions', 'he', 'פעולות', 'admin', NULL::uuid),

    -- Table Status Labels
    ('admin.payments.disputes.overdue', 'en', 'OVERDUE', 'admin', NULL::uuid),
    ('admin.payments.disputes.overdue', 'he', 'באיחור', 'admin', NULL::uuid),

    -- Empty State
    ('admin.payments.disputes.noDisputes', 'en', 'No Disputes', 'admin', NULL::uuid),
    ('admin.payments.disputes.noDisputes', 'he', 'אין מחלוקות', 'admin', NULL::uuid),
    ('admin.payments.disputes.noDisputesDescription', 'en', 'There are no payment disputes at this time', 'admin', NULL::uuid),
    ('admin.payments.disputes.noDisputesDescription', 'he', 'אין מחלוקות תשלום בזמן זה', 'admin', NULL::uuid),

    -- Error Messages
    ('admin.payments.disputes.loadError', 'en', 'Failed to load disputes', 'admin', NULL::uuid),
    ('admin.payments.disputes.loadError', 'he', 'נכשל בטעינת מחלוקות', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidenceSuccess', 'en', 'Evidence submitted successfully', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidenceSuccess', 'he', 'ראיות הוגשו בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidenceError', 'en', 'Failed to submit evidence', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidenceError', 'he', 'נכשל בהגשת ראיות', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- ============================================================================
  -- DISPUTE DETAILS DIALOG
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.disputes.details.title', 'en', 'Dispute Details', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.title', 'he', 'פרטי מחלוקת', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.disputeId', 'en', 'Dispute ID', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.disputeId', 'he', 'מזהה מחלוקת', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.user', 'en', 'User', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.user', 'he', 'משתמש', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.product', 'en', 'Product', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.product', 'he', 'מוצר', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.amount', 'en', 'Amount', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.amount', 'he', 'סכום', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.reason', 'en', 'Reason', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.reason', 'he', 'סיבה', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.created', 'en', 'Created', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.created', 'he', 'נוצר', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.evidenceDue', 'en', 'Evidence Due', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.evidenceDue', 'he', 'מועד הגשת ראיות', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.transactionId', 'en', 'Transaction ID', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.transactionId', 'he', 'מזהה עסקה', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.evidenceSubmitted', 'en', 'Evidence Submitted', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.evidenceSubmitted', 'he', 'ראיות הוגשו', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.yes', 'en', 'Yes', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.yes', 'he', 'כן', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.no', 'en', 'No', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.no', 'he', 'לא', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.stripeAlert', 'en', 'View full dispute details and submit evidence in the Stripe Dashboard.', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.stripeAlert', 'he', 'צפה בפרטי מחלוקת מלאים והגש ראיות בלוח המחוונים של Stripe.', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.close', 'en', 'Close', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.close', 'he', 'סגור', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.openInStripe', 'en', 'Open in Stripe', 'admin', NULL::uuid),
    ('admin.payments.disputes.details.openInStripe', 'he', 'פתח ב-Stripe', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- EVIDENCE SUBMISSION DIALOG
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.disputes.evidence.title', 'en', 'Submit Dispute Evidence', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.title', 'he', 'הגש ראיות למחלוקת', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.description', 'en', 'Provide evidence to contest the dispute for {user}', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.description', 'he', 'ספק ראיות לערער על המחלוקת עבור {user}', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.deadlineAlert', 'en', 'Evidence must be submitted by {date}. Submit comprehensive evidence to increase chances of winning.', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.deadlineAlert', 'he', 'יש להגיש ראיות עד {date}. הגש ראיות מקיפות כדי להגביר את הסיכוי לזכייה.', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerName', 'en', 'Customer Name', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerName', 'he', 'שם לקוח', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerEmail', 'en', 'Customer Email', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerEmail', 'he', 'אימייל לקוח', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerPurchaseIp', 'en', 'Customer Purchase IP', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerPurchaseIp', 'he', 'כתובת IP של רכישת הלקוח', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerPurchaseIpPlaceholder', 'en', 'e.g., 192.168.1.1', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerPurchaseIpPlaceholder', 'he', 'לדוגמה, 192.168.1.1', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.receiptUrl', 'en', 'Receipt URL', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.receiptUrl', 'he', 'קישור לקבלה', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.receiptUrlPlaceholder', 'en', 'https://...', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.receiptUrlPlaceholder', 'he', 'https://...', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.productDescription', 'en', 'Product Description', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.productDescription', 'he', 'תיאור מוצר', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.productDescriptionPlaceholder', 'en', 'Detailed description of the product/service provided', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.productDescriptionPlaceholder', 'he', 'תיאור מפורט של המוצר/שירות שסופק', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerCommunication', 'en', 'Customer Communication', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerCommunication', 'he', 'תקשורת עם לקוח', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerCommunicationPlaceholder', 'en', 'Any email exchanges, support tickets, or other communications with the customer', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.customerCommunicationPlaceholder', 'he', 'כל תכתובת אימייל, פניות לתמיכה או תקשורת אחרת עם הלקוח', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.submit', 'en', 'Submit Evidence', 'admin', NULL::uuid),
    ('admin.payments.disputes.evidence.submit', 'he', 'הגש ראיות', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  RAISE NOTICE 'Payment Disputes page translations migration completed successfully - added translations';
END $$;

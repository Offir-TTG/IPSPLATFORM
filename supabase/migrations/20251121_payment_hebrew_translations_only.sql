-- ============================================================================
-- Payment System HEBREW Translations ONLY
-- ============================================================================
-- This migration adds ONLY the Hebrew translations for the payment system
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN
  -- Delete existing Hebrew payment translations (including nav)
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
  AND language_code = 'he'
  AND (translation_key LIKE 'admin.payments%' OR translation_key = 'admin.nav.payments');

  -- Insert Hebrew translations with ON CONFLICT handling
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Navigation
  (v_tenant_id, 'he', 'admin.nav.payments', 'תשלומים', 'admin', NOW(), NOW()),

  -- Payment Dashboard
  (v_tenant_id, 'he', 'admin.payments.title', 'תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.description', 'ניהול תוכניות תשלום, לוחות זמנים ועסקאות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports', 'דוחות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.paymentPlans', 'תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.totalRevenue', 'הכנסות כוללות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.activeEnrollments', 'רישומים פעילים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.pendingPayments', 'תשלומים ממתינים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.overduePayments', 'תשלומים באיחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.mrr', 'הכנסה חודשית חוזרת (MRR)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.arr', 'הכנסה שנתית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.withActivePayments', 'עם תשלומים פעילים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.scheduledUpcoming', 'מתוזמנים בקרוב', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.viewOverdue', 'צפה באיחורים ←', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.revenueFromSubscriptions', 'הכנסה ממנויים פעילים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.perMonth', '/חודש', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.perYear', '/שנה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.quickActions', 'פעולות מהירות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.recentActivity', 'פעילות אחרונה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.recentActivityDesc', 'עסקאות תשלום והתאמות אחרונות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.noRecentActivity', 'אין פעילות אחרונה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactionsWillAppear', 'עסקאות תשלום יופיעו כאן', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.fromLastMonth', 'מהחודש שעבר', 'admin', NOW(), NOW()),

  -- Coming Soon Notice
  (v_tenant_id, 'he', 'admin.payments.comingSoon.title', 'יישום מערכת תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.description', 'מערכת התשלומים נמצאת כעת בפיתוח. התכונות הבאות יהיו זמינות בקרוב:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature1', 'זיהוי אוטומטי של תוכנית תשלום על סמך כללי מוצר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature2', 'בקרות מנהל להתאמת לוח זמנים לתשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature3', 'דוחות מקיפים של הכנסות ותזרים מזומנים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature4', 'אינטגרציה עם Stripe לכל סוגי התשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature5', 'תמיכה ב: חד פעמי, מקדמה, תשלומים ומנויים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.docsTitle', 'תיעוד:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc1', 'PAYMENT_SYSTEM.md - ארכיטקטורה מלאה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc2', 'PAYMENT_SYSTEM_API.md - הפניית API', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc3', 'PAYMENT_SYSTEM_ADMIN_GUIDE.md - פעולות מנהל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc4', 'PAYMENT_INTEGRATION_GUIDE.md - אינטגרציה עם קורסים/תוכניות', 'admin', NOW(), NOW()),

  -- Quick Action Cards
  (v_tenant_id, 'he', 'admin.payments.cards.paymentPlans.title', 'תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.paymentPlans.description', 'יצירה וניהול תבניות תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.schedules.title', 'לוחות זמנים לתשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.schedules.description', 'צפייה והתאמת תאריכי תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.transactions.title', 'עסקאות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.transactions.description', 'צפייה בכל עסקאות התשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.reports.title', 'דוחות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.reports.description', 'ניתוח הכנסות ותשלומים', 'admin', NOW(), NOW()),

  -- Payment Plans Page
  (v_tenant_id, 'he', 'admin.payments.plans.title', 'תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.description', 'יצירה וניהול תבניות תוכניות תשלום לשימוש חוזר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.createPlan', 'צור תוכנית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.autoDetection', 'זיהוי אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.autoDetectionDesc', 'תוכניות תשלום עם זיהוי אוטומטי מופעל יוקצו אוטומטית למוצרים על סמך הכללים והעדיפות שלהן. תוכניות בעדיפות גבוהה יותר יוערכו ראשונות.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.priority', 'עדיפות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.enrollments', 'רישומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.preferredPlan', 'תוכנית מועדפת', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.default', 'ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.autoDetect', 'זיהוי אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.inactive', 'לא פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.noPlans', 'אין תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.noPlansDesc', 'צור את תוכנית התשלום הראשונה שלך כדי להתחיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.deleteConfirm', 'האם אתה בטוח שברצונך למחוק תוכנית תשלום זו?', 'admin', NOW(), NOW()),

  -- Plan Types
  (v_tenant_id, 'he', 'admin.payments.plans.types.oneTime', 'תשלום חד פעמי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.deposit', 'מקדמה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.installments', 'תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.subscription', 'מנוי', 'admin', NOW(), NOW()),

  -- Plan Form
  (v_tenant_id, 'he', 'admin.payments.plans.form.createTitle', 'צור תוכנית תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.editTitle', 'ערוך תוכנית תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.description', 'הגדר את הגדרות תוכנית התשלום וכללי הזיהוי האוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planName', 'שם תוכנית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planNamePlaceholder', 'לדוגמה: מקדמה 30% + 6 חודשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planDescription', 'תיאור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planDescriptionPlaceholder', 'תיאור קצר של תוכנית תשלום זו', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planType', 'סוג תוכנית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.oneTimePayment', 'תשלום חד פעמי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.depositInstallments', 'מקדמה + תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.installmentsOnly', 'תשלומים בלבד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.subscription', 'מנוי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.depositConfig', 'הגדרות מקדמה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.depositPercentage', 'אחוז מקדמה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.installmentsConfig', 'הגדרות תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.numberOfInstallments', 'מספר תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.frequency', 'תדירות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.selectFrequency', 'בחר תדירות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.weekly', 'שבועי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.biweekly', 'דו-שבועי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.monthly', 'חודשי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.quarterly', 'רבעוני', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.annually', 'שנתי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.subscriptionConfig', 'הגדרות מנוי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.billingFrequency', 'תדירות חיוב', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.settings', 'הגדרות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.priorityDesc', 'תוכניות בעדיפות גבוהה יותר יוערכו ראשונות בזמן זיהוי אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.autoDetectionEnabled', 'זיהוי אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.autoDetectionDesc', 'הקצה תוכנית זו אוטומטית על סמך כללים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.active', 'פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.activeDesc', 'תוכניות לא פעילות לא יוקצו לרישומים חדשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.defaultPlan', 'תוכנית ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.defaultPlanDesc', 'השתמש אם אין כללי זיהוי אוטומטי מתאימים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.cancel', 'ביטול', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.saveChanges', 'שמור שינויים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.createPlan', 'צור תוכנית', 'admin', NOW(), NOW()),

  -- Payment Schedules (used in reports)
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.paid', 'שולם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.partial', 'חלקי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.pending', 'ממתין', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.overdue', 'באיחור', 'admin', NOW(), NOW()),

  -- Reports Page
  (v_tenant_id, 'he', 'admin.payments.reports.title', 'דוחות תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.description', 'ניתוח ותובנות מקיפים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.export', 'ייצוא', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.today', 'היום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last7Days', '7 ימים אחרונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last30Days', '30 ימים אחרונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last90Days', '90 ימים אחרונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.thisYear', 'השנה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.customRange', 'טווח מותאם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.avgTransaction', 'ממוצע עסקה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.arrDescription', 'הכנסה שנתית חוזרת', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueTrend', 'מגמת הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueTrendDescription', 'הכנסות יומיות בתקופה שנבחרה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByType', 'הכנסות לפי סוג תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByTypeDescription', 'פירוט מקורות הכנסה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueDistribution', 'התפלגות הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueDistributionDescription', 'סכום לפי סוג תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.mrrGrowth', 'צמיחת MRR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.mrrGrowthDescription', 'פירוט הכנסה חודשית חוזרת', 'admin', NOW(), NOW()),

  -- Report Tabs
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.revenue', 'הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.status', 'סטטוס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.cashflow', 'תזרים מזומנים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.products', 'מוצרים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.users', 'משתמשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.plans', 'תוכניות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.operational', 'תפעולי', 'admin', NOW(), NOW()),

  -- Revenue Report
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.totalRevenue', 'הכנסות כוללות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.avgTransaction', 'ממוצע עסקה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.revenueTrend', 'מגמת הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.dailyRevenue', 'הכנסות יומיות בתקופה שנבחרה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.byType', 'הכנסות לפי סוג תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.breakdown', 'פירוט מקורות הכנסה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.distribution', 'התפלגות הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.amountByType', 'סכום לפי סוג תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.mrrGrowth', 'צמיחת MRR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.mrrBreakdown', 'פירוט הכנסה חודשית חוזרת', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.newMRR', 'MRR חדש', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.expansion', 'הרחבה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.churn', 'נטישה', 'admin', NOW(), NOW()),

  -- Status Report
  (v_tenant_id, 'he', 'admin.payments.reports.status.paid', 'שולם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.partial', 'חלקי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.pending', 'ממתין', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.overdue', 'באיחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.distribution', 'התפלגות סטטוס תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.byCount', 'לפי מספר רישומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.completionRate', 'שיעור השלמת תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.paymentHealth', 'בריאות תשלום כללית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.onTime', 'בזמן', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.late', 'מאוחר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.default', 'ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.overdueAging', 'הזדקנות תשלומים באיחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.daysOverdue', 'התפלגות ימי איחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.overduePayments', 'תשלומים באיחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.requiresAttention', 'תשלומים הדורשים תשומת לב', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.daysOverdueCount', 'ימים באיחור', 'admin', NOW(), NOW())
  ON CONFLICT (tenant_id, language_code, translation_key)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    context = EXCLUDED.context,
    updated_at = NOW();

  RAISE NOTICE 'Hebrew payment system translations added successfully for tenant: %', v_tenant_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding Hebrew payment translations: %', SQLERRM;
    RAISE;
END $$;

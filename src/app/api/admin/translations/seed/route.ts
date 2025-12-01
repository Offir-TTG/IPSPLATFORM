import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/translations/seed
 * Seeds admin.payments translations into the database
 * Only accessible by admin users
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const tenantId = userData.tenant_id;

    // Delete existing admin.payments translations to avoid duplicates
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .eq('tenant_id', tenantId)
      .like('translation_key', 'admin.payments%')
      .eq('context', 'admin');

    if (deleteError) {
      console.error('Error deleting old translations:', deleteError);
    }

    // Define all translations
    const translations = [
      // Main Page Header
      { key: 'admin.payments.title', en: 'Payments', he: 'תשלומים' },
      { key: 'admin.payments.description', en: 'Manage payments, schedules, and billing', he: 'ניהול תשלומים, לוחות זמנים וחשבוניות' },
      { key: 'admin.payments.reports', en: 'Reports', he: 'דוחות' },
      { key: 'admin.payments.paymentPlans', en: 'Payment Plans', he: 'תוכניות תשלום' },

      // Stats Cards
      { key: 'admin.payments.totalRevenue', en: 'Total Revenue', he: 'הכנסות כוללות' },
      { key: 'admin.payments.fromLastMonth', en: 'from last month', he: 'מהחודש שעבר' },
      { key: 'admin.payments.activeEnrollments', en: 'Active Enrollments', he: 'הרשמות פעילות' },
      { key: 'admin.payments.withActivePayments', en: 'with active payment plans', he: 'עם תוכניות תשלום פעילות' },
      { key: 'admin.payments.pendingPayments', en: 'Pending Payments', he: 'תשלומים ממתינים' },
      { key: 'admin.payments.scheduledUpcoming', en: 'scheduled upcoming', he: 'מתוזמנים לעתיד' },
      { key: 'admin.payments.overduePayments', en: 'Overdue Payments', he: 'תשלומים באיחור' },
      { key: 'admin.payments.viewOverdue', en: 'View Overdue', he: 'צפה באיחורים' },

      // Pending Amount Card
      { key: 'admin.payments.pendingAmount', en: 'Pending Amount', he: 'סכום ממתין' },
      { key: 'admin.payments.pendingAmount.description', en: 'Total amount in pending payments', he: 'סכום כולל בתשלומים ממתינים' },
      { key: 'admin.payments.pendingAmount.fromPayments', en: 'From {count} scheduled payments', he: 'מתוך {count} תשלומים מתוזמנים' },

      // Quick Action Cards
      { key: 'admin.payments.cards.products.title', en: 'Products', he: 'מוצרים' },
      { key: 'admin.payments.cards.products.description', en: 'Manage billable products and pricing', he: 'ניהול מוצרים לחיוב ותמחור' },
      { key: 'admin.payments.cards.paymentPlans.title', en: 'Payment Plans', he: 'תוכניות תשלום' },
      { key: 'admin.payments.cards.paymentPlans.description', en: 'Configure and manage payment plans', he: 'הגדרה וניהול תוכניות תשלום' },
      { key: 'admin.payments.cards.schedules.title', en: 'Schedules', he: 'לוחות זמנים' },
      { key: 'admin.payments.cards.schedules.description', en: 'View and manage payment schedules', he: 'צפייה וניהול לוחות זמני תשלומים' },
      { key: 'admin.payments.cards.transactions.title', en: 'Transactions', he: 'עסקאות' },
      { key: 'admin.payments.cards.transactions.description', en: 'View transaction history and refunds', he: 'צפייה בהיסטוריית עסקאות והחזרים' },
      { key: 'admin.payments.cards.disputes.title', en: 'Disputes', he: 'מחלוקות' },
      { key: 'admin.payments.cards.disputes.description', en: 'Handle payment disputes and chargebacks', he: 'טיפול במחלוקות תשלום והחזרי חיוב' },
      { key: 'admin.payments.cards.enrollments.title', en: 'Enrollments', he: 'הרשמות' },
      { key: 'admin.payments.cards.enrollments.description', en: 'Manage user enrollments and payments', he: 'ניהול הרשמות משתמשים ותשלומים' },
      { key: 'admin.payments.cards.reports.title', en: 'Reports', he: 'דוחות' },
      { key: 'admin.payments.cards.reports.description', en: 'View payment reports and analytics', he: 'צפייה בדוחות תשלומים וניתוחים' },

      // Recent Activity
      { key: 'admin.payments.recentActivity', en: 'Recent Activity', he: 'פעילות אחרונה' },
      { key: 'admin.payments.recentActivityDesc', en: 'Latest payment transactions and updates', he: 'עסקאות ועדכוני תשלום אחרונים' },
      { key: 'admin.payments.noRecentActivity', en: 'No recent activity', he: 'אין פעילות אחרונה' },
      { key: 'admin.payments.transactionsWillAppear', en: 'Recent transactions will appear here', he: 'עסקאות אחרונות יופיעו כאן' },

      // Coming Soon
      { key: 'admin.payments.comingSoon.title', en: 'Payment System - Coming Soon', he: 'מערכת תשלומים - בקרוב' },
      { key: 'admin.payments.comingSoon.description', en: "The full payment system is being finalized. Here's what's coming:", he: 'מערכת התשלומים המלאה מסתיימת. הנה מה שמגיע:' },
      { key: 'admin.payments.comingSoon.feature1', en: 'Automated payment scheduling and processing', he: 'תזמון ועיבוד תשלומים אוטומטי' },
      { key: 'admin.payments.comingSoon.feature2', en: 'Flexible payment plans (full, installments, deposits)', he: 'תוכניות תשלום גמישות (מלא, תשלומים, פיקדונות)' },
      { key: 'admin.payments.comingSoon.feature3', en: 'Stripe integration for secure payments', he: 'אינטגרציה עם Stripe לתשלומים מאובטחים' },
      { key: 'admin.payments.comingSoon.feature4', en: 'Comprehensive reporting and analytics', he: 'דיווח וניתוח מקיפים' },
      { key: 'admin.payments.comingSoon.feature5', en: 'Automated payment reminders and notifications', he: 'תזכורות והודעות תשלום אוטומטיות' },
      { key: 'admin.payments.comingSoon.docsTitle', en: 'Documentation:', he: 'תיעוד:' },
      { key: 'admin.payments.comingSoon.doc1', en: 'Payment System Overview', he: 'סקירת מערכת התשלומים' },
      { key: 'admin.payments.comingSoon.doc2', en: 'Payment System API', he: 'API מערכת התשלומים' },
      { key: 'admin.payments.comingSoon.doc3', en: 'Admin Guide', he: 'מדריך למנהל' },
      { key: 'admin.payments.comingSoon.doc4', en: 'Integration Guide', he: 'מדריך אינטגרציה' },
    ];

    // Prepare insert data (English and Hebrew for each translation)
    const insertData = translations.flatMap(t => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: t.key,
        translation_value: t.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: t.key,
        translation_value: t.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Insert translations in batches (Supabase has a limit)
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('translations')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        return NextResponse.json(
          { error: `Failed to insert translations: ${insertError.message}` },
          { status: 500 }
        );
      }

      insertedCount += batch.length;
    }

    // Clear translation cache
    await fetch('/api/translations', { method: 'POST' });

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedCount} translations (${translations.length} keys × 2 languages)`,
      tenant_id: tenantId,
      keys_count: translations.length,
      translations_count: insertedCount,
    });

  } catch (error) {
    console.error('Error seeding translations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

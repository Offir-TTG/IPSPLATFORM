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
  // Main titles
  { key: 'admin.dashboard.title', en: 'Dashboard', he: 'לוח בקרה' },
  { key: 'admin.dashboard.subtitle', en: 'Your platform overview at a glance', he: 'סקירה כללית של הפלטפורמה שלך במבט אחד' },
  { key: 'admin.dashboard.error', en: 'Failed to load dashboard data', he: 'טעינת נתוני לוח הבקרה נכשלה' },

  // Financial Overview
  { key: 'admin.dashboard.financial', en: 'Financial Overview', he: 'סקירה פיננסית' },
  { key: 'admin.dashboard.totalRevenue', en: 'Total Revenue', he: 'סך הכנסות' },
  { key: 'admin.dashboard.allTime', en: 'All time', he: 'כל הזמנים' },
  { key: 'admin.dashboard.monthRevenue', en: 'This Month', he: 'החודש' },
  { key: 'admin.dashboard.fromLastMonth', en: 'from last month', he: 'מהחודש שעבר' },
  { key: 'admin.dashboard.pendingPayments', en: 'Pending Payments', he: 'תשלומים ממתינים' },
  { key: 'admin.dashboard.expected', en: 'Expected revenue', he: 'הכנסה צפויה' },
  { key: 'admin.dashboard.overduePayments', en: 'Overdue', he: 'באיחור' },
  { key: 'admin.dashboard.payments', en: 'payments', he: 'תשלומים' },

  // Enrollments
  { key: 'admin.dashboard.enrollments', en: 'Enrollments', he: 'הרשמות' },
  { key: 'admin.dashboard.totalEnrollments', en: 'Total', he: 'סה"כ' },
  { key: 'admin.dashboard.activeEnrollments', en: 'Active', he: 'פעילות' },
  { key: 'admin.dashboard.activeNow', en: 'Active now', he: 'פעילות כעת' },
  { key: 'admin.dashboard.pendingEnrollments', en: 'Pending', he: 'ממתינות' },
  { key: 'admin.dashboard.awaitingAction', en: 'Awaiting action', he: 'ממתינות לפעולה' },
  { key: 'admin.dashboard.draftEnrollments', en: 'Drafts', he: 'טיוטות' },
  { key: 'admin.dashboard.invitationsPending', en: 'Invitations sent', he: 'הזמנות שנשלחו' },

  // Users
  { key: 'admin.dashboard.users', en: 'Users', he: 'משתמשים' },
  { key: 'admin.dashboard.totalUsers', en: 'Total Users', he: 'סך משתמשים' },
  { key: 'admin.dashboard.thisMonth', en: 'this month', he: 'החודש' },
  { key: 'admin.dashboard.students', en: 'Students', he: 'סטודנטים' },
  { key: 'admin.dashboard.regularUsers', en: 'Regular users', he: 'משתמשים רגילים' },
  { key: 'admin.dashboard.instructors', en: 'Instructors', he: 'מדריכים' },
  { key: 'admin.dashboard.teachers', en: 'Teachers', he: 'מורים' },
  { key: 'admin.dashboard.admins', en: 'Admins', he: 'מנהלים' },
  { key: 'admin.dashboard.platformAdmins', en: 'Platform admins', he: 'מנהלי מערכת' },

  // LMS & Products
  { key: 'admin.dashboard.programs', en: 'Programs', he: 'תוכניות' },
  { key: 'admin.dashboard.courses', en: 'Courses', he: 'קורסים' },
  { key: 'admin.dashboard.active', en: 'active', he: 'פעילים' },
  { key: 'admin.dashboard.upcomingSessions', en: 'Upcoming Sessions', he: 'מפגשים קרובים' },
  { key: 'admin.dashboard.nextWeek', en: 'Next 7 days', he: '7 הימים הקרובים' },
  { key: 'admin.dashboard.products', en: 'Products', he: 'מוצרים' },
  { key: 'admin.dashboard.paid', en: 'paid', he: 'בתשלום' },
  { key: 'admin.dashboard.free', en: 'free', he: 'חינם' },
  { key: 'admin.dashboard.paymentPlans', en: 'Payment Plans', he: 'תוכניות תשלום' },

  // Recent Activity
  { key: 'admin.dashboard.recentEnrollments', en: 'Recent Enrollments', he: 'הרשמות אחרונות' },
  { key: 'admin.dashboard.latest5Enrollments', en: 'Latest 5 enrollments', he: '5 ההרשמות האחרונות' },
  { key: 'admin.dashboard.noRecentEnrollments', en: 'No recent enrollments', he: 'אין הרשמות אחרונות' },
  { key: 'admin.dashboard.viewAllEnrollments', en: 'View all enrollments →', he: 'צפה בכל ההרשמות ←' },
  { key: 'admin.dashboard.recentPayments', en: 'Recent Payments', he: 'תשלומים אחרונים' },
  { key: 'admin.dashboard.latest5Payments', en: 'Latest 5 payments received', he: '5 התשלומים האחרונים שהתקבלו' },
  { key: 'admin.dashboard.noRecentPayments', en: 'No recent payments', he: 'אין תשלומים אחרונים' },
  { key: 'admin.dashboard.viewAllPayments', en: 'View all payments →', he: 'צפה בכל התשלומים ←' },

  // Quick Actions
  { key: 'admin.dashboard.quickActions', en: 'Quick Actions', he: 'פעולות מהירות' },
  { key: 'admin.dashboard.manageEnrollments', en: 'Manage Enrollments', he: 'ניהול הרשמות' },
  { key: 'admin.dashboard.manageProducts', en: 'Manage Products', he: 'ניהול מוצרים' },
  { key: 'admin.dashboard.viewTransactions', en: 'View Transactions', he: 'צפה בעסקאות' },
  { key: 'admin.dashboard.manageUsers', en: 'Manage Users', he: 'ניהול משתמשים' },
];

async function addTranslations() {
  try {
    console.log('Adding dashboard translations...\n');

    // Get tenant_id (assuming first tenant for now)
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.error('No tenants found');
      return;
    }

    const tenantId = tenants[0].id;
    console.log(`Using tenant ID: ${tenantId}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const translation of translations) {
      try {
        // Add English translation
        // Determine category from key (first part)
        const parts = translation.key.split('.');
        const category = parts[0]; // e.g., 'admin', 'common'
        const context = 'admin'; // All dashboard translations are admin context

        const { error: enError } = await supabase.rpc('upsert_translation', {
          p_language_code: 'en',
          p_translation_key: translation.key,
          p_translation_value: translation.en,
          p_category: category,
          p_context: context,
          p_tenant_id: tenantId,
        });

        if (enError) {
          console.error(`Error adding EN for ${translation.key}:`, enError.message);
          errorCount++;
          continue;
        }

        // Add Hebrew translation
        const { error: heError } = await supabase.rpc('upsert_translation', {
          p_language_code: 'he',
          p_translation_key: translation.key,
          p_translation_value: translation.he,
          p_category: category,
          p_context: context,
          p_tenant_id: tenantId,
        });

        if (heError) {
          console.error(`Error adding HE for ${translation.key}:`, heError.message);
          errorCount++;
          continue;
        }

        console.log(`✓ ${translation.key}`);
        console.log(`  EN: ${translation.en}`);
        console.log(`  HE: ${translation.he}`);
        successCount++;
      } catch (err) {
        console.error(`Error processing ${translation.key}:`, err);
        errorCount++;
      }
    }

    console.log(`\n✅ Successfully added ${successCount} translations`);
    if (errorCount > 0) {
      console.log(`❌ Failed to add ${errorCount} translations`);
    }
    console.log(`\nTotal translation keys: ${translations.length}`);
  } catch (error) {
    console.error('Error adding translations:', error);
  }
}

addTranslations();

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
  // Navigation Section Titles
  { key: 'admin.nav.overview', en: 'Overview', he: 'סקירה כללית' },
  { key: 'admin.nav.learning', en: 'Learning', he: 'למידה' },
  { key: 'admin.nav.users_access', en: 'Users & Access', he: 'משתמשים וגישה' },
  { key: 'admin.nav.configuration', en: 'Configuration', he: 'הגדרות' },
  { key: 'admin.nav.business', en: 'Business', he: 'עסקים' },
  { key: 'admin.nav.security', en: 'Security', he: 'אבטחה' },
  { key: 'admin.nav.keap', en: 'Keap CRM', he: 'Keap CRM' },

  // Navigation Items - Overview
  { key: 'admin.nav.dashboard', en: 'Dashboard', he: 'לוח בקרה' },

  // Navigation Items - Learning
  { key: 'admin.nav.lms_programs', en: 'Programs', he: 'תוכניות' },
  { key: 'admin.nav.lms_courses', en: 'Courses', he: 'קורסים' },
  { key: 'admin.nav.enrollments', en: 'Enrollments', he: 'הרשמות' },
  { key: 'admin.nav.grading', en: 'Grading', he: 'ציונים' },

  // Navigation Items - Users & Access
  { key: 'admin.nav.users', en: 'Users', he: 'משתמשים' },

  // Navigation Items - Configuration
  { key: 'admin.nav.languages', en: 'Languages', he: 'שפות' },
  { key: 'admin.nav.translations', en: 'Translations', he: 'תרגומים' },
  { key: 'admin.nav.settings', en: 'Settings', he: 'הגדרות' },
  { key: 'admin.nav.theme', en: 'Theme', he: 'ערכת נושא' },
  { key: 'admin.nav.features', en: 'Features', he: 'תכונות' },
  { key: 'admin.nav.integrations', en: 'Integrations', he: 'אינטגרציות' },
  { key: 'admin.nav.navigation', en: 'Navigation', he: 'ניווט' },
  { key: 'admin.nav.emails', en: 'Emails', he: 'דוא"ל' },

  // Navigation Items - Business
  { key: 'admin.nav.payments', en: 'Payments', he: 'תשלומים' },

  // Navigation Items - Security
  { key: 'admin.nav.audit', en: 'Audit Log', he: 'יומן ביקורת' },

  // Navigation Items - Keap
  { key: 'admin.nav.keap.dashboard', en: 'Keap Dashboard', he: 'לוח בקרה Keap' },

  // User Menu Items
  { key: 'admin.nav.profile', en: 'Profile & Settings', he: 'פרופיל והגדרות' },
  { key: 'admin.nav.manageAccount', en: 'Manage your account', he: 'נהל את החשבון שלך' },
  { key: 'admin.nav.organization', en: 'Organization', he: 'ארגון' },
  { key: 'admin.nav.organizationSettings', en: 'Manage organization', he: 'נהל ארגון' },
  { key: 'admin.nav.auditLog', en: 'Audit Log', he: 'יומן ביקורת' },
  { key: 'admin.nav.viewActivity', en: 'View activity logs', he: 'צפה ביומני פעילות' },

  // General
  { key: 'admin.title', en: 'Admin Panel', he: 'פאנל ניהול' },
  { key: 'admin.subtitle', en: 'Control Panel', he: 'לוח בקרה' },
  { key: 'platform.name', en: 'Admin', he: 'ניהול' },

  // Logout
  { key: 'nav.logout', en: 'Log out', he: 'התנתק' },
  { key: 'nav.signOut', en: 'Sign out of your account', he: 'התנתק מהחשבון שלך' },
];

async function addTranslations() {
  try {
    console.log('Adding admin navigation translations...\n');

    // Get tenant_id
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
        // Determine category from key (first part)
        const parts = translation.key.split('.');
        const category = parts[0];
        const context = 'admin';

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

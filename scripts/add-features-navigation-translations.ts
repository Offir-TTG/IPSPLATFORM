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
  // Features Page
  { key: 'features.title', en: 'Feature Flags', he: 'דגלי תכונות' },
  { key: 'features.subtitle', en: 'Enable or disable platform features', he: 'הפעל או השבת תכונות פלטפורמה' },
  { key: 'features.loadError', en: 'Failed to load feature flags', he: 'טעינת דגלי התכונות נכשלה' },
  { key: 'features.saveSuccess', en: 'Feature flags updated successfully', he: 'דגלי התכונות עודכנו בהצלחה' },
  { key: 'features.saveError', en: 'Failed to save feature flags', he: 'שמירת דגלי התכונות נכשלה' },

  // Feature Flags
  { key: 'features.lms.enabled', en: 'Learning Management', he: 'ניהול למידה' },
  { key: 'features.lms.enabled.description', en: 'Enable Learning Management System (Programs, Courses, Sessions)', he: 'הפעל מערכת ניהול למידה (תוכניות, קורסים, מפגשים)' },
  { key: 'features.payments.enabled', en: 'Payments', he: 'תשלומים' },
  { key: 'features.payments.enabled.description', en: 'Enable payment processing and billing features', he: 'הפעל עיבוד תשלומים ותכונות חיוב' },
  { key: 'features.enrollments.enabled', en: 'Enrollments', he: 'הרשמות' },
  { key: 'features.enrollments.enabled.description', en: 'Enable enrollment management and tracking', he: 'הפעל ניהול ומעקב הרשמות' },
  { key: 'features.emails.enabled', en: 'Email Notifications', he: 'התראות דוא"ל' },
  { key: 'features.emails.enabled.description', en: 'Enable email notifications and templates', he: 'הפעל התראות דוא"ל ותבניות' },
  { key: 'features.calendar.enabled', en: 'Calendar', he: 'לוח שנה' },
  { key: 'features.calendar.enabled.description', en: 'Enable calendar and scheduling features', he: 'הפעל תכונות לוח שנה ותזמון' },
  { key: 'features.video.enabled', en: 'Video Conferencing', he: 'ועידת וידאו' },
  { key: 'features.video.enabled.description', en: 'Enable video conferencing integration (Zoom, Daily.co)', he: 'הפעל אינטגרציית ועידות וידאו (Zoom, Daily.co)' },
  { key: 'features.audit.enabled', en: 'Audit Logging', he: 'רישום ביקורת' },
  { key: 'features.audit.enabled.description', en: 'Enable audit logging and security tracking', he: 'הפעל רישום ביקורת ומעקב אבטחה' },
  { key: 'features.grading.enabled', en: 'Grading', he: 'ציונים' },
  { key: 'features.grading.enabled.description', en: 'Enable grading and assessment features', he: 'הפעל תכונות ציונים והערכה' },

  // Features Warning
  { key: 'features.warning.title', en: 'Important Notice', he: 'הודעה חשובה' },
  { key: 'features.warning.description', en: 'Disabling features may affect existing functionality and user experience. Make sure to test changes in a staging environment first.', he: 'השבתת תכונות עלולה להשפיע על פונקציונליות קיימת וחוויית משתמש. וודא לבדוק שינויים בסביבת בדיקה תחילה.' },

  // Navigation Page
  { key: 'navigation.title', en: 'Navigation Configuration', he: 'הגדרות ניווט' },
  { key: 'navigation.subtitle', en: 'Customize the admin sidebar navigation', he: 'התאם אישית את ניווט תפריט המנהל' },
  { key: 'navigation.loadError', en: 'Failed to load navigation config', he: 'טעינת הגדרות הניווט נכשלה' },
  { key: 'navigation.saveSuccess', en: 'Navigation config updated successfully', he: 'הגדרות הניווט עודכנו בהצלחה' },
  { key: 'navigation.saveError', en: 'Failed to save navigation config', he: 'שמירת הגדרות הניווט נכשלה' },
  { key: 'navigation.visible', en: 'Visible', he: 'גלוי' },
  { key: 'navigation.hidden', en: 'Hidden', he: 'מוסתר' },
  { key: 'navigation.info.title', en: 'Navigation Configuration', he: 'הגדרות ניווט' },
  { key: 'navigation.info.description', en: 'Configure the order and visibility of navigation items in the admin sidebar. Changes will apply immediately after saving.', he: 'הגדר את הסדר והנראות של פריטי הניווט בתפריט המנהל. השינויים יחולו מיד לאחר השמירה.' },

  // Common
  { key: 'common.saveChanges', en: 'Save Changes', he: 'שמור שינויים' },
];

async function addTranslations() {
  try {
    console.log('Adding features and navigation translations...\n');

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

/**
 * Add Email Queue Hebrew Translations
 * Adds comprehensive Hebrew translations for the email queue page
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
  category: string;
}

const translations: Translation[] = [
  // Email Queue Page - Main Headers
  { key: 'emails.queue.title', en: 'Email Queue', he: 'תור דוא"ל', category: 'emails' },
  { key: 'emails.queue.description', en: 'View and manage pending and sent emails', he: 'צפה ונהל דוא"ל ממתין ונשלח', category: 'emails' },
  { key: 'emails.queue.emails', en: 'Emails', he: 'הודעות דוא"ל', category: 'emails' },
  { key: 'emails.queue.no_emails', en: 'No emails found', he: 'לא נמצאו הודעות דוא"ל', category: 'emails' },

  // Search and Filters
  { key: 'emails.queue.search', en: 'Search by email or subject...', he: 'חיפוש לפי כתובת דוא"ל או נושא...', category: 'emails' },
  { key: 'emails.filter.all_statuses', en: 'All Statuses', he: 'כל הסטטוסים', category: 'emails' },
  { key: 'emails.filter.all_priorities', en: 'All Priorities', he: 'כל העדיפויות', category: 'emails' },

  // Status Labels
  { key: 'emails.status.pending', en: 'Pending', he: 'ממתין', category: 'emails' },
  { key: 'emails.status.processing', en: 'Processing', he: 'בעיבוד', category: 'emails' },
  { key: 'emails.status.sent', en: 'Sent', he: 'נשלח', category: 'emails' },
  { key: 'emails.status.failed', en: 'Failed', he: 'נכשל', category: 'emails' },
  { key: 'emails.status.cancelled', en: 'Cancelled', he: 'בוטל', category: 'emails' },
  { key: 'emails.status.expired', en: 'Expired', he: 'פג תוקף', category: 'emails' },

  // Priority Labels
  { key: 'emails.priority.urgent', en: 'Urgent', he: 'דחוף', category: 'emails' },
  { key: 'emails.priority.high', en: 'High', he: 'גבוה', category: 'emails' },
  { key: 'emails.priority.normal', en: 'Normal', he: 'רגיל', category: 'emails' },
  { key: 'emails.priority.low', en: 'Low', he: 'נמוך', category: 'emails' },

  // Table Column Headers
  { key: 'emails.queue.recipient', en: 'Recipient', he: 'נמען', category: 'emails' },
  { key: 'emails.queue.subject', en: 'Subject', he: 'נושא', category: 'emails' },
  { key: 'emails.queue.status', en: 'Status', he: 'סטטוס', category: 'emails' },
  { key: 'emails.queue.priority', en: 'Priority', he: 'עדיפות', category: 'emails' },
  { key: 'emails.queue.created', en: 'Created', he: 'נוצר', category: 'emails' },
  { key: 'emails.queue.sent', en: 'Sent', he: 'נשלח', category: 'emails' },

  // Email Detail Modal
  { key: 'emails.queue.to', en: 'To', he: 'אל', category: 'emails' },
  { key: 'emails.queue.name', en: 'Name', he: 'שם', category: 'emails' },
  { key: 'emails.queue.failed', en: 'Failed', he: 'נכשל', category: 'emails' },
  { key: 'emails.queue.error', en: 'Error', he: 'שגיאה', category: 'emails' },
  { key: 'emails.queue.html_preview', en: 'Email Preview', he: 'תצוגה מקדימה', category: 'emails' },
  { key: 'emails.queue.view', en: 'View pending and sent emails', he: 'צפה בהודעות דוא"ל ממתינות ונשלחות', category: 'emails' },

  // Common Actions
  { key: 'common.actions', en: 'Actions', he: 'פעולות', category: 'common' },
  { key: 'common.refresh', en: 'Refresh', he: 'רענן', category: 'common' },
  { key: 'common.page', en: 'Page', he: 'עמוד', category: 'common' },
  { key: 'common.of', en: 'of', he: 'מתוך', category: 'common' },
  { key: 'common.previous', en: 'Previous', he: 'הקודם', category: 'common' },
  { key: 'common.next', en: 'Next', he: 'הבא', category: 'common' },

  // Email Dashboard Stats
  { key: 'emails.dashboard.stats.sent', en: 'Emails Sent', he: 'דוא"ל נשלח', category: 'emails' },
  { key: 'emails.dashboard.stats.pending', en: 'Last 30 days', he: '30 ימים אחרונים', category: 'emails' },
  { key: 'emails.dashboard.open_rate', en: 'Open Rate', he: 'שיעור פתיחה', category: 'emails' },
  { key: 'emails.dashboard.stats.opened', en: 'Average', he: 'ממוצע', category: 'emails' },
  { key: 'emails.dashboard.title', en: 'Email Dashboard', he: 'לוח בקרה דוא"ל', category: 'emails' },
  { key: 'emails.dashboard.overview', en: 'Manage email templates, view analytics, and configure automated sending', he: 'נהל תבניות דוא"ל, צפה בניתוחים והגדר שליחה אוטומטית', category: 'emails' },

  // Email Templates
  { key: 'emails.templates.title', en: 'Email Templates', he: 'תבניות דוא"ל', category: 'emails' },
  { key: 'emails.templates.description', en: 'Manage email templates and customize messages', he: 'נהל תבניות דוא"ל והתאם אישית הודעות', category: 'emails' },
  { key: 'emails.templates.is_system', en: 'Active templates', he: 'תבניות פעילות', category: 'emails' },
  { key: 'emails.templates.customize', en: 'Customize Templates', he: 'התאמה אישית של תבניות', category: 'emails' },
  { key: 'emails.templates.customize_description', en: 'Edit the system templates or create your own custom templates', he: 'ערוך תבניות מערכת או צור תבניות מותאמות אישית משלך', category: 'emails' },

  // Email Analytics
  { key: 'emails.analytics.title', en: 'Email Analytics', he: 'ניתוחי דוא"ל', category: 'emails' },
  { key: 'emails.analytics.performance', en: 'Track email performance and engagement', he: 'עקוב אחר ביצועי דוא"ל ומעורבות', category: 'emails' },
  { key: 'emails.analytics.monitor', en: 'Monitor Performance', he: 'עקוב אחר ביצועים', category: 'emails' },
  { key: 'emails.analytics.monitor_description', en: 'Track open rates, click rates, and engagement in Email Analytics', he: 'עקוב אחר שיעורי פתיחה, קליקים ומעורבות בניתוח דוא"ל', category: 'emails' },

  // Email Triggers
  { key: 'emails.triggers.title', en: 'Email Triggers', he: 'טריגרים לדוא"ל', category: 'emails' },
  { key: 'emails.triggers.create', en: 'Automated email triggers for events', he: 'טריגרים אוטומטיים לדוא"ל עבור אירועים', category: 'emails' },
  { key: 'emails.triggers.setup', en: 'Set Up Triggers', he: 'הגדרת טריגרים', category: 'emails' },
  { key: 'emails.triggers.setup_description', en: 'Create automated triggers for enrollment confirmations, payment receipts, and more', he: 'צור טריגרים אוטומטיים לאישורי הרשמה, קבלות תשלום ועוד', category: 'emails' },

  // Email Schedules
  { key: 'emails.schedules.title', en: 'Email Schedules', he: 'לוחות זמנים לדוא"ל', category: 'emails' },
  { key: 'emails.schedules.create', en: 'Schedule email campaigns', he: 'תזמן קמפיינים של דוא"ל', category: 'emails' },

  // Email Settings
  { key: 'emails.settings.title', en: 'Email Settings', he: 'הגדרות דוא"ל', category: 'emails' },
  { key: 'emails.settings.smtp', en: 'Configure SMTP and email settings', he: 'הגדר SMTP והגדרות דוא"ל', category: 'emails' },
  { key: 'emails.settings.configure', en: 'Configure SMTP Settings', he: 'הגדרת SMTP', category: 'emails' },
  { key: 'emails.settings.configure_description', en: 'Set up your SMTP server in Email Settings to enable sending', he: 'הגדר את שרת ה-SMTP בהגדרות הדוא"ל כדי לאפשר שליחה', category: 'emails' },
];

async function addTranslations() {
  console.log('Starting to add email queue translations...\n');

  // Get tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (tenantError || !tenants || tenants.length === 0) {
    console.error('❌ Error fetching tenant:', tenantError);
    return;
  }

  const tenantId = tenants[0].id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const translation of translations) {
    try {
      console.log(`Processing: ${translation.key}`);

      // Check English
      const { data: existingEN } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .maybeSingle();

      if (!existingEN) {
        const { error } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            language_code: 'en',
            translation_key: translation.key,
            translation_value: translation.en,
            category: translation.category,
            context: 'admin'
          });

        if (error) {
          console.error(`  ❌ Error adding EN:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Added EN: "${translation.en}"`);
          successCount++;
        }
      } else {
        console.log(`  ⏭️  Skipped EN (exists)`);
        skippedCount++;
      }

      // Check Hebrew
      const { data: existingHE } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .maybeSingle();

      if (!existingHE) {
        const { error } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            language_code: 'he',
            translation_key: translation.key,
            translation_value: translation.he,
            category: translation.category,
            context: 'admin'
          });

        if (error) {
          console.error(`  ❌ Error adding HE:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Added HE: "${translation.he}"`);
          successCount++;
        }
      } else {
        console.log(`  ⏭️  Skipped HE (exists)`);
        skippedCount++;
      }

      console.log(''); // Empty line between translations

    } catch (error) {
      console.error(`❌ Unexpected error for ${translation.key}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`⏭️  Skipped (existing): ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${translations.length * 2} (EN + HE)`);
  console.log('='.repeat(50));
}

addTranslations()
  .then(() => {
    console.log('\n✅ Translation addition complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

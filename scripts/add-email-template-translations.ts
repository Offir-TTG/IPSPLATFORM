/**
 * Add Hebrew translations for notification email template
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Email template page headings (using the correct pattern: replace . with _)
  {
    key: 'email_template.notification_generic.name',
    en: 'Generic Notification',
    he: 'התראה כללית',
  },
  {
    key: 'email_template.notification_generic.description',
    en: 'Generic template for in-app notifications sent via email',
    he: 'תבנית כללית להתראות בתוך האפליקציה הנשלחות באימייל',
  },

  // Email template variables
  {
    key: 'admin.emailTemplates.variables.userName',
    en: 'User first name',
    he: 'שם פרטי של המשתמש',
  },
  {
    key: 'admin.emailTemplates.variables.notificationTitle',
    en: 'Notification title from admin',
    he: 'כותרת ההתראה מהמנהל',
  },
  {
    key: 'admin.emailTemplates.variables.notificationMessage',
    en: 'Notification message from admin',
    he: 'הודעת ההתראה מהמנהל',
  },
  {
    key: 'admin.emailTemplates.variables.priority',
    en: 'Notification priority',
    he: 'עדיפות ההתראה',
  },
  {
    key: 'admin.emailTemplates.variables.category',
    en: 'Notification category',
    he: 'קטגוריית ההתראה',
  },
  {
    key: 'admin.emailTemplates.variables.actionUrl',
    en: 'Link to relevant action',
    he: 'קישור לפעולה הרלוונטית',
  },
  {
    key: 'admin.emailTemplates.variables.actionLabel',
    en: 'Action button label',
    he: 'תווית כפתור הפעולה',
  },
  {
    key: 'admin.emailTemplates.variables.organizationName',
    en: 'Organization name',
    he: 'שם הארגון',
  },

  // Email content translations (for the template preview)
  {
    key: 'email.notification.urgentBadge',
    en: 'Urgent Notification',
    he: 'התראה דחופה',
  },
  {
    key: 'email.notification.highPriorityBadge',
    en: 'High Priority',
    he: 'עדיפות גבוהה',
  },
  {
    key: 'email.notification.greeting',
    en: 'Hello',
    he: 'שלום',
  },
  {
    key: 'email.notification.viewDetails',
    en: 'View Details',
    he: 'צפה בפרטים',
  },
  {
    key: 'email.notification.footer',
    en: 'This is an automated notification from your learning platform.',
    he: 'זוהי התראה אוטומטית מפלטפורמת הלמידה שלך.',
  },
];

async function addTranslations() {
  console.log('\n🌍 Adding email template translations...\n');

  try {
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name');

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`📋 Found ${tenants?.length || 0} tenants\n`);

    for (const tenant of tenants || []) {
      console.log(`🏢 Processing tenant: ${tenant.name}`);

      let added = 0;
      let skipped = 0;

      for (const translation of translations) {
        // Check if English translation already exists
        const { data: existingEn } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'en')
          .single();

        if (!existingEn) {
          // Add English translation
          const { error: enError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              translation_key: translation.key,
              translation_value: translation.en,
              language_code: 'en',
              context: 'admin',
            });

          if (enError) {
            console.error(`   ❌ Error adding EN ${translation.key}:`, enError.message);
          } else {
            added++;
          }
        } else {
          skipped++;
        }

        // Check if Hebrew translation already exists
        const { data: existingHe } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'he')
          .single();

        if (!existingHe) {
          // Add Hebrew translation
          const { error: heError } = await supabase
            .from('translations')
            .insert({
              tenant_id: tenant.id,
              translation_key: translation.key,
              translation_value: translation.he,
              language_code: 'he',
              context: 'admin',
            });

          if (heError) {
            console.error(`   ❌ Error adding HE ${translation.key}:`, heError.message);
          } else {
            added++;
          }
        } else {
          skipped++;
        }
      }

      console.log(`   ✅ Added ${added} translations, skipped ${skipped} existing\n`);
    }

    console.log('✅ Email template translations complete!\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTranslations();

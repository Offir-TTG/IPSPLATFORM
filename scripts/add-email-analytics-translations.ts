/**
 * Add Email Analytics Hebrew Translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
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
  // Page Headers
  { key: 'emails.analytics.title', en: 'Email Analytics', he: 'ניתוחי דוא"ל', category: 'emails' },
  { key: 'emails.analytics.description', en: 'Track email performance and engagement metrics', he: 'עקוב אחר ביצועי דוא"ל ומדדי מעורבות', category: 'emails' },

  // Time Range
  { key: 'analytics.last_7_days', en: 'Last 7 days', he: '7 ימים אחרונים', category: 'analytics' },
  { key: 'analytics.last_30_days', en: 'Last 30 days', he: '30 ימים אחרונים', category: 'analytics' },
  { key: 'analytics.last_90_days', en: 'Last 90 days', he: '90 ימים אחרונים', category: 'analytics' },
  { key: 'analytics.last_year', en: 'Last year', he: 'שנה אחרונה', category: 'analytics' },

  // Summary Stats
  { key: 'analytics.total_sent', en: 'Total Sent', he: 'סה"כ נשלחו', category: 'analytics' },
  { key: 'analytics.emails', en: 'Emails', he: 'הודעות', category: 'analytics' },
  { key: 'analytics.open_rate', en: 'Open Rate', he: 'שיעור פתיחה', category: 'analytics' },
  { key: 'analytics.opened', en: 'opened', he: 'נפתחו', category: 'analytics' },
  { key: 'analytics.click_rate', en: 'Click Rate', he: 'שיעור קליקים', category: 'analytics' },
  { key: 'analytics.clicked', en: 'clicked', he: 'לחצו', category: 'analytics' },
  { key: 'analytics.bounce_rate', en: 'Bounce Rate', he: 'שיעור החזרה', category: 'analytics' },
  { key: 'analytics.bounced', en: 'bounced', he: 'הוחזרו', category: 'analytics' },
  { key: 'analytics.delivery_rate', en: 'Delivery Rate', he: 'שיעור מסירה', category: 'analytics' },
  { key: 'analytics.delivered', en: 'delivered', he: 'נמסרו', category: 'analytics' },
  { key: 'analytics.failed', en: 'Failed', he: 'נכשלו', category: 'analytics' },

  // Template Performance
  { key: 'analytics.template_performance', en: 'Template Performance', he: 'ביצועי תבניות', category: 'analytics' },
  { key: 'analytics.template_performance_desc', en: 'Engagement metrics by email template', he: 'מדדי מעורבות לפי תבנית דוא"ל', category: 'analytics' },
  { key: 'analytics.no_data', en: 'No template data available for the selected period', he: 'אין נתוני תבניות זמינים לתקופה שנבחרה', category: 'analytics' },
  { key: 'analytics.template_name', en: 'Template Name', he: 'שם תבנית', category: 'analytics' },

  // Best Practices
  { key: 'analytics.best_practices', en: 'Best Practices', he: 'שיטות עבודה מומלצות', category: 'analytics' },
  { key: 'analytics.best_practices_desc', en: 'Tips to improve your email engagement', he: 'טיפים לשיפור מעורבות הדוא"ל שלך', category: 'analytics' },

  { key: 'analytics.tip_subject', en: 'Optimize Subject Lines', he: 'אופטימיזציה של שורות נושא', category: 'analytics' },
  { key: 'analytics.tip_subject_desc', en: 'Keep subject lines under 50 characters and include actionable language to improve open rates', he: 'שמור על שורות נושא מתחת ל-50 תווים וכלול שפה פעילה כדי לשפר את שיעורי הפתיחה', category: 'analytics' },

  { key: 'analytics.tip_cta', en: 'Clear Call-to-Action', he: 'קריאה לפעולה ברורה', category: 'analytics' },
  { key: 'analytics.tip_cta_desc', en: 'Use prominent buttons with clear action words to increase click-through rates', he: 'השתמש בכפתורים בולטים עם מילות פעולה ברורות כדי להגדיל את שיעורי הקליקים', category: 'analytics' },

  { key: 'analytics.tip_timing', en: 'Send at Optimal Times', he: 'שלח בזמנים אופטימליים', category: 'analytics' },
  { key: 'analytics.tip_timing_desc', en: 'Tuesday through Thursday, 10 AM - 2 PM typically see the highest engagement rates', he: 'ימים ג\'-ה\', 10:00-14:00 בדרך כלל רואים את שיעורי המעורבות הגבוהים ביותר', category: 'analytics' },
];

async function addTranslations() {
  console.log('Starting to add email analytics translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  if (!tenants || tenants.length === 0) {
    console.error('❌ No tenant found');
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
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .maybeSingle();

      if (!existingEN) {
        const { error } = await supabase.from('translations').insert({
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
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .maybeSingle();

      if (!existingHE) {
        const { error } = await supabase.from('translations').insert({
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

      console.log('');

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

/**
 * Add comprehensive Hebrew translations for audit trail page
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Translation {
  key: string;
  en: string;
  he: string;
  context: string;
}

const translations: Translation[] = [
  // Page headers
  {
    key: 'admin.audit.title',
    en: 'Audit Trail',
    he: 'יומן ביקורת',
    context: 'admin'
  },
  {
    key: 'admin.audit.subtitle',
    en: 'Monitor all system activities and compliance events',
    he: 'ניטור כל הפעילויות במערכת ואירועי תאימות',
    context: 'admin'
  },

  // Stats cards
  {
    key: 'admin.audit.stats.total',
    en: 'Total Events',
    he: 'סה"כ אירועים',
    context: 'admin'
  },
  {
    key: 'admin.audit.stats.highRisk',
    en: 'High Risk',
    he: 'סיכון גבוה',
    context: 'admin'
  },
  {
    key: 'admin.audit.stats.failed',
    en: 'Failed Actions',
    he: 'פעולות שנכשלו',
    context: 'admin'
  },
  {
    key: 'admin.audit.stats.today',
    en: 'Last 24 Hours',
    he: '24 שעות אחרונות',
    context: 'admin'
  },

  // Table headers
  {
    key: 'admin.audit.table.time',
    en: 'Time',
    he: 'זמן',
    context: 'admin'
  },
  {
    key: 'admin.audit.table.user',
    en: 'User',
    he: 'משתמש',
    context: 'admin'
  },
  {
    key: 'admin.audit.table.action',
    en: 'Action',
    he: 'פעולה',
    context: 'admin'
  },
  {
    key: 'admin.audit.table.resource',
    en: 'Resource',
    he: 'משאב',
    context: 'admin'
  },
  {
    key: 'admin.audit.table.type',
    en: 'Type',
    he: 'סוג',
    context: 'admin'
  },
  {
    key: 'admin.audit.table.risk',
    en: 'Risk',
    he: 'סיכון',
    context: 'admin'
  },
  {
    key: 'admin.audit.table.system',
    en: 'System',
    he: 'מערכת',
    context: 'admin'
  },
  {
    key: 'admin.audit.table.changed',
    en: 'Changed',
    he: 'שונה',
    context: 'admin'
  },

  // Expanded details
  {
    key: 'admin.audit.details.before',
    en: 'Before',
    he: 'לפני',
    context: 'admin'
  },
  {
    key: 'admin.audit.details.after',
    en: 'After',
    he: 'אחרי',
    context: 'admin'
  },
  {
    key: 'admin.audit.details.exactChanges',
    en: 'Exact Changes',
    he: 'שינויים מדויקים',
    context: 'admin'
  },

  // Pagination (common keys)
  {
    key: 'common.page',
    en: 'Page',
    he: 'עמוד',
    context: 'common'
  },
  {
    key: 'common.of',
    en: 'of',
    he: 'מתוך',
    context: 'common'
  },
  {
    key: 'common.previous',
    en: 'Previous',
    he: 'קודם',
    context: 'common'
  },
  {
    key: 'common.next',
    en: 'Next',
    he: 'הבא',
    context: 'common'
  },
];

async function addTranslations() {
  console.log('Adding audit trail translations...\n');

  // Get the default tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError?.message);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Add English translation
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: translation.context,
      p_context: translation.context,
      p_tenant_id: tenantId
    });

    if (enError) {
      console.error(`  ❌ Error adding English translation:`, enError.message);
      errorCount++;
    } else {
      console.log(`  ✅ Added English: "${translation.en}"`);
    }

    // Add Hebrew translation
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: translation.context,
      p_context: translation.context,
      p_tenant_id: tenantId
    });

    if (heError) {
      console.error(`  ❌ Error adding Hebrew translation:`, heError.message);
      errorCount++;
    } else {
      console.log(`  ✅ Added Hebrew: "${translation.he}"`);
      successCount++;
    }

    console.log('');
  }

  console.log(`\n✅ Successfully added ${successCount} translations`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} errors encountered`);
  }
  console.log('');
}

addTranslations();

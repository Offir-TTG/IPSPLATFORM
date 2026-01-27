/**
 * Add Audit Metadata Translations
 * Adds translations for expanded metadata fields in audit trail
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Metadata section title
  {
    key: 'admin.audit.details.metadata',
    en: 'Event Metadata',
    he: 'מטאדאטה של האירוע',
    category: 'admin',
    context: 'admin',
  },

  // Field labels
  {
    key: 'admin.audit.details.status',
    en: 'Status',
    he: 'סטטוס',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.resourceId',
    en: 'Resource ID',
    he: 'מזהה משאב',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.riskLevel',
    en: 'Risk Level',
    he: 'רמת סיכון',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.sessionId',
    en: 'Session ID',
    he: 'מזהה הפעלה',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.userAgent',
    en: 'User Agent',
    he: 'דפדפן',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.correlationId',
    en: 'Correlation ID',
    he: 'מזהה מתאם',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.studentRecord',
    en: 'Student Record',
    he: 'תיק תלמיד',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.compliance',
    en: 'Compliance',
    he: 'תאימות',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.description',
    en: 'Description',
    he: 'תיאור',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.error',
    en: 'Error Message',
    he: 'הודעת שגיאה',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.additionalInfo',
    en: 'Additional Information',
    he: 'מידע נוסף',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.before',
    en: 'Before',
    he: 'לפני',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.after',
    en: 'After',
    he: 'אחרי',
    category: 'admin',
    context: 'admin',
  },
  {
    key: 'admin.audit.details.exactChanges',
    en: 'Exact Changes',
    he: 'שינויים מדויקים',
    category: 'admin',
    context: 'admin',
  },

  // Status values
  {
    key: 'audit.status.success',
    en: 'Success',
    he: 'הצלחה',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.status.failure',
    en: 'Failure',
    he: 'כשלון',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.status.pending',
    en: 'Pending',
    he: 'ממתין',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.status.partial',
    en: 'Partial',
    he: 'חלקי',
    category: 'audit',
    context: 'admin',
  },

  // Risk levels
  {
    key: 'audit.risk.low',
    en: 'Low',
    he: 'נמוך',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.risk.medium',
    en: 'Medium',
    he: 'בינוני',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.risk.high',
    en: 'High',
    he: 'גבוה',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.risk.critical',
    en: 'Critical',
    he: 'קריטי',
    category: 'audit',
    context: 'admin',
  },
];

async function addTranslations() {
  console.log('Adding audit metadata translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  let added = 0;

  for (const trans of translations) {
    // Hebrew
    const { error: heError } = await supabase.from('translations').insert({
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: trans.key,
      translation_value: trans.he,
      category: trans.category,
      context: trans.context,
    });

    if (!heError || heError.message.includes('duplicate')) {
      console.log(`✓ ${trans.key} (he): ${trans.he}`);
      if (!heError) added++;
    } else {
      console.error(`✗ ${trans.key} (he):`, heError.message);
    }

    // English
    const { error: enError } = await supabase.from('translations').insert({
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: trans.key,
      translation_value: trans.en,
      category: trans.category,
      context: trans.context,
    });

    if (!enError || enError.message.includes('duplicate')) {
      console.log(`✓ ${trans.key} (en): ${trans.en}`);
      if (!enError) added++;
    } else {
      console.error(`✗ ${trans.key} (en):`, enError.message);
    }
  }

  console.log(`\n✅ Added ${added} new translations`);
}

addTranslations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

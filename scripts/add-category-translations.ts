/**
 * Add Event Category Translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const categories = [
  { key: 'audit.category.DATA', en: 'Data', he: 'נתונים' },
  { key: 'audit.category.AUTH', en: 'Authentication', he: 'אימות' },
  { key: 'audit.category.ADMIN', en: 'Admin', he: 'מנהל' },
  { key: 'audit.category.CONFIG', en: 'Configuration', he: 'תצורה' },
  { key: 'audit.category.SECURITY', en: 'Security', he: 'אבטחה' },
  { key: 'audit.category.COMPLIANCE', en: 'Compliance', he: 'תאימות' },
  { key: 'audit.category.SYSTEM', en: 'System', he: 'מערכת' },
  { key: 'audit.category.EDUCATION', en: 'Education', he: 'חינוך' },
  { key: 'audit.category.STUDENT_RECORD', en: 'Student Record', he: 'תיק תלמיד' },
  { key: 'audit.category.GRADE', en: 'Grade', he: 'ציון' },
  { key: 'audit.category.ATTENDANCE', en: 'Attendance', he: 'נוכחות' },
  { key: 'audit.category.PARENTAL_ACCESS', en: 'Parental Access', he: 'גישת הורים' },
];

async function addTranslations() {
  console.log('Adding event category translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  let added = 0;

  for (const cat of categories) {
    // Hebrew
    const { error: heError } = await supabase.from('translations').insert({
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: cat.key,
      translation_value: cat.he,
      category: 'audit',
      context: 'admin',
    });

    if (!heError || heError.message.includes('duplicate')) {
      console.log(`✓ ${cat.key} (he): ${cat.he}`);
      if (!heError) added++;
    }

    // English
    const { error: enError } = await supabase.from('translations').insert({
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: cat.key,
      translation_value: cat.en,
      category: 'audit',
      context: 'admin',
    });

    if (!enError || enError.message.includes('duplicate')) {
      console.log(`✓ ${cat.key} (en): ${cat.en}`);
      if (!enError) added++;
    }
  }

  console.log(`\n✅ Added ${added} new translations`);
}

addTranslations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

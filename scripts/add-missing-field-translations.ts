/**
 * Add Missing Field Translations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  {
    key: 'audit.field.is_whatsapp',
    en: 'WhatsApp',
    he: 'WhatsApp',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.field.contact_email',
    en: 'Contact Email',
    he: 'אימייל ליצירת קשר',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.field.location',
    en: 'Location',
    he: 'מיקום',
    category: 'audit',
    context: 'admin',
  },
  {
    key: 'audit.field.timezone',
    en: 'Timezone',
    he: 'אזור זמן',
    category: 'audit',
    context: 'admin',
  },
];

async function addTranslations() {
  console.log('Adding missing field translations...\n');

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

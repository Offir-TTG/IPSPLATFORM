import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  { key: 'admin.notifications.deliveryChannels', he: 'ערוצי משלוח' },
  { key: 'admin.notifications.deliveryChannelsHelp', he: 'בחר באילו ערוצים לשלוח התראה זו. משתמשים עדיין יכולים לשלוט בהעדפות שלהם.' },
  { key: 'admin.notifications.channels.inApp', he: 'התראה באפליקציה' },
  { key: 'admin.notifications.channels.email', he: 'התראת אימייל' },
  { key: 'admin.notifications.channels.sms', he: 'SMS/WhatsApp' },
  { key: 'admin.notifications.channels.push', he: 'התראת דפדפן' },
  { key: 'admin.notifications.alwaysEnabled', he: 'תמיד פעיל' },
  { key: 'admin.notifications.urgentOnly', he: 'דחוף בלבד' },
];

async function addTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id');
    
    for (const tenant of tenants || []) {
      let added = 0;
      for (const translation of translations) {
        const { data: existing } = await supabase
          .from('translations')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('translation_key', translation.key)
          .eq('language_code', 'he')
          .eq('context', 'admin')
          .maybeSingle();

        if (!existing) {
          await supabase.from('translations').insert({
            tenant_id: tenant.id,
            language_code: 'he',
            translation_key: translation.key,
            translation_value: translation.he,
            context: 'admin',
          });
          added++;
        }
      }
      console.log(`Tenant ${tenant.id}: Added ${added} translations`);
    }
    console.log('✅ Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();

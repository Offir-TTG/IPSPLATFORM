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
  // Session access control messages
  { key: 'user.courses.sessionEnded', en: 'This session has ended. Please check the Recording tab.', he: 'השיעור הסתיים. אנא בדוק את הקלטת השיעור בלשונית ההקלטות.' },
  { key: 'user.courses.sessionNotStarted', en: 'This session is not available yet. You can join 30 minutes before the scheduled start time.', he: 'השיעור עדיין לא זמין. ניתן להצטרף 30 דקות לפני השעה המתוכננת.' },
];

async function addTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;
    let addedCount = 0;
    let updatedCount = 0;

    console.log(`\n📝 Adding/updating ${translations.length} translations for tenant: ${tenantId}\n`);

    for (const { key, en, he } of translations) {
      // Check Hebrew translation
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .single();

      if (existingHe) {
        if (existingHe.translation_value !== he) {
          const { error: updateError } = await supabase
            .from('translations')
            .update({ translation_value: he })
            .eq('id', existingHe.id);

          if (!updateError) {
            updatedCount++;
            console.log(`🔄 Updated HE: ${key}`);
          }
        } else {
          console.log(`✓ Exists HE: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: he,
            language_code: 'he',
            context: 'user'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added HE: ${key}`);
        }
      }

      // Check English translation
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en')
        .single();

      if (existingEn) {
        if (existingEn.translation_value !== en) {
          const { error: updateError } = await supabase
            .from('translations')
            .update({ translation_value: en })
            .eq('id', existingEn.id);

          if (!updateError) {
            updatedCount++;
            console.log(`🔄 Updated EN: ${key}`);
          }
        } else {
          console.log(`✓ Exists EN: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: en,
            language_code: 'en',
            context: 'user'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added EN: ${key}`);
        }
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(`Total added: ${addedCount}`);
    console.log(`Total updated: ${updatedCount}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();

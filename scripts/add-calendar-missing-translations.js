const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Common translations
  { key: 'common.back', en: 'Back', he: 'חזור' },

  // Date formatting - these need to handle date-fns formatting
  // "in X days" format used by formatDistanceToNow
  { key: 'user.calendar.timePrefix.in', en: 'in', he: 'בעוד' },
  { key: 'user.calendar.timeSuffix.days', en: 'days', he: 'ימים' },
  { key: 'user.calendar.timeSuffix.day', en: 'day', he: 'יום' },
  { key: 'user.calendar.timeSuffix.hours', en: 'hours', he: 'שעות' },
  { key: 'user.calendar.timeSuffix.hour', en: 'hour', he: 'שעה' },
  { key: 'user.calendar.timeSuffix.minutes', en: 'minutes', he: 'דקות' },
  { key: 'user.calendar.timeSuffix.minute', en: 'minute', he: 'דקה' },
];

async function addTranslations() {
  try {
    // Get the default tenant
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;
    let addedCount = 0;
    let updatedCount = 0;

    console.log(`Processing ${translations.length} translation keys...\n`);

    for (const translation of translations) {
      const { key, en, he } = translation;

      // Process Hebrew translation
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he');

      if (existingHe && existingHe.length > 0) {
        const { error: updateError } = await supabase
          .from('translations')
          .update({ translation_value: he })
          .eq('tenant_id', tenantId)
          .eq('translation_key', key)
          .eq('language_code', 'he');

        if (!updateError) {
          updatedCount++;
          console.log(`✅ Updated HE: ${key}`);
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

      // Process English translation
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en');

      if (existingEn && existingEn.length > 0) {
        const { error: updateError } = await supabase
          .from('translations')
          .update({ translation_value: en })
          .eq('tenant_id', tenantId)
          .eq('translation_key', key)
          .eq('language_code', 'en');

        if (!updateError) {
          updatedCount++;
          console.log(`✅ Updated EN: ${key}`);
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

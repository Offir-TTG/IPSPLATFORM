const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Validation error title
  {
    key: 'contact.validation.error',
    en: 'Validation Error',
    he: 'שגיאת אימות'
  },

  // Name validation
  {
    key: 'contact.validation.nameRequired',
    en: 'Name is required',
    he: 'שדה שם הוא חובה'
  },

  // Email validation
  {
    key: 'contact.validation.emailRequired',
    en: 'Email is required',
    he: 'שדה אימייל הוא חובה'
  },
  {
    key: 'contact.validation.emailInvalid',
    en: 'Please enter a valid email address',
    he: 'אנא הזן כתובת אימייל תקינה'
  },

  // Phone validation
  {
    key: 'contact.validation.phoneInvalid',
    en: 'Please enter a valid phone number',
    he: 'אנא הזן מספר טלפון תקין'
  },

  // Subject validation
  {
    key: 'contact.validation.subjectRequired',
    en: 'Subject is required',
    he: 'שדה נושא הוא חובה'
  },

  // Message validation
  {
    key: 'contact.validation.messageRequired',
    en: 'Message is required',
    he: 'שדה הודעה הוא חובה'
  },
];

async function addTranslations() {
  console.log('🌐 Adding contact validation translations...\n');

  // Get tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('❌ Error fetching tenant:', tenantError);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const translation of translations) {
    try {
      // Check if English translation exists
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .eq('context', 'user');

      if (existingEn && existingEn.length > 0) {
        console.log(`- Skipped EN (exists): ${translation.key}`);
      } else {
        // Insert English
        const { error: enError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.en,
            language_code: 'en',
            context: 'user',
          });

        if (enError) throw enError;
        console.log(`✓ Added EN: ${translation.key}`);
        successCount++;
      }

      // Check if Hebrew translation exists
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .eq('context', 'user');

      if (existingHe && existingHe.length > 0) {
        console.log(`- Skipped HE (exists): ${translation.key}`);
      } else {
        // Insert Hebrew
        const { error: heError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.he,
            language_code: 'he',
            context: 'user',
          });

        if (heError) throw heError;
        console.log(`✓ Added HE: ${translation.key}`);
        successCount++;
      }

      console.log('');
    } catch (err) {
      console.error(`✗ Error adding ${translation.key}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Translation import completed!`);
  console.log(`Total translations processed: ${translations.length}`);
  console.log(`Successfully added: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('='.repeat(50));
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

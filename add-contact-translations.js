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
  // Page Header
  { key: 'contact.title', en: 'Contact Us', he: 'צור קשר' },
  { key: 'contact.subtitle', en: 'Have questions? We\'d love to hear from you.', he: 'יש לך שאלות? נשמח לשמוע ממך.' },

  // Contact Info Cards
  { key: 'contact.info.email.title', en: 'Email', he: 'דוא"ל' },
  { key: 'contact.info.phone.title', en: 'Phone', he: 'טלפון' },
  { key: 'contact.info.phone.description', en: 'Available Monday - Friday, 9AM - 5PM', he: 'זמין יום ראשון - חמישי, 9:00 - 17:00' },
  { key: 'contact.info.address.title', en: 'Address', he: 'כתובת' },
  { key: 'contact.info.address.description', en: 'We operate online worldwide', he: 'אנו פועלים באופן מקוון ברחבי העולם' },

  // Contact Form
  { key: 'contact.form.title', en: 'Send us a message', he: 'שלח לנו הודעה' },
  { key: 'contact.form.description', en: 'Fill out the form below and we\'ll get back to you shortly.', he: 'מלא את הטופס למטה ונחזור אליך בהקדם.' },

  { key: 'contact.form.name.label', en: 'Full Name', he: 'שם מלא' },
  { key: 'contact.form.name.placeholder', en: 'John Doe', he: 'ישראל ישראלי' },

  { key: 'contact.form.email.label', en: 'Email', he: 'דוא"ל' },
  { key: 'contact.form.email.placeholder', en: 'john@example.com', he: 'example@example.com' },

  { key: 'contact.form.phone.label', en: 'Phone Number', he: 'מספר טלפון' },
  { key: 'contact.form.phone.placeholder', en: '+1 (555) 000-0000', he: '050-0000000' },

  { key: 'contact.form.subject.label', en: 'Subject', he: 'נושא' },
  { key: 'contact.form.subject.placeholder', en: 'How can we help?', he: 'איך נוכל לעזור?' },

  { key: 'contact.form.message.label', en: 'Message', he: 'הודעה' },
  { key: 'contact.form.message.placeholder', en: 'Tell us more about your inquiry...', he: 'ספר לנו יותר על הפנייה שלך...' },

  { key: 'contact.form.submit', en: 'Send Message', he: 'שלח הודעה' },
  { key: 'contact.form.sending', en: 'Sending...', he: 'שולח...' },

  // Success/Error Messages
  { key: 'contact.success.title', en: 'Message sent!', he: 'ההודעה נשלחה!' },
  { key: 'contact.success.description', en: 'We\'ll get back to you as soon as possible.', he: 'נחזור אליך בהקדם האפשרי.' },
  { key: 'contact.error.title', en: 'Error', he: 'שגיאה' },
  { key: 'contact.error.description', en: 'Failed to send message. Please try again.', he: 'שליחת ההודעה נכשלה. אנא נסה שוב.' },
];

async function addTranslations() {
  console.log('🌐 Adding contact form translations...\n');

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

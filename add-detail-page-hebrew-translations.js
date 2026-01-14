require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Detail page translations (only Hebrew missing - English already exists)
  { key: 'detail.stats.lessons', he: 'שיעורים' },
  { key: 'detail.coursesDesc', he: 'תכנית לימודים מקיפה' },
  { key: 'detail.lessonsDesc', he: 'למידה שלב אחר שלב' },
  { key: 'detail.hoursDesc', he: 'של תוכן וידאו' },
  { key: 'detail.includes', he: 'תוכנית זו כוללת:' },
  { key: 'detail.aboutProgram', he: 'אודות תוכנית זו' },
  { key: 'detail.enrollButton', he: 'הרשם עכשיו' },
  { key: 'detail.enrolling', he: 'מבצע הרשמה...' },
  { key: 'detail.back', he: 'חזרה' },
  { key: 'detail.pricing.monthlyPayments', he: 'תשלומים חודשיים זמינים' },
  { key: 'public.programs.program', he: 'תוכנית' },
];

async function addTranslations() {
  console.log('Adding missing Hebrew translations for detail page...\n');

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants[0].id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  for (const translation of translations) {
    // Only add Hebrew translations (English already exists)
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenantId,
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: 'public',
      });

    if (heError && !heError.message.includes('duplicate')) {
      console.error(`Error HE ${translation.key}:`, heError.message);
    } else {
      console.log(`✓ HE: ${translation.key} = "${translation.he}"`);
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

addTranslations();

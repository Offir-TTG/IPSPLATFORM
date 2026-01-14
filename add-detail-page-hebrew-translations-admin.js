require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
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
  console.log('Adding missing Hebrew translations...\n');

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants[0].id;

  for (const translation of translations) {
    const { error } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenantId,
        translation_key: translation.key,
        language_code: 'he',
        translation_value: translation.he,
        context: 'admin',
      });

    if (error && !error.message.includes('duplicate')) {
      console.error(`✗ ${translation.key}:`, error.message);
    } else {
      console.log(`✓ ${translation.key}`);
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

addTranslations();

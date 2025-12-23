require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslations() {
  console.log('Adding user invitation template translations...\n');

  const translations = [
    // Template name
    {
      translation_key: 'email_template.system_user_invitation.name',
      language_code: 'en',
      translation_value: 'User Invitation',
      category: 'email',
      context: 'admin'
    },
    {
      translation_key: 'email_template.system_user_invitation.name',
      language_code: 'he',
      translation_value: 'הזמנת משתמש',
      category: 'email',
      context: 'admin'
    },
    // Template description
    {
      translation_key: 'email_template.system_user_invitation.description',
      language_code: 'en',
      translation_value: 'Sent when admin invites a new user to the platform',
      category: 'email',
      context: 'admin'
    },
    {
      translation_key: 'email_template.system_user_invitation.description',
      language_code: 'he',
      translation_value: 'נשלח כאשר מנהל מזמין משתמש חדש לפלטפורמה',
      category: 'email',
      context: 'admin'
    },
  ];

  const keys = [
    'email_template.system_user_invitation.name',
    'email_template.system_user_invitation.description',
  ];

  const { data: existing, error: checkError } = await supabase
    .from('translations')
    .select('*')
    .in('translation_key', keys);

  if (checkError) {
    console.error('Error checking translations:', checkError);
    process.exit(1);
  }

  console.log('Found existing translations:', existing?.length || 0);

  const existingKeys = new Set(
    existing?.map(t => `${t.translation_key}:${t.language_code}`) || []
  );

  const newTranslations = translations.filter(
    t => !existingKeys.has(`${t.translation_key}:${t.language_code}`)
  );

  if (newTranslations.length === 0) {
    console.log('\n✅ All translations already exist!');
    return;
  }

  console.log(`\nAdding ${newTranslations.length} new translations...`);
  newTranslations.forEach(t => {
    console.log(`  - ${t.translation_key} (${t.language_code}): ${t.translation_value}`);
  });

  const { error: insertError } = await supabase
    .from('translations')
    .insert(newTranslations);

  if (insertError) {
    console.error('\n❌ Error adding translations:', insertError);
    process.exit(1);
  }

  console.log('\n✅ User invitation template translations added successfully!');
}

addTranslations();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error } = await supabase
    .from('translations')
    .select('translation_key, translation_value, language_code, context')
    .or('translation_key.like.admin.nav.%,translation_key.like.admin.dashboard.title%,translation_key.like.admin.theme.title%,translation_key.like.admin.languages.title%,translation_key.like.admin.audit.title%')
    .order('translation_key, language_code');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('\n=== Navigation Keys ===');
  const navKeys = data.filter(t => t.translation_key.startsWith('admin.nav.'));
  navKeys.forEach(t => {
    console.log(`${t.translation_key} (${t.language_code}): ${t.translation_value}`);
  });

  console.log('\n=== Page Title Keys ===');
  const titleKeys = data.filter(t => t.translation_key.includes('.title'));
  titleKeys.forEach(t => {
    console.log(`${t.translation_key} (${t.language_code}): ${t.translation_value}`);
  });

  process.exit(0);
})();

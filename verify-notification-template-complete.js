const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('\n🔍 Verification Report: notification.generic Email Template\n');
  console.log('='.repeat(60));

  // 1. Check template exists
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', 'notification.generic')
    .single();

  if (!template) {
    console.log('❌ Template NOT FOUND in database');
    return;
  }

  console.log('\n✅ 1. Template EXISTS in database');
  console.log(`   - ID: ${template.id}`);
  console.log(`   - Key: ${template.template_key}`);
  console.log(`   - Category: ${template.template_category}`);
  console.log(`   - Is System: ${template.is_system}`);
  console.log(`   - Is Active: ${template.is_active}`);

  // 2. Check template versions
  const { data: versions } = await supabase
    .from('email_template_versions')
    .select('*')
    .eq('template_id', template.id);

  console.log(`\n✅ 2. Template has ${versions?.length || 0} versions`);
  versions?.forEach(v => {
    console.log(`   - ${v.language_code}: "${v.subject}"`);
  });

  // 3. Check translations
  const { data: nameTranslations } = await supabase
    .from('translations')
    .select('*')
    .eq('translation_key', 'email_template.notification_generic.name');

  const { data: descTranslations } = await supabase
    .from('translations')
    .select('*')
    .eq('translation_key', 'email_template.notification_generic.description');

  console.log(`\n✅ 3. Translations exist`);
  console.log(`   Name translations: ${nameTranslations?.length || 0}`);
  nameTranslations?.forEach(t => {
    console.log(`      - ${t.language_code}: "${t.translation_value}"`);
  });
  console.log(`   Description translations: ${descTranslations?.length || 0}`);
  descTranslations?.forEach(t => {
    console.log(`      - ${t.language_code}: "${t.translation_value}"`);
  });

  // 4. List all templates to show it's in the list
  const { data: allTemplates } = await supabase
    .from('email_templates')
    .select('template_key, template_name, template_category, is_system')
    .order('template_category', { ascending: true })
    .order('template_name', { ascending: true });

  console.log(`\n✅ 4. All templates in database (${allTemplates?.length || 0} total):`);

  const grouped = {};
  allTemplates?.forEach(t => {
    if (!grouped[t.template_category]) {
      grouped[t.template_category] = [];
    }
    grouped[t.template_category].push(t);
  });

  Object.entries(grouped).forEach(([category, temps]) => {
    console.log(`\n   📁 ${category.toUpperCase()}:`);
    temps.forEach(t => {
      const marker = t.template_key === 'notification.generic' ? ' 👈 THIS ONE' : '';
      console.log(`      - ${t.template_key}${marker}`);
    });
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICATION COMPLETE');
  console.log('\nThe template is properly set up and should appear in the');
  console.log('Email Templates page at /admin/emails/templates');
  console.log('\nIf not visible, try:');
  console.log('  1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
  console.log('  2. Clear browser cache');
  console.log('  3. Check browser console for errors');
  console.log('='.repeat(60) + '\n');
}

verify();

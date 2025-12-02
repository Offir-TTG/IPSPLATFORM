const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplateKeys() {
  console.log('Checking email templates...\n');

  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('id, template_key, template_name, description')
    .order('template_key');

  if (error) {
    console.error('Error fetching templates:', error);
    process.exit(1);
  }

  console.log(`Found ${templates.length} email templates:\n`);

  templates.forEach(t => {
    const translationKey = t.template_key.replace('.', '_');
    console.log(`📧 Template: ${t.template_key}`);
    console.log(`   Name: ${t.template_name}`);
    console.log(`   Description: ${t.description}`);
    console.log(`   Translation key should be: email_template.${translationKey}.description`);
    console.log();
  });

  process.exit(0);
}

checkTemplateKeys();

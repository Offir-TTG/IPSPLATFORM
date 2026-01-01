const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNotificationTemplate() {
  // Check for notification.generic template
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', 'notification.generic');

  if (error) {
    console.log('Error:', error);
  } else {
    console.log(`Found ${data.length} notification.generic templates:`);
    console.log(JSON.stringify(data, null, 2));
  }

  // Also get all templates to see the complete list
  const { data: allTemplates } = await supabase
    .from('email_templates')
    .select('template_key, template_category, is_system');

  console.log('\n\nAll templates:');
  console.log(JSON.stringify(allTemplates, null, 2));
}

checkNotificationTemplate();

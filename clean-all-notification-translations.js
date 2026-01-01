const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanAll() {
  console.log('Deleting ALL user.notifications.* translations...\n');

  const { data: deleted, error } = await supabase
    .from('translations')
    .delete()
    .like('translation_key', 'user.notifications.%')
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`✅ Deleted ${deleted?.length || 0} translations`);
  }

  // Also delete admin categories
  const { data: deletedAdmin, error: adminError } = await supabase
    .from('translations')
    .delete()
    .like('translation_key', 'admin.notifications.categories.%')
    .select();

  if (adminError) {
    console.error('Admin Error:', adminError);
  } else {
    console.log(`✅ Deleted ${deletedAdmin?.length || 0} admin translations`);
  }
}

cleanAll();

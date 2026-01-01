const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const userId = 'c85f5987-8fc6-4315-8596-5c7521346ee0';

  console.log('=== Current State ===\n');

  // Get ALL notifications in database
  const { data: allNotifs } = await supabase
    .from('notifications')
    .select('id, title, scope, target_user_id, target_course_id, created_at')
    .order('created_at', { ascending: false });

  console.log('Total notifications in DB:', allNotifs?.length || 0);

  // Count by scope
  const byCourse = allNotifs?.filter(n => n.scope === 'course').length || 0;
  const byIndividual = allNotifs?.filter(n => n.scope === 'individual').length || 0;
  const byTenant = allNotifs?.filter(n => n.scope === 'tenant').length || 0;

  console.log('  - Individual scope:', byIndividual);
  console.log('  - Course scope:', byCourse);
  console.log('  - Tenant scope:', byTenant);

  // Get notifications for this specific user (individual scope only)
  const individualNotifs = allNotifs?.filter(n =>
    n.scope === 'individual' && n.target_user_id === userId
  ) || [];

  console.log('\nIndividual notifications for this user:', individualNotifs.length);
  individualNotifs.forEach((n, i) => {
    console.log('  ' + (i + 1) + '. ' + n.title);
  });

  // Check what the function returns
  const { data: funcResult } = await supabase.rpc('get_user_notifications', {
    p_user_id: userId,
    p_limit: 100,
    p_offset: 0,
    p_category: null,
    p_priority: null,
    p_unread_only: false,
  });

  console.log('\nget_user_notifications returns:', funcResult?.length || 0);

  if (funcResult && funcResult.length > 0) {
    funcResult.forEach((n, i) => {
      console.log('  ' + (i + 1) + '. ' + n.title + ' (' + n.scope + ')');
    });
  }

  // Check the two course notifications specifically
  const c1 = allNotifs?.find(n => n.id === '97ded8a4-30b0-4ce9-8060-5ca71b08063d');
  const c2 = allNotifs?.find(n => n.id === 'a981dff2-056d-4da9-bcf5-dc88ab949d8d');

  console.log('\n=== Course Notifications ===');
  if (c1) {
    console.log('aaaaaaaaaaaaaa EXISTS in DB');
    console.log('  Scope:', c1.scope);
    console.log('  Course ID:', c1.target_course_id);
  }
  if (c2) {
    console.log('ששששששש EXISTS in DB');
    console.log('  Scope:', c2.scope);
    console.log('  Course ID:', c2.target_course_id);
  }

  // THE KEY QUESTION: Are these visible to the function?
  const c1Visible = funcResult?.some(n => n.id === '97ded8a4-30b0-4ce9-8060-5ca71b08063d');
  const c2Visible = funcResult?.some(n => n.id === 'a981dff2-056d-4da9-bcf5-dc88ab949d8d');

  console.log('\nVisible to user via function?');
  console.log('  aaaaaaaaaaaaaa:', c1Visible ? 'YES' : 'NO');
  console.log('  ששששששש:', c2Visible ? 'YES' : 'NO');
}

check();

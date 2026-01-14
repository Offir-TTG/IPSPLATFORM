const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSearches() {
  // Get a real enrolled user
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id')
    .in('status', ['active', 'completed'])
    .limit(1);

  const userId = enrollments[0].user_id;

  console.log('=== TESTING CHATBOT SEARCH ===\n');
  console.log('User ID:', userId, '\n');

  // Test actual searches
  const testQueries = ['שיעור', 'דיילי', 'באלק', 'aaa', '1', 'קורס'];

  for (const query of testQueries) {
    const { data } = await supabase.rpc('search_user_content', {
      p_user_id: userId,
      p_query: query,
      p_limit: 10
    });

    const lessons = data?.filter(r => r.result_type === 'lesson') || [];
    const courses = data?.filter(r => r.result_type === 'course') || [];

    console.log(`Query: "${query}"`);
    console.log(`  Found: ${lessons.length} lessons, ${courses.length} courses`);
    if (lessons.length > 0) {
      console.log(`  Lesson titles: ${lessons.slice(0, 3).map(l => l.result_title).join(', ')}`);
    }
    if (courses.length > 0) {
      console.log(`  Course titles: ${courses.slice(0, 3).map(c => c.result_title).join(', ')}`);
    }
    console.log('');
  }
}

testSearches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

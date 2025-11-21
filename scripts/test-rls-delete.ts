/**
 * Script to test if RLS policies are blocking lesson deletion
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSDelete() {
  console.log('Testing RLS policies on lesson deletion...\n');

  // Get a lesson to delete
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, title')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!lessons || lessons.length === 0) {
    console.log('No lessons to test with');
    return;
  }

  const lessonId = lessons[0].id;
  const lessonTitle = lessons[0].title;

  console.log(`Testing deletion of: ${lessonTitle}`);
  console.log(`Lesson ID: ${lessonId}\n`);

  // Check RLS policies
  console.log('Checking if RLS is enabled on lessons table...\n');

  const { data: tables } = await supabaseAdmin
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'lessons')
    .eq('schemaname', 'public');

  if (tables && tables.length > 0) {
    console.log('Table found:', tables[0].tablename);
  }

  // Try to query RLS policies
  const { data: policies, error: policiesError } = await supabaseAdmin.rpc(
    'exec_sql',
    {
      sql: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'lessons';
      `
    }
  );

  if (policiesError) {
    console.log('Could not fetch policies (expected - no exec_sql function)');
    console.log('Trying direct query...\n');
  } else {
    console.log('RLS Policies on lessons table:');
    console.log(JSON.stringify(policies, null, 2));
  }

  // Test deletion with service role (should always work)
  console.log('\n=== Test 1: Delete with Service Role ===');

  // Delete zoom sessions
  const { error: zoomError } = await supabaseAdmin
    .from('zoom_sessions')
    .delete()
    .eq('lesson_id', lessonId);

  if (zoomError) {
    console.log('❌ Error deleting zoom_sessions:', zoomError.message);
  } else {
    console.log('✓ Zoom sessions deleted');
  }

  // Delete lesson topics
  const { error: topicsError } = await supabaseAdmin
    .from('lesson_topics')
    .delete()
    .eq('lesson_id', lessonId);

  if (topicsError) {
    console.log('❌ Error deleting lesson_topics:', topicsError.message);
  } else {
    console.log('✓ Lesson topics deleted');
  }

  // Delete the lesson
  const { error: deleteError } = await supabaseAdmin
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (deleteError) {
    console.log('❌ Error deleting lesson:', deleteError.message);
    console.log('Details:', deleteError);
  } else {
    console.log('✓ Lesson deleted successfully with service role');
  }

  // Verify deletion
  const { data: checkLesson } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('id', lessonId)
    .single();

  if (checkLesson) {
    console.log('\n❌ Lesson still exists in database!');
  } else {
    console.log('\n✅ Lesson successfully deleted from database!');
  }
}

testRLSDelete();

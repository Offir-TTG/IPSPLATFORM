/**
 * Script to test the DELETE API endpoint directly
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAPIDelete() {
  console.log('Testing DELETE API endpoint...\n');

  // Get a lesson to delete
  const { data: lessons } = await supabase
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

  // Simulate the API call
  try {
    const response = await fetch(`http://localhost:3000/api/lms/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));

    // Check if actually deleted
    const { data: checkLesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', lessonId)
      .single();

    if (checkLesson) {
      console.log('\n❌ Lesson still exists in database!');
    } else {
      console.log('\n✅ Lesson successfully deleted from database!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPIDelete();

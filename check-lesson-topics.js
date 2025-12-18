const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLessonTopics() {
  const courseId = '0bc6f75f-2c03-4c2e-927f-f8fce73dfa62';

  // Get all modules
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, order')
    .eq('course_id', courseId)
    .order('order', { ascending: true });

  console.log('Found', modules?.length, 'modules');

  for (const module of modules || []) {
    console.log(`\n=== Module: ${module.title} (order: ${module.order}) ===`);

    // Get lessons for this module
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, order')
      .eq('module_id', module.id)
      .order('order', { ascending: true });

    console.log('Lessons:', lessons?.length || 0);

    for (const lesson of lessons || []) {
      console.log(`  Lesson: ${lesson.title} (order: ${lesson.order})`);

      // Get topics for this lesson
      const { data: topics } = await supabase
        .from('lesson_topics')
        .select('id, title, content_type, content, order, is_published')
        .eq('lesson_id', lesson.id)
        .order('order', { ascending: true });

      console.log(`  Topics: ${topics?.length || 0}`);

      for (const topic of topics || []) {
        console.log(`    - ${topic.title} (${topic.content_type}, published: ${topic.is_published}, order: ${topic.order})`);
        console.log(`      Content structure:`, typeof topic.content === 'object' ? Object.keys(topic.content) : typeof topic.content);
        if (typeof topic.content === 'object') {
          console.log(`      Content preview:`, JSON.stringify(topic.content).substring(0, 100));
        }
      }
    }
  }
}

checkLessonTopics().then(() => process.exit(0));

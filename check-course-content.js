const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCourseContent() {
  const courseId = '0bc6f75f-2c03-4c2e-927f-f8fce73dfa62';
  const userId = 'a018e2ea-ac21-4564-8f43-39e7d58e9bb2';

  console.log('Checking course:', courseId);
  console.log('User:', userId);

  // Check user tenant
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  console.log('User tenant_id:', userData?.tenant_id);

  // Check course tenant
  const { data: courseData } = await supabase
    .from('courses')
    .select('tenant_id')
    .eq('id', courseId)
    .single();

  console.log('Course tenant_id:', courseData?.tenant_id);

  // Check modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, is_published, order, tenant_id')
    .eq('course_id', courseId)
    .order('order', { ascending: true });

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    return;
  }

  console.log('\n=== MODULES ===');
  console.log('Total modules:', modules?.length || 0);
  if (modules && modules.length > 0) {
    modules.forEach(m => {
      console.log(`- ${m.title} (published: ${m.is_published}, order: ${m.order}, tenant: ${m.tenant_id})`);
    });

    // Check lessons for first module
    console.log('\n=== LESSONS (first module) ===');
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, is_published, order')
      .eq('module_id', modules[0].id)
      .order('order', { ascending: true });

    console.log('Total lessons:', lessons?.length || 0);
    if (lessons && lessons.length > 0) {
      lessons.forEach(l => {
        console.log(`- ${l.title} (published: ${l.is_published}, order: ${l.order})`);
      });

      // Check topics for first lesson
      console.log('\n=== LESSON TOPICS (first lesson) ===');
      const { data: topics } = await supabase
        .from('lesson_topics')
        .select('id, title, is_published, order')
        .eq('lesson_id', lessons[0].id)
        .order('order', { ascending: true });

      console.log('Total topics:', topics?.length || 0);
      if (topics && topics.length > 0) {
        topics.forEach(t => {
          console.log(`- ${t.title} (published: ${t.is_published}, order: ${t.order})`);
        });
      }
    }
  }
}

checkCourseContent().then(() => process.exit(0));

/**
 * Script to check publish status of courses, modules, and lessons
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try to load from .env.local if not already set
if (!supabaseUrl || !supabaseServiceKey) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value;
      }
    });
  } catch (err) {
    console.error('Could not read .env.local file:', err.message);
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkPublishStatus() {
  try {
    console.log('🔍 Checking publish status of courses, modules, and lessons...\n');

    // Check courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, is_active')
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('❌ Error fetching courses:', coursesError.message);
      return;
    }

    console.log('📚 COURSES:');
    console.log('═══════════════════════════════════════════════════════════');
    if (courses && courses.length > 0) {
      courses.forEach(course => {
        const status = course.is_active ? '✅ Active' : '❌ Inactive';
        console.log(`${status} | ${course.title}`);
      });
    } else {
      console.log('No courses found');
    }
    console.log('');

    // Check modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        is_published,
        course:courses(title)
      `)
      .order('created_at', { ascending: false });

    if (modulesError) {
      console.error('❌ Error fetching modules:', modulesError.message);
      return;
    }

    console.log('📖 MODULES:');
    console.log('═══════════════════════════════════════════════════════════');
    if (modules && modules.length > 0) {
      modules.forEach(module => {
        const status = module.is_published ? '✅ Published' : '❌ Unpublished';
        const courseName = module.course?.title || 'Unknown Course';
        console.log(`${status} | ${module.title} (${courseName})`);
      });
    } else {
      console.log('No modules found');
    }
    console.log('');

    // Check lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        is_published,
        module:modules(
          title,
          course:courses(title)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError.message);
      return;
    }

    console.log('📝 LESSONS (showing last 20):');
    console.log('═══════════════════════════════════════════════════════════');
    if (lessons && lessons.length > 0) {
      lessons.forEach(lesson => {
        const status = lesson.is_published ? '✅ Published' : '❌ Unpublished';
        const moduleName = lesson.module?.title || 'Unknown Module';
        const courseName = lesson.module?.course?.title || 'Unknown Course';
        console.log(`${status} | ${lesson.title}`);
        console.log(`         └─ Module: ${moduleName} | Course: ${courseName}`);
      });
    } else {
      console.log('No lessons found');
    }
    console.log('');

    // Summary
    const unpublishedModules = modules?.filter(m => !m.is_published).length || 0;
    const unpublishedLessons = lessons?.filter(l => !l.is_published).length || 0;
    const inactiveCourses = courses?.filter(c => !c.is_active).length || 0;

    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Courses: ${courses?.length || 0} (${inactiveCourses} inactive)`);
    console.log(`Total Modules: ${modules?.length || 0} (${unpublishedModules} unpublished)`);
    console.log(`Total Lessons: ${lessons?.length || 0} (${unpublishedLessons} unpublished)`);
    console.log('');

    if (inactiveCourses > 0 || unpublishedModules > 0 || unpublishedLessons > 0) {
      console.log('⚠️  WARNING: Some content is not published!');
      console.log('💡 Users will NOT see unpublished content in their dashboard');
      console.log('💡 To publish content, use the admin interface or run a publish script');
    } else {
      console.log('✅ All content is published and active!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the check
checkPublishStatus();

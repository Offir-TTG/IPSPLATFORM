/**
 * Script to publish all courses, modules, and lessons
 * This ensures users can see all content in their dashboard
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

async function publishAllContent() {
  try {
    console.log('🚀 Publishing all content...\n');

    // Publish all courses (set is_active = true)
    console.log('📚 Publishing courses...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .update({ is_active: true })
      .eq('is_active', false)
      .select('id, title');

    if (coursesError) {
      console.error('❌ Error publishing courses:', coursesError.message);
    } else {
      const count = courses?.length || 0;
      if (count > 0) {
        console.log(`✅ Published ${count} course(s):`);
        courses.forEach(c => console.log(`   - ${c.title}`));
      } else {
        console.log('✅ All courses already active');
      }
    }
    console.log('');

    // Publish all modules
    console.log('📖 Publishing modules...');
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .update({ is_published: true })
      .eq('is_published', false)
      .select('id, title');

    if (modulesError) {
      console.error('❌ Error publishing modules:', modulesError.message);
    } else {
      const count = modules?.length || 0;
      if (count > 0) {
        console.log(`✅ Published ${count} module(s):`);
        modules.forEach(m => console.log(`   - ${m.title}`));
      } else {
        console.log('✅ All modules already published');
      }
    }
    console.log('');

    // Publish all lessons
    console.log('📝 Publishing lessons...');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .update({ is_published: true })
      .eq('is_published', false)
      .select('id, title');

    if (lessonsError) {
      console.error('❌ Error publishing lessons:', lessonsError.message);
    } else {
      const count = lessons?.length || 0;
      if (count > 0) {
        console.log(`✅ Published ${count} lesson(s):`);
        lessons.forEach(l => console.log(`   - ${l.title}`));
      } else {
        console.log('✅ All lessons already published');
      }
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 All content has been published!');
    console.log('💡 Users can now see all content in their dashboard');
    console.log('💡 User may need to refresh their browser to see the changes');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the publish
publishAllContent();

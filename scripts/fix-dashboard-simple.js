/**
 * Simple script to fix dashboard function by executing SQL directly
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

const SQL = `
DROP FUNCTION IF EXISTS public.get_user_dashboard_v3(UUID) CASCADE;

CREATE FUNCTION public.get_user_dashboard_v3(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = p_user_id;

  SELECT jsonb_build_object(
    'enrollments', (
      SELECT COALESCE(jsonb_agg(enrollment_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', e.id,
          'program_id', e.program_id,
          'course_id', e.course_id,
          'program_name', p.name,
          'course_name', c.title,
          'course_description', c.description,
          'course_image', c.image_url,
          'enrolled_at', e.enrolled_at,
          'completed_at', e.completed_at,
          'overall_progress', COALESCE((SELECT ROUND(AVG(progress_percentage)) FROM user_progress up WHERE up.user_id = p_user_id AND up.enrollment_id = e.id), 0),
          'completed_lessons', COALESCE((SELECT COUNT(*) FROM user_progress up JOIN lessons l ON l.id = up.lesson_id JOIN modules m ON m.id = l.module_id WHERE up.user_id = p_user_id AND up.enrollment_id = e.id AND up.status = 'completed' AND l.is_published = true AND m.is_published = true), 0),
          'total_lessons', COALESCE((SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = e.course_id AND l.is_published = true AND m.is_published = true), 0)
        ) as enrollment_data
        FROM enrollments e
        LEFT JOIN programs p ON p.id = e.program_id
        LEFT JOIN courses c ON c.id = e.course_id
        WHERE e.user_id = p_user_id AND e.status = 'active' AND e.tenant_id = v_tenant_id AND (c.is_active = true OR c.is_active IS NULL)
        ORDER BY e.enrolled_at DESC LIMIT 10
      ) enrollments_subquery
    ),
    'upcoming_sessions', (
      SELECT COALESCE(jsonb_agg(session_data ORDER BY start_time ASC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', l.id,
          'title', l.title,
          'course_name', c.title,
          'start_time', l.start_time,
          'end_time', (l.start_time + (l.duration || ' minutes')::interval),
          'instructor_name', CASE WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN u.first_name || ' ' || u.last_name WHEN u.first_name IS NOT NULL THEN u.first_name ELSE u.email END,
          'zoom_meeting_id', l.zoom_meeting_id
        ) as session_data, l.start_time
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
        LEFT JOIN users u ON u.id = c.instructor_id
        WHERE l.tenant_id = v_tenant_id AND l.start_time IS NOT NULL AND l.start_time > NOW() AND l.zoom_meeting_id IS NOT NULL AND l.is_published = true AND m.is_published = true AND c.is_active = true
        LIMIT 5
      ) sessions_subquery
    ),
    'pending_assignments', '[]'::jsonb,
    'stats', jsonb_build_object(
      'total_courses', (SELECT COUNT(DISTINCT course_id) FROM enrollments e LEFT JOIN courses c ON c.id = e.course_id WHERE e.user_id = p_user_id AND e.status = 'active' AND e.tenant_id = v_tenant_id AND (c.is_active = true OR c.is_active IS NULL)),
      'completed_lessons', (SELECT COUNT(*) FROM user_progress up JOIN lessons l ON l.id = up.lesson_id JOIN modules m ON m.id = l.module_id WHERE up.user_id = p_user_id AND up.status = 'completed' AND up.tenant_id = v_tenant_id AND l.is_published = true AND m.is_published = true),
      'in_progress_lessons', (SELECT COUNT(*) FROM user_progress up JOIN lessons l ON l.id = up.lesson_id JOIN modules m ON m.id = l.module_id WHERE up.user_id = p_user_id AND up.status = 'in_progress' AND up.tenant_id = v_tenant_id AND l.is_published = true AND m.is_published = true),
      'pending_assignments', 0,
      'total_hours_spent', COALESCE((SELECT SUM(time_spent_seconds) / 3600.0 FROM user_progress up JOIN lessons l ON l.id = up.lesson_id JOIN modules m ON m.id = l.module_id WHERE up.user_id = p_user_id AND up.tenant_id = v_tenant_id AND l.is_published = true AND m.is_published = true), 0)
    ),
    'recent_activity', (
      SELECT COALESCE(jsonb_agg(activity_data ORDER BY updated_at DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('id', up.id, 'type', 'lesson_progress', 'lesson_title', l.title, 'course_name', c.title, 'status', up.status, 'timestamp', up.updated_at) as activity_data, up.updated_at
        FROM user_progress up
        JOIN lessons l ON l.id = up.lesson_id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE up.user_id = p_user_id AND up.tenant_id = v_tenant_id AND l.is_published = true AND m.is_published = true AND c.is_active = true
        ORDER BY up.updated_at DESC LIMIT 5
      ) activity_subquery
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
`;

async function fixDashboard() {
  try {
    console.log('🔧 Fixing dashboard function...\n');

    // Use the management API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: SQL })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('💡 Direct API execution not available. Printing SQL to run manually:\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('Copy and paste this into Supabase SQL Editor:');
      console.log('═══════════════════════════════════════════════════════════\n');

      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251121_fix_dashboard_function_end_time.sql');
      const fullSql = fs.readFileSync(migrationPath, 'utf8');
      console.log(fullSql);

      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('After running the SQL, test with:');
      console.log('  node scripts/test-dashboard-function.js');
      return;
    }

    console.log('✅ Dashboard function fixed!\n');

    // Test it
    const { data: users } = await supabase.from('users').select('id, email').limit(1);
    if (users && users.length > 0) {
      const { data: dashboardData, error } = await supabase.rpc('get_user_dashboard_v3', { p_user_id: users[0].id });

      if (error) {
        console.error('❌ Test failed:', error.message);
      } else {
        console.log('✅ Dashboard function working!');
        console.log(`   Enrollments: ${dashboardData?.enrollments?.length || 0}`);
        console.log(`   Upcoming Sessions: ${dashboardData?.upcoming_sessions?.length || 0}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please run this SQL manually in Supabase SQL Editor:\n');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251121_fix_dashboard_function_end_time.sql');
    const fullSql = fs.readFileSync(migrationPath, 'utf8');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(fullSql);
    console.log('═══════════════════════════════════════════════════════════');
  }
}

fixDashboard();

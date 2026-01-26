import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDashboardStats() {
  console.log('Fixing dashboard stats SQL function...\n');

  const sql = `
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

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'enrollments', '[]'::jsonb,
      'upcoming_sessions', '[]'::jsonb,
      'pending_assignments', '[]'::jsonb,
      'recent_attendance', '[]'::jsonb,
      'stats', jsonb_build_object(
        'total_courses', 0,
        'completed_lessons', 0,
        'in_progress_lessons', 0,
        'total_lessons', 0,
        'pending_assignments', 0,
        'total_attendance', 0,
        'attendance_present', 0,
        'attendance_rate', 0
      ),
      'recent_activity', '[]'::jsonb,
      'weekly_activity', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'enrollments', (
      SELECT COALESCE(jsonb_agg(enrollment_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', e.id,
          'program_id', prod.program_id,
          'course_id', prod.course_id,
          'program_name', prog.name,
          'course_name', c.title,
          'course_description', c.description,
          'course_image', c.image_url,
          'product_title', prod.title,
          'enrolled_at', e.enrolled_at,
          'completed_at', e.completed_at,
          'overall_progress', COALESCE((SELECT ROUND(AVG(progress_percentage)) FROM user_progress up WHERE up.user_id = p_user_id AND up.enrollment_id = e.id), 0),
          'completed_lessons', COALESCE((SELECT COUNT(*) FROM user_progress up WHERE up.user_id = p_user_id AND up.enrollment_id = e.id AND up.status = 'completed'), 0),
          'total_lessons', COALESCE((SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = prod.course_id AND prod.course_id IS NOT NULL), 0)
        ) as enrollment_data
        FROM enrollments e
        INNER JOIN products prod ON prod.id = e.product_id
        LEFT JOIN programs prog ON prog.id = prod.program_id
        LEFT JOIN courses c ON c.id = prod.course_id
        WHERE e.user_id = p_user_id AND e.status IN ('active', 'completed', 'pending') AND e.tenant_id = v_tenant_id
        ORDER BY e.enrolled_at DESC LIMIT 10
      ) enrollments_subquery
    ),
    'upcoming_sessions', '[]'::jsonb,
    'pending_assignments', '[]'::jsonb,
    'recent_attendance', '[]'::jsonb,
    'stats', (
      SELECT jsonb_build_object(
        'total_courses', (SELECT COUNT(DISTINCT prod.course_id) FROM enrollments e INNER JOIN products prod ON prod.id = e.product_id WHERE e.user_id = p_user_id AND e.status IN ('active', 'completed', 'pending') AND e.tenant_id = v_tenant_id AND prod.course_id IS NOT NULL),
        'completed_lessons', (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = p_user_id AND up.status = 'completed' AND up.tenant_id = v_tenant_id),
        'in_progress_lessons', (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = p_user_id AND up.status = 'in_progress' AND up.tenant_id = v_tenant_id),
        'total_lessons', (SELECT COUNT(DISTINCT l.id) FROM lessons l JOIN modules m ON l.module_id = m.id JOIN enrollments e ON e.user_id = p_user_id AND e.status IN ('active', 'completed', 'pending') AND e.tenant_id = v_tenant_id JOIN products prod ON prod.id = e.product_id AND prod.course_id = m.course_id WHERE l.tenant_id = v_tenant_id AND prod.course_id IS NOT NULL),
        'pending_assignments', 0,
        'total_attendance', 0,
        'attendance_present', 0,
        'attendance_rate', 0,
        'total_hours_spent', 0,
        'completion_rate', 0,
        'completed_courses', 0
      )
    ),
    'recent_activity', '[]'::jsonb,
    'weekly_activity', '[]'::jsonb
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_user_dashboard_v3 for user %: %', p_user_id, SQLERRM;
    RETURN jsonb_build_object(
      'enrollments', '[]'::jsonb,
      'stats', jsonb_build_object('total_courses', 0, 'completed_lessons', 0, 'in_progress_lessons', 0, 'total_lessons', 0),
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;
  `;

  try {
    // Use raw SQL execution through the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to execute SQL:', errorText);
      console.log('\nPlease run this migration manually in your Supabase SQL editor:');
      console.log('\nsupabase/migrations/20260119210000_add_total_lessons_to_dashboard.sql');
    } else {
      console.log('✅ Dashboard stats function updated successfully!');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    console.log('\nPlease run this migration manually in your Supabase SQL editor:');
    console.log('\nsupabase/migrations/20260119210000_add_total_lessons_to_dashboard.sql');
  }
}

fixDashboardStats().catch(console.error);

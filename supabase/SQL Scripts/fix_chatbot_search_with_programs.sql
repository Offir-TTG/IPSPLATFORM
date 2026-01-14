-- Fix chatbot search functions to support program enrollments
-- This ensures courses from enrolled programs are also searchable

-- Drop existing functions
DROP FUNCTION IF EXISTS get_user_quick_data(uuid, text);
DROP FUNCTION IF EXISTS search_user_content(uuid, text, int);

-- Recreate get_user_quick_data with program enrollment support
CREATE OR REPLACE FUNCTION get_user_quick_data(
  p_user_id uuid,
  p_command text
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  CASE p_command
    WHEN 'my_courses' THEN
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'url', url,
          'course_title', course_title
        )
      ), '[]'::jsonb) INTO result
      FROM (
        SELECT DISTINCT
          c.id,
          c.title,
          '/courses/' || c.id::text as url,
          c.title as course_title
        FROM courses c
        JOIN products prod ON (
          -- Direct course enrollment
          prod.course_id = c.id
          OR
          -- Course from enrolled program (check if program_courses table exists)
          (prod.program_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM program_courses pc
            WHERE pc.program_id = prod.program_id
              AND pc.course_id = c.id
          ))
          OR
          -- Fallback: Course belongs to program (via courses.program_id)
          (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
        )
        JOIN enrollments e ON e.product_id = prod.id
        WHERE e.user_id = p_user_id
          AND e.status IN ('active', 'completed')
          AND c.is_active = true
          AND c.is_published = true
        ORDER BY c.title
      ) courses_data;

    WHEN 'upcoming_lessons' THEN
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'start_time', start_time,
          'course_title', course_title,
          'url', url
        )
      ), '[]'::jsonb) INTO result
      FROM (
        SELECT DISTINCT
          l.id,
          l.title,
          l.start_time,
          c.title as course_title,
          '/courses/' || c.id::text as url
        FROM lessons l
        JOIN courses c ON c.id = l.course_id
        JOIN products prod ON (
          prod.course_id = c.id
          OR
          (prod.program_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM program_courses pc
            WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
          ))
          OR
          (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
        )
        JOIN enrollments e ON e.product_id = prod.id
        WHERE e.user_id = p_user_id
          AND e.status IN ('active', 'completed')
          AND l.start_time > NOW()
          AND l.status = 'scheduled'
          AND c.is_active = true
          AND c.is_published = true
        ORDER BY l.start_time ASC
        LIMIT 10
      ) lessons_data;

    WHEN 'recent_files' THEN
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'file_url', file_url,
          'file_type', file_type,
          'course_title', course_title,
          'created_at', created_at,
          'url', url
        )
      ), '[]'::jsonb) INTO result
      FROM (
        SELECT DISTINCT
          cm.id,
          cm.title,
          cm.file_url,
          cm.file_type,
          c.title as course_title,
          cm.created_at,
          cm.file_url as url
        FROM course_materials cm
        JOIN courses c ON c.id = cm.course_id
        JOIN products prod ON (
          prod.course_id = c.id
          OR
          (prod.program_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM program_courses pc
            WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
          ))
          OR
          (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
        )
        JOIN enrollments e ON e.product_id = prod.id
        WHERE e.user_id = p_user_id
          AND e.status IN ('active', 'completed')
          AND cm.is_published = true
          AND c.is_active = true
          AND c.is_published = true
        ORDER BY cm.created_at DESC
        LIMIT 10
      ) files_data;

    WHEN 'recent_recordings' THEN
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'recording_url', recording_url,
          'start_time', start_time,
          'course_title', course_title,
          'url', url
        )
      ), '[]'::jsonb) INTO result
      FROM (
        SELECT DISTINCT
          l.id,
          l.title,
          l.recording_url,
          l.start_time,
          c.title as course_title,
          l.recording_url as url
        FROM lessons l
        JOIN courses c ON c.id = l.course_id
        JOIN products prod ON (
          prod.course_id = c.id
          OR
          (prod.program_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM program_courses pc
            WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
          ))
          OR
          (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
        )
        JOIN enrollments e ON e.product_id = prod.id
        WHERE e.user_id = p_user_id
          AND e.status IN ('active', 'completed')
          AND l.recording_url IS NOT NULL
          AND l.recording_url != ''
          AND c.is_active = true
          AND c.is_published = true
        ORDER BY l.start_time DESC
        LIMIT 10
      ) recordings_data;

    WHEN 'my_assignments' THEN
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'due_date', due_date,
          'status', status,
          'course_title', course_title,
          'url', url
        )
      ), '[]'::jsonb) INTO result
      FROM (
        SELECT DISTINCT
          a.id,
          a.title,
          a.due_date,
          ua.status,
          c.title as course_title,
          '/courses/' || c.id::text as url
        FROM assignments a
        JOIN user_assignments ua ON ua.assignment_id = a.id
        JOIN courses c ON c.id = a.course_id
        JOIN products prod ON (
          prod.course_id = c.id
          OR
          (prod.program_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM program_courses pc
            WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
          ))
          OR
          (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
        )
        JOIN enrollments e ON e.product_id = prod.id
        WHERE ua.user_id = p_user_id
          AND e.user_id = p_user_id
          AND e.status IN ('active', 'completed')
          AND ua.status IN ('pending', 'submitted')
          AND c.is_active = true
          AND c.is_published = true
        ORDER BY a.due_date ASC
      ) assignments_data;

    ELSE
      result := '[]'::jsonb;
  END CASE;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate search_user_content with program enrollment support
CREATE OR REPLACE FUNCTION search_user_content(
  p_user_id uuid,
  p_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE(
  result_type text,
  result_id uuid,
  result_title text,
  result_description text,
  result_url text,
  result_metadata jsonb,
  relevance real
) AS $$
BEGIN
  -- Search across courses
  RETURN QUERY
  SELECT
    'course'::text as result_type,
    c.id as result_id,
    c.title as result_title,
    c.description as result_description,
    '/courses/' || c.id::text as result_url,
    jsonb_build_object(
      'course_type', c.course_type,
      'start_date', c.start_date,
      'instructor_name', COALESCE(u.first_name || ' ' || u.last_name, 'Unknown')
    ) as result_metadata,
    ts_rank(c.search_vector, plainto_tsquery('simple', p_query)) as relevance
  FROM courses c
  JOIN products prod ON (
    prod.course_id = c.id
    OR
    (prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
    ))
    OR
    (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
  )
  JOIN enrollments e ON e.product_id = prod.id
  LEFT JOIN users u ON u.id = c.instructor_id
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND c.search_vector @@ plainto_tsquery('simple', p_query)
    AND c.is_active = true
    AND c.is_published = true

  UNION ALL

  -- Search across lessons
  SELECT
    'lesson'::text,
    l.id,
    l.title,
    l.description,
    '/courses/' || l.course_id::text || '#lesson-' || l.id::text,
    jsonb_build_object(
      'start_time', l.start_time,
      'duration', l.duration,
      'status', l.status,
      'course_title', c.title
    ),
    ts_rank(l.search_vector, plainto_tsquery('simple', p_query))
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  JOIN products prod ON (
    prod.course_id = c.id
    OR
    (prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
    ))
    OR
    (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
  )
  JOIN enrollments e ON e.product_id = prod.id
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND l.search_vector @@ plainto_tsquery('simple', p_query)
    AND c.is_active = true
    AND c.is_published = true

  UNION ALL

  -- Search across materials
  SELECT
    'file'::text,
    cm.id,
    cm.title,
    cm.description,
    cm.file_url,
    jsonb_build_object(
      'file_type', cm.file_type,
      'file_size', cm.file_size,
      'category', cm.category,
      'course_title', c.title
    ),
    ts_rank(cm.search_vector, plainto_tsquery('simple', p_query))
  FROM course_materials cm
  JOIN courses c ON c.id = cm.course_id
  JOIN products prod ON (
    prod.course_id = c.id
    OR
    (prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
    ))
    OR
    (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
  )
  JOIN enrollments e ON e.product_id = prod.id
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND cm.search_vector @@ plainto_tsquery('simple', p_query)
    AND cm.is_published = true
    AND c.is_active = true
    AND c.is_published = true

  UNION ALL

  -- Search across announcements
  SELECT
    'announcement'::text,
    a.id,
    a.title,
    a.content,
    '/courses/' || a.course_id::text,
    jsonb_build_object(
      'priority', a.priority,
      'published_at', a.published_at,
      'course_title', c.title
    ),
    ts_rank(a.search_vector, plainto_tsquery('simple', p_query))
  FROM announcements a
  JOIN courses c ON c.id = a.course_id
  JOIN products prod ON (
    prod.course_id = c.id
    OR
    (prod.program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM program_courses pc
      WHERE pc.program_id = prod.program_id AND pc.course_id = c.id
    ))
    OR
    (prod.program_id IS NOT NULL AND c.program_id = prod.program_id)
  )
  JOIN enrollments e ON e.product_id = prod.id
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND a.search_vector @@ plainto_tsquery('simple', p_query)
    AND a.is_published = true
    AND c.is_active = true
    AND c.is_published = true

  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_quick_data(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_content(uuid, text, int) TO authenticated;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON enrollments(user_id, status) WHERE status IN ('active', 'completed');
CREATE INDEX IF NOT EXISTS idx_products_course_id ON products(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_program_id ON products(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_active_published ON courses(is_active, is_published) WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_lessons_recording_url ON lessons(recording_url) WHERE recording_url IS NOT NULL AND recording_url != '';
CREATE INDEX IF NOT EXISTS idx_program_courses_lookup ON program_courses(program_id, course_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully updated chatbot search functions with program enrollment support';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions now search across:';
  RAISE NOTICE '  - Direct course enrollments (products.course_id)';
  RAISE NOTICE '  - Program enrollments via program_courses table';
  RAISE NOTICE '  - Program enrollments via courses.program_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance optimizations:';
  RAISE NOTICE '  - Added indexes on enrollments, products, courses';
  RAISE NOTICE '  - Added recording_url index for quick access';
  RAISE NOTICE '  - Added program_courses lookup index';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Rate limiting is configured at 20 searches/minute per user';
END $$;

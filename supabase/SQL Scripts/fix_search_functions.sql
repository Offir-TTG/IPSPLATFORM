-- =====================================================
-- Fix Search Functions - Correct Column Names
-- =====================================================

-- Drop and recreate the search function with correct column names
DROP FUNCTION IF EXISTS search_user_content(uuid, text, int);

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
    ts_rank(c.search_vector, plainto_tsquery('english', p_query)) as relevance
  FROM courses c
  JOIN enrollments e ON e.product_id IN (
    SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
  )
  LEFT JOIN users u ON u.id = c.instructor_id
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND c.search_vector @@ plainto_tsquery('english', p_query)

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
    ts_rank(l.search_vector, plainto_tsquery('english', p_query))
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  JOIN enrollments e ON e.product_id IN (
    SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
  )
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND l.search_vector @@ plainto_tsquery('english', p_query)

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
    ts_rank(cm.search_vector, plainto_tsquery('english', p_query))
  FROM course_materials cm
  JOIN courses c ON c.id = cm.course_id
  JOIN enrollments e ON e.product_id IN (
    SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
  )
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND cm.is_published = true
    AND cm.search_vector @@ plainto_tsquery('english', p_query)

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
    ts_rank(a.search_vector, plainto_tsquery('english', p_query))
  FROM announcements a
  JOIN courses c ON c.id = a.course_id
  JOIN enrollments e ON e.product_id IN (
    SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
  )
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND a.is_published = true
    AND a.search_vector @@ plainto_tsquery('english', p_query)

  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the quick commands function with correct column names
DROP FUNCTION IF EXISTS get_user_quick_data(uuid, text);

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
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'progress', COALESCE(up.progress_percentage, 0),
          'url', '/courses/' || c.id::text
        )
      ) INTO result
      FROM courses c
      JOIN enrollments e ON e.product_id IN (
        SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
      )
      LEFT JOIN LATERAL (
        SELECT AVG(progress_percentage)::int as progress_percentage
        FROM user_progress
        WHERE user_id = p_user_id AND course_id = c.id
      ) up ON true
      WHERE e.user_id = p_user_id AND e.status IN ('active', 'completed');

    WHEN 'upcoming_lessons' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'title', l.title,
          'start_time', l.start_time,
          'course_title', c.title,
          'url', '/courses/' || c.id::text
        )
      ) INTO result
      FROM lessons l
      JOIN courses c ON c.id = l.course_id
      JOIN enrollments e ON e.product_id IN (
        SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
      )
      WHERE e.user_id = p_user_id
        AND e.status IN ('active', 'completed')
        AND l.start_time > NOW()
        AND l.status = 'scheduled'
      ORDER BY l.start_time ASC
      LIMIT 10;

    WHEN 'recent_files' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cm.id,
          'title', cm.title,
          'file_url', cm.file_url,
          'file_type', cm.file_type,
          'course_title', c.title,
          'created_at', cm.created_at
        )
      ) INTO result
      FROM course_materials cm
      JOIN courses c ON c.id = cm.course_id
      JOIN enrollments e ON e.product_id IN (
        SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
      )
      WHERE e.user_id = p_user_id
        AND e.status IN ('active', 'completed')
        AND cm.is_published = true
      ORDER BY cm.created_at DESC
      LIMIT 10;

    WHEN 'my_assignments' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'title', a.title,
          'due_date', a.due_date,
          'status', ua.status,
          'course_title', c.title,
          'url', '/courses/' || c.id::text
        )
      ) INTO result
      FROM assignments a
      JOIN user_assignments ua ON ua.assignment_id = a.id
      JOIN courses c ON c.id = a.course_id
      JOIN enrollments e ON e.product_id IN (
        SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
      )
      WHERE ua.user_id = p_user_id
        AND e.user_id = p_user_id
        AND e.status IN ('active', 'completed')
        AND ua.status IN ('pending', 'submitted')
      ORDER BY a.due_date ASC;

    ELSE
      result := '[]'::jsonb;
  END CASE;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

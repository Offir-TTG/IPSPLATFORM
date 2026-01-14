-- =====================================================
-- Fix Search Functions - Support Hebrew and English
-- =====================================================

-- Update trigger functions to use 'simple' instead of 'english'
-- This allows searching in any language including Hebrew

-- Update search vector for courses
CREATE OR REPLACE FUNCTION update_course_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.course_type, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update search vector for lessons
CREATE OR REPLACE FUNCTION update_lesson_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update search vector for modules
CREATE OR REPLACE FUNCTION update_module_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update search vector for announcements
CREATE OR REPLACE FUNCTION update_announcement_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.content, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update search vector for course materials
CREATE OR REPLACE FUNCTION update_course_material_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.file_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update search function to use 'simple' and correct column names
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
    ts_rank(c.search_vector, plainto_tsquery('simple', p_query)) as relevance
  FROM courses c
  JOIN enrollments e ON e.product_id IN (
    SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
  )
  LEFT JOIN users u ON u.id = c.instructor_id
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND c.search_vector @@ plainto_tsquery('simple', p_query)

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
  JOIN enrollments e ON e.product_id IN (
    SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
  )
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND l.search_vector @@ plainto_tsquery('simple', p_query)

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
  JOIN enrollments e ON e.product_id IN (
    SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
  )
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND cm.is_published = true
    AND cm.search_vector @@ plainto_tsquery('simple', p_query)

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
  JOIN enrollments e ON e.product_id IN (
    SELECT p.id FROM products p WHERE p.type = 'course' AND p.course_id = c.id
  )
  WHERE e.user_id = p_user_id
    AND e.status IN ('active', 'completed')
    AND a.is_published = true
    AND a.search_vector @@ plainto_tsquery('simple', p_query)

  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Regenerate all search vectors with 'simple' configuration
UPDATE courses SET search_vector = to_tsvector('simple',
  coalesce(title, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(course_type, '')
);

UPDATE lessons SET search_vector = to_tsvector('simple',
  coalesce(title, '') || ' ' ||
  coalesce(description, '')
);

UPDATE modules SET search_vector = to_tsvector('simple',
  coalesce(title, '') || ' ' ||
  coalesce(description, '')
);

UPDATE announcements SET search_vector = to_tsvector('simple',
  coalesce(title, '') || ' ' ||
  coalesce(content, '')
);

UPDATE course_materials SET search_vector = to_tsvector('simple',
  coalesce(title, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(file_name, '')
);

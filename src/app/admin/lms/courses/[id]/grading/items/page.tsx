'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Moved: this course page is now the "grades" tab of the course builder.
 * Old links land there.
 */
export default function MovedToCourseTab() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/lms/courses/${params.id}?step=grades`);
  }, [params.id, router]);
  return null;
}

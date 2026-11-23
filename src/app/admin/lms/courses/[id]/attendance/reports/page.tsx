'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Moved: this course page is now the "attendance" tab of the course builder.
 * Old links land there.
 */
export default function MovedToCourseTab() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/lms/courses/${params.id}?step=attendance`);
  }, [params.id, router]);
  return null;
}

/**
 * Which courses a product opens directly (not through a program).
 *
 *  - program: none directly; its courses come from program_courses.
 *  - bundle: every course ticked in the product (contains_courses).
 *  - session_pack: none; it is coaching sessions, not a course.
 *  - course, lecture, workshop, webinar, session, custom: the one course
 *    picked in the product's Content step.
 *
 * Every access check (course list, course page, lesson progress, payment
 * access) uses this, so all product types behave the same everywhere.
 */
export type ProductCourseFields = {
  type?: string | null;
  course_id?: string | null;
  contains_courses?: string[] | null;
};

export function directCourseIds(product: ProductCourseFields | null | undefined): string[] {
  if (!product) return [];
  if (product.type === 'program' || product.type === 'session_pack') return [];
  if (product.type === 'bundle') return (product.contains_courses ?? []).filter(Boolean);
  return product.course_id ? [product.course_id] : [];
}

/** True when the product opens this course directly. */
export function productOpensCourse(product: ProductCourseFields | null | undefined, courseId: string): boolean {
  return directCourseIds(product).includes(courseId);
}

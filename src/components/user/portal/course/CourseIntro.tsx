'use client';

import type { CourseData } from './courseModel';

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** The instructor's photo, or their initials in the space's colour. */
export function InstructorAvatar({ name, url, accent, size = 40 }: { name: string; url: string | null; accent: string; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden="true"
      className="rounded-full shrink-0 grid place-items-center text-white font-rubik font-bold"
      style={{ width: size, height: size, background: accent, fontSize: size * 0.32, direction: /[A-Za-z]/.test(name) ? 'ltr' : 'rtl' }}
    >
      {initials(name)}
    </span>
  );
}

/** A course's instructor, shown up front when the course is open (its description is in "על הקורס"). */
export function CourseIntro({ course, accent }: { course: CourseData['course']; accent: string }) {
  if (!course.instructor) return null;
  return (
    <span className="flex items-center gap-2.5">
      <InstructorAvatar name={course.instructor} url={course.instructor_avatar} accent={accent} />
      <span className="flex flex-col leading-tight">
        <span className="text-[12px] text-[#73698a]">מנחה</span>
        <b className="text-[14.5px] text-[#221a2e]">{course.instructor}</b>
      </span>
    </span>
  );
}

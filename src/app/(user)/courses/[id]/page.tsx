'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SpaceHero, SpaceTab } from '@/components/user/portal/SpaceHero';
import { CourseWorkspace, courseFileCount, useCourse, type CoursePart } from '@/components/user/portal/course/CourseWorkspace';
import { HeroProgress } from '@/components/user/portal/course/HeroProgress';
import { CourseIntro } from '@/components/user/portal/course/CourseIntro';

const DEFAULT_COLOR = '#6b4bb5';

/**
 * A course on its own page. A club's course or a program's course lives
 * inside its club or program page (everything about a space in one place),
 * so it is forwarded there, keeping ?lesson=. The admin's preview stays here.
 */
export default function CourseDetailPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const courseId = params.id as string;
  const preview = search?.get('preview') === '1';
  const lessonParam = search?.get('lesson') ?? null;
  const course = useCourse(courseId, preview);
  const askedPart = search?.get('part') as CoursePart | null;
  const [part, setPart] = useState<CoursePart>(askedPart && ['lessons', 'files', 'about', 'grades', 'attendance'].includes(askedPart) ? askedPart : 'lessons');
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  const places = course.data?.places ?? null;
  const home = places?.club ? `/clubs/${courseId}` : places?.programs[0] ? `/programs/${places.programs[0].programId}` : null;
  useEffect(() => {
    if (!places || preview) return;
    const lesson = lessonParam ? `lesson=${lessonParam}` : '';
    // A part asked for (grades, attendance…) opens as that tab there; a lesson opens in the lessons.
    const tab = askedPart && askedPart !== 'about' ? askedPart : lesson ? 'lessons' : null;
    if (places.club) router.replace(`/clubs/${courseId}${tab ? `?tab=${tab}${lesson ? `&${lesson}` : ''}` : ''}`);
    else if (places.programs[0]) router.replace(`/programs/${places.programs[0].programId}?course=${courseId}${lesson ? `&${lesson}` : ''}${askedPart ? `&part=${askedPart}` : ''}`);
  }, [places, preview, lessonParam, askedPart, courseId, router]);

  if (course.state === 'missing') {
    return (
      <div className="bg-white rounded-[22px] shadow-[0_1px_0_#e9e3f1] p-8 text-center flex flex-col items-center gap-3">
        <b className="font-rubik text-lg">הקורס לא נמצא</b>
        <span className="text-[#73698a] text-sm">ייתכן שאין לך גישה אליו, או שהוא כבר לא זמין.</span>
        <Link href="/dashboard" className="font-semibold text-[#5b3a8e] no-underline">
          → לבית
        </Link>
      </div>
    );
  }
  if (!course.data || (home && !preview)) {
    return (
      <div className="grid place-items-center min-h-[50vh]">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b3a8e]" aria-label="טוענים" />
      </div>
    );
  }

  const { course: info } = course.data;
  // Grades / attendance only when the course uses them (Course → Settings).
  const usesGrades = info.features?.grades !== false;
  const usesAttendance = info.features?.attendance !== false;
  const shown = (part === 'grades' && !usesGrades) || (part === 'attendance' && !usesAttendance) ? 'lessons' : part;
  const color = places?.color ?? DEFAULT_COLOR;
  const { total, doneCount, pct } = course;
  const sub = [info.instructor ? `עם ${info.instructor}` : null, total ? `${total} שיעורים` : null].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <SpaceHero
        color={color}
        kicker="קורס"
        title={info.title}
        sub={sub || null}
        side={total ? <HeroProgress pct={pct} label={`${doneCount} מתוך ${total} הושלמו`} /> : null}
        tabs={
          <>
            <SpaceTab on={shown === 'lessons'} onClick={() => setPart('lessons')}>
              השיעורים
            </SpaceTab>
            <SpaceTab on={shown === 'files'} onClick={() => setPart('files')}>
              קבצים{courseFileCount(course.data) ? ` · ${courseFileCount(course.data)}` : ''}
            </SpaceTab>
            {usesGrades && (
              <SpaceTab on={shown === 'grades'} onClick={() => setPart('grades')}>
                ציונים
              </SpaceTab>
            )}
            {usesAttendance && (
              <SpaceTab on={shown === 'attendance'} onClick={() => setPart('attendance')}>
                נוכחות
              </SpaceTab>
            )}
            <SpaceTab on={shown === 'about'} onClick={() => setPart('about')}>
              על הקורס
            </SpaceTab>
          </>
        }
      />
      {(shown === 'lessons' || shown === 'files') && info.instructor && (
        <section className="bg-white rounded-[22px] p-4 lg:p-[18px] shadow-[0_1px_0_#e9e3f1]">
          <CourseIntro course={info} accent={color} />
        </section>
      )}
      <CourseWorkspace course={course} part={shown} accent={color} lessonId={openLesson ?? lessonParam} onOpenLesson={(id) => { setOpenLesson(id); setPart('lessons'); }} onOpenPart={setPart} />
    </div>
  );
}

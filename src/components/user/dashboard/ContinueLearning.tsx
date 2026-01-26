'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Loader2, LayoutGrid, List, ChevronRight } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  course_id: string | null; // Can be null for program-only enrollments
  course_name: string;
  course_description: string | null;
  course_image: string | null;
  program_id: string | null;
  program_name: string | null;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  overall_progress: number;
  completed_lessons: number;
  total_lessons: number;
}

async function fetchCourses(): Promise<Course[]> {
  const response = await fetch('/api/user/courses');
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch courses');
  }
  return result.data;
}

function getCourseStatus(progress: number, completedLessons: number, totalLessons: number): 'in_progress' | 'completed' | 'not_started' {
  // If no lessons completed, course hasn't started
  if (completedLessons === 0) return 'not_started';
  // If all lessons completed AND there are lessons, course is completed
  if (progress === 100 && totalLessons > 0 && completedLessons === totalLessons) return 'completed';
  // Otherwise, course is in progress
  return 'in_progress';
}

export function ContinueLearning() {
  const { t } = useUserLanguage();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showAll, setShowAll] = useState(false);
  const ITEMS_PER_PAGE = 3;

  // Fetch actual courses from the API
  const { data: courses, isLoading } = useQuery({
    queryKey: ['user-courses'],
    queryFn: fetchCourses,
    staleTime: 0, // Always fetch fresh data to reflect course changes immediately
  });

  async function handleStartCourse(courseId: string) {
    try {
      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error starting course:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">{t('user.dashboard.continue.noCourses', 'No active courses')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('user.dashboard.continue.startLearning', 'Start your learning journey by enrolling in a course')}
        </p>
        <Link href="/courses">
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingInlineStart: '1rem',
              paddingInlineEnd: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              borderRadius: 'calc(var(--radius) * 1.5)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              fontWeight: 'var(--font-weight-medium)',
              transition: 'opacity 0.2s'
            }}
            className="hover:opacity-90"
          >
            {t('user.dashboard.continue.browseCourses', 'Browse Courses')}
          </button>
        </Link>
      </Card>
    );
  }

  // Circular progress component
  const CircularProgress = ({ progress }: { progress: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">{progress}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t('user.dashboard.continue.title', 'Continue Learning')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('user.dashboard.continue.subtitle', 'Pick up where you left off')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-0.5">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="h-7 px-2"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 px-2"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Link href="/courses">
            <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs">
              {t('user.dashboard.continue.viewAll', 'View all')}
              <span>→</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid gap-3">
          {courses.slice(0, showAll ? courses.length : ITEMS_PER_PAGE).map((course, index) => {
            // For program-only enrollments without courses, link to programs page
            const learningLink = course.course_id
              ? `/courses/${course.course_id}`
              : course.program_id
                ? `/programs/${course.program_id}`
                : '#';
            const status = getCourseStatus(course.overall_progress, course.completed_lessons, course.total_lessons);

            return (
              <Card
                key={course.id}
                className="group overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border hover:border-primary/20 animate-fade-up"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Course Image - Smaller */}
                  <Link
                    href={learningLink}
                    className="relative h-32 lg:h-auto lg:w-40 flex-shrink-0 bg-muted overflow-hidden"
                  >
                    {course.course_image ? (
                      <Image
                        src={course.course_image}
                        alt={course.course_name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                        <BookOpen className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                  </Link>

                  {/* Course Info - Compact */}
                  <div className="flex-1 p-3">
                    <div className="flex flex-col lg:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <Link href={learningLink}>
                          <h3 className="text-base font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {course.course_name}
                          </h3>
                        </Link>
                        {course.course_description && (
                          <div
                            className="text-xs text-muted-foreground line-clamp-1 mb-2"
                            dangerouslySetInnerHTML={{
                              __html: course.course_description.replace(/<p>/g, '').replace(/<\/p>/g, '')
                            }}
                          />
                        )}

                        <div className="flex items-center gap-1.5 text-xs mb-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">
                            <strong className="text-foreground">{course.completed_lessons}</strong> / {course.total_lessons} {t('user.dashboard.continue.lessons', 'lessons')}
                          </span>
                        </div>

                        {/* Action Button */}
                        {status === 'not_started' ? (
                          <Button
                            onClick={() => course.course_id && handleStartCourse(course.course_id)}
                            size="sm"
                            className="gap-1 h-7 px-2 text-xs group/btn"
                            disabled={!course.course_id}
                          >
                            {course.course_id
                              ? t('user.courses.actions.start', 'Start')
                              : t('user.courses.actions.comingSoon', 'Coming Soon')
                            }
                            <ChevronRight className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                        ) : (
                          <Link href={learningLink}>
                            <Button size="sm" className="gap-1 h-7 px-2 text-xs group/btn">
                              {t('user.courses.actions.continue', 'Continue')}
                              <ChevronRight className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                            </Button>
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="relative w-12 h-12">
                          <svg className="transform -rotate-90 w-12 h-12">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              className="text-muted"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={2 * Math.PI * 20}
                              strokeDashoffset={2 * Math.PI * 20 - (course.overall_progress / 100) * 2 * Math.PI * 20}
                              className="text-primary transition-all duration-1000"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-foreground">{course.overall_progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {courses.slice(0, showAll ? courses.length : ITEMS_PER_PAGE).map((course, index) => {
            // For program-only enrollments without courses, link to programs page
            const learningLink = course.course_id
              ? `/courses/${course.course_id}`
              : course.program_id
                ? `/programs/${course.program_id}`
                : '#';
            const status = getCourseStatus(course.overall_progress, course.completed_lessons, course.total_lessons);

            return (
              <Card
                key={course.id}
                className="group overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border hover:border-primary/30 animate-fade-up"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Course Image - Smaller */}
                  <Link
                    href={learningLink}
                    className="relative h-14 w-14 flex-shrink-0 bg-muted overflow-hidden rounded-md"
                  >
                    {course.course_image ? (
                      <Image
                        src={course.course_image}
                        alt={course.course_name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                        <BookOpen className="h-7 w-7 text-primary/30" />
                      </div>
                    )}
                  </Link>

                  {/* Course Info - Horizontal Layout */}
                  <div className="flex-1 min-w-0">
                    <Link href={learningLink}>
                      <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {course.course_name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{course.completed_lessons}</strong> / {course.total_lessons}
                      </span>
                    </div>
                  </div>

                  {/* Progress Badge */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-12 h-12">
                      <svg className="transform -rotate-90 w-12 h-12">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 - (course.overall_progress / 100) * 2 * Math.PI * 20}
                          className="text-primary transition-all duration-1000"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-foreground">{course.overall_progress}%</span>
                      </div>
                    </div>

                    {/* Action Button based on status */}
                    <Link href={learningLink}>
                      <Button size="sm" className="gap-1 h-8 px-2 text-xs group/btn">
                        {status === 'not_started' ? t('user.courses.actions.start', 'Start') : t('user.courses.actions.continue', 'Continue')}
                        <ChevronRight className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Show More/Less Button */}
      {courses.length > ITEMS_PER_PAGE && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll
              ? t('user.dashboard.continue.showLess', 'Show Less')
              : `${t('user.dashboard.continue.showMore', 'Show More')} (${courses.length - ITEMS_PER_PAGE})`}
          </Button>
        </div>
      )}
    </div>
  );
}

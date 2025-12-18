'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  Video,
  FileText,
  Award,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import Image from 'next/image';
import { useUserLanguage } from '@/context/AppContext';
import { useQuery } from '@tanstack/react-query';

type CourseStatus = 'all' | 'in_progress' | 'completed' | 'not_started';

interface Course {
  id: string;
  course_id: string;
  course_name: string;
  course_description: string | null;
  course_image: string | null;
  program_id: string | null;
  program_name: string | null;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  expires_at: string | null;
  overall_progress: number;
  completed_lessons: number;
  total_lessons: number;
  instructor: string | null;
  payment_status: string;
  total_amount: number;
  paid_amount: number;
  currency: string;
}

async function fetchCourses(): Promise<Course[]> {
  console.log('Fetching courses from API...');
  const response = await fetch('/api/user/courses', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  console.log('API response status:', response.status);

  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }

  const result = await response.json();
  console.log('API result:', result);

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch courses');
  }

  console.log('Returning courses:', result.data);
  return result.data;
}

function getCourseStatus(progress: number): 'in_progress' | 'completed' | 'not_started' {
  if (progress === 0) return 'not_started';
  if (progress === 100) return 'completed';
  return 'in_progress';
}

function getDefaultImage(courseName: string | null): string {
  // Generate a consistent image based on course name hash
  const images = [
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&h=400&fit=crop',
  ];

  // Return first image if courseName is null
  if (!courseName) {
    return images[0];
  }

  const hash = courseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[hash % images.length];
}

export default function CoursesPage() {
  const { t } = useUserLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CourseStatus>('all');
  const { data: courses, isLoading, error, refetch } = useQuery({
    queryKey: ['user-courses'],
    queryFn: fetchCourses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  async function handleStartCourse(courseId: string) {
    try {
      // Navigate to the course page which will automatically mark it as started
      // when the user views the first lesson or interacts with content
      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error starting course:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--primary))' }} />
          <p style={{
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)'
          }}>{t('user.courses.loading', 'Loading courses...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
            backgroundColor: 'hsl(var(--destructive) / 0.1)'
          }}>
            <BookOpen className="h-8 w-8" style={{ color: 'hsl(var(--destructive))' }} />
          </div>
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'hsl(var(--text-heading))',
            marginBottom: '0.5rem'
          }}>{t('user.courses.errorTitle', 'Failed to load courses')}</h3>
          <p style={{
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)',
            marginBottom: '1rem'
          }}>
            {error instanceof Error ? error.message : t('user.courses.errorMessage', 'An error occurred while loading your courses')}
          </p>
          <button
            onClick={() => refetch()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
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
            {t('user.courses.retry', 'Retry')}
          </button>
        </Card>
      </div>
    );
  }

  const allCourses = courses || [];

  const filteredCourses = allCourses.filter(course => {
    const status = getCourseStatus(course.overall_progress);
    if (activeTab === 'all') return true;
    return status === activeTab;
  });

  const stats = {
    total: allCourses.length,
    in_progress: allCourses.filter(c => getCourseStatus(c.overall_progress) === 'in_progress').length,
    completed: allCourses.filter(c => getCourseStatus(c.overall_progress) === 'completed').length,
    not_started: allCourses.filter(c => getCourseStatus(c.overall_progress) === 'not_started').length
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{
          fontSize: 'var(--font-size-3xl)',
          fontFamily: 'var(--font-family-heading)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'hsl(var(--text-heading))',
          marginBottom: '0.5rem'
        }}>{t('user.courses.title', 'My Courses')}</h1>
        <p style={{
          color: 'hsl(var(--text-muted))',
          fontSize: 'var(--font-size-base)',
          fontFamily: 'var(--font-family-primary)'
        }}>
          {t('user.courses.subtitle', 'Continue learning and track your progress across all courses')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="p-4 ltr:border-l-4 rtl:border-r-4" style={{ borderColor: 'hsl(var(--primary))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>{t('user.courses.stats.total', 'Total Courses')}</p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{stats.total}</p>
            </div>
            <BookOpen className="h-8 w-8" style={{ color: 'hsl(var(--text-muted))', opacity: 0.5 }} />
          </div>
        </Card>

        <Card className="p-4 ltr:border-l-4 rtl:border-r-4" style={{ borderColor: 'hsl(var(--warning))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>{t('user.courses.stats.inProgress', 'In Progress')}</p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{stats.in_progress}</p>
            </div>
            <PlayCircle className="h-8 w-8" style={{ color: 'hsl(var(--warning))', opacity: 0.5 }} />
          </div>
        </Card>

        <Card className="p-4 ltr:border-l-4 rtl:border-r-4" style={{ borderColor: 'hsl(var(--success))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>{t('user.courses.stats.completed', 'Completed')}</p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8" style={{ color: 'hsl(var(--success))', opacity: 0.5 }} />
          </div>
        </Card>

        <Card className="p-4 ltr:border-l-4 rtl:border-r-4" style={{ borderColor: 'hsl(var(--primary))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>{t('user.courses.stats.notStarted', 'Not Started')}</p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{stats.not_started}</p>
            </div>
            <FileText className="h-8 w-8" style={{ color: 'hsl(var(--primary))', opacity: 0.5 }} />
          </div>
        </Card>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CourseStatus)} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">{t('user.courses.tabs.all', 'All')}</TabsTrigger>
          <TabsTrigger value="in_progress">{t('user.courses.tabs.inProgress', 'In Progress')}</TabsTrigger>
          <TabsTrigger value="completed">{t('user.courses.tabs.completed', 'Completed')}</TabsTrigger>
          <TabsTrigger value="not_started">{t('user.courses.tabs.notStarted', 'Not Started')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredCourses.map((course) => {
          const status = getCourseStatus(course.overall_progress);
          const courseImage = course.course_image || getDefaultImage(course.course_name);

          return (
            <Card key={course.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
              {/* Image Header */}
              <div className="relative h-48 bg-muted overflow-hidden">
                <Image
                  src={courseImage}
                  alt={course.course_name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Status Badge */}
                <div className="absolute top-4 ltr:right-4 rtl:left-4">
                  {status === 'completed' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      backgroundColor: 'hsl(var(--success))',
                      color: 'hsl(var(--success-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      <CheckCircle2 className="h-3 w-3" />
                      {t('user.courses.status.completed', 'Completed')}
                    </span>
                  )}
                  {status === 'in_progress' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      backgroundColor: 'hsl(var(--warning))',
                      color: 'hsl(var(--warning-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      <PlayCircle className="h-3 w-3" />
                      {t('user.courses.status.inProgress', 'In Progress')}
                    </span>
                  )}
                  {status === 'not_started' && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--secondary-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      {t('user.courses.status.notStarted', 'Not Started')}
                    </span>
                  )}
                </div>

                {/* Certificate Badge */}
                {status === 'completed' && (
                  <div className="absolute top-4 ltr:left-4 rtl:right-4">
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      backgroundColor: 'hsl(var(--warning))',
                      color: 'hsl(var(--warning-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      <Award className="h-3 w-3" />
                      {t('user.courses.certificate', 'Certificate')}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Program Tag */}
                {course.program_name && (
                  <span style={{
                    display: 'inline-block',
                    paddingInlineStart: '0.625rem',
                    paddingInlineEnd: '0.625rem',
                    paddingTop: '0.25rem',
                    paddingBottom: '0.25rem',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: '0.75rem'
                  }}>
                    {course.program_name}
                  </span>
                )}

                {/* Title */}
                <h3 className="line-clamp-2 group-hover:text-primary transition-colors" style={{
                  fontSize: 'var(--font-size-xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--text-heading))',
                  marginBottom: '0.5rem'
                }}>{course.course_name}</h3>

                {/* Description */}
                {course.course_description && (
                  <div
                    className="line-clamp-2"
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '1rem'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: course.course_description.replace(/<p>/g, '').replace(/<\/p>/g, '')
                    }}
                  />
                )}

                {/* Progress (if started) */}
                {status !== 'not_started' && (
                  <div className="mb-4 pb-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'hsl(var(--text-body))'
                      }}>{t('user.courses.progress', 'Progress')}</span>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'hsl(var(--primary))'
                      }}>{course.overall_progress}%</span>
                    </div>
                    <Progress value={course.overall_progress} className="h-2 mb-2" />
                    <div className="flex items-center justify-between" style={{
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>
                      <span>{course.completed_lessons}/{course.total_lessons} {t('user.courses.lessons', 'lessons')}</span>
                    </div>
                  </div>
                )}

                {/* Course Stats */}
                <div className="flex items-center gap-4 mb-4" style={{
                  fontSize: 'var(--font-size-xs)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))'
                }}>
                  <div className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    <span>{course.total_lessons} {t('user.courses.lessonsCount', 'lessons')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{t('user.courses.enrolledOn', 'Enrolled on')} {new Date(course.enrolled_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {status === 'completed' ? (
                      <>
                        <button
                          style={{
                            flex: 1,
                            paddingInlineStart: '0.75rem',
                            paddingInlineEnd: '0.75rem',
                            paddingTop: '0.5rem',
                            paddingBottom: '0.5rem',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'calc(var(--radius) * 1.5)',
                            backgroundColor: 'transparent',
                            color: 'hsl(var(--text-body))',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            fontFamily: 'var(--font-family-primary)',
                            fontWeight: 'var(--font-weight-medium)',
                            transition: 'background-color 0.2s'
                          }}
                          className="hover:bg-accent"
                        >
                          {t('user.courses.actions.review', 'Review Course')}
                        </button>
                        <button
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            paddingInlineStart: '0.75rem',
                            paddingInlineEnd: '0.75rem',
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
                          <Award className="h-4 w-4" />
                          {t('user.courses.actions.getCertificate', 'Get Certificate')}
                        </button>
                      </>
                    ) : status === 'not_started' ? (
                      <button
                        onClick={() => handleStartCourse(course.course_id || course.id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          paddingInlineStart: '0.75rem',
                          paddingInlineEnd: '0.75rem',
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
                        {t('user.courses.actions.startLearning', 'Start Learning')}
                        <ChevronRight className="h-4 w-4 ltr:ml-1 rtl:mr-1 rtl:rotate-180" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const courseId = course.course_id || course.id;
                          console.log('Continuing course:', courseId);
                          router.push(`/courses/${courseId}`);
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          paddingInlineStart: '0.75rem',
                          paddingInlineEnd: '0.75rem',
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
                        {t('user.courses.actions.continueLearning', 'Continue Learning')}
                        <ChevronRight className="h-4 w-4 ltr:ml-1 rtl:mr-1 rtl:rotate-180" />
                      </button>
                    )}
                  </div>

                  {/* View Grades and Attendance Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button
                      onClick={() => {
                        const courseId = course.course_id || course.id;
                        console.log('Navigating to grades for course:', courseId);
                        router.push(`/courses/${courseId}/grades`);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        paddingInlineStart: '0.75rem',
                        paddingInlineEnd: '0.75rem',
                        paddingTop: '0.625rem',
                        paddingBottom: '0.625rem',
                        border: '2px solid hsl(var(--primary))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        backgroundColor: 'hsl(var(--primary) / 0.05)',
                        color: 'hsl(var(--primary))',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-semibold)',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      className="hover:bg-primary hover:text-primary-foreground"
                    >
                      <GraduationCap className="h-5 w-5" />
                      {t('user.courses.actions.viewGrades', 'View Grades')}
                    </button>

                    <button
                      onClick={() => {
                        const courseId = course.course_id || course.id;
                        router.push(`/courses/${courseId}/attendance`);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        paddingInlineStart: '0.75rem',
                        paddingInlineEnd: '0.75rem',
                        paddingTop: '0.625rem',
                        paddingBottom: '0.625rem',
                        border: '2px solid hsl(var(--secondary))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        backgroundColor: 'hsl(var(--secondary) / 0.05)',
                        color: 'hsl(var(--secondary-foreground))',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-semibold)',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      className="hover:bg-secondary hover:text-secondary-foreground"
                    >
                      <UserCheck className="h-5 w-5" />
                      {t('user.courses.actions.viewAttendance', 'View Attendance')}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
              backgroundColor: 'hsl(var(--muted))'
            }}>
              <BookOpen className="h-8 w-8" style={{ color: 'hsl(var(--text-muted))' }} />
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '0.5rem'
            }}>{t('user.courses.empty.title', 'No courses found')}</h3>
            <p style={{
              color: 'hsl(var(--text-muted))',
              marginBottom: '1.5rem',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {activeTab === 'all'
                ? t('user.courses.empty.noEnrollments', 'You haven\'t enrolled in any courses yet')
                : t('user.courses.empty.noFilteredCourses', `No ${activeTab.replace('_', ' ')} courses`)
              }
            </p>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
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
              {t('user.courses.empty.browseCourses', 'Browse Courses')}
              <ChevronRight className="h-4 w-4 ltr:ml-1 rtl:mr-1 rtl:rotate-180" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

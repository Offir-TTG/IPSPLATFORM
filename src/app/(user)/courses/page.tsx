'use client';

import { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { useDashboard, type Enrollment } from '@/hooks/useDashboard';

type CourseStatus = 'all' | 'in_progress' | 'completed' | 'not_started';

function getCourseStatus(progress: number): 'in_progress' | 'completed' | 'not_started' {
  if (progress === 0) return 'not_started';
  if (progress === 100) return 'completed';
  return 'in_progress';
}

function getDefaultImage(courseName: string): string {
  // Generate a consistent image based on course name hash
  const images = [
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&h=400&fit=crop',
  ];
  const hash = courseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[hash % images.length];
}

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState<CourseStatus>('all');
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--primary))' }} />
          <p style={{
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)'
          }}>Loading courses...</p>
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
          }}>Failed to load courses</h3>
          <p style={{
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            {error instanceof Error ? error.message : 'An error occurred while loading your courses'}
          </p>
        </Card>
      </div>
    );
  }

  const enrollments = data?.enrollments || [];

  const filteredCourses = enrollments.filter(enrollment => {
    const status = getCourseStatus(enrollment.overall_progress);
    if (activeTab === 'all') return true;
    return status === activeTab;
  });

  const stats = {
    total: enrollments.length,
    in_progress: enrollments.filter(e => getCourseStatus(e.overall_progress) === 'in_progress').length,
    completed: enrollments.filter(e => getCourseStatus(e.overall_progress) === 'completed').length,
    not_started: enrollments.filter(e => getCourseStatus(e.overall_progress) === 'not_started').length
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
        }}>My Courses</h1>
        <p style={{
          color: 'hsl(var(--text-muted))',
          fontSize: 'var(--font-size-base)',
          fontFamily: 'var(--font-family-primary)'
        }}>
          Continue learning and track your progress across all courses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="p-4" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>Total Courses</p>
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

        <Card className="p-4" style={{ borderLeft: '4px solid hsl(var(--warning))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>In Progress</p>
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

        <Card className="p-4" style={{ borderLeft: '4px solid hsl(var(--success))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>Completed</p>
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

        <Card className="p-4" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>Not Started</p>
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
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="not_started">Not Started</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredCourses.map((enrollment) => {
          const status = getCourseStatus(enrollment.overall_progress);
          const courseImage = enrollment.course_image || getDefaultImage(enrollment.course_name);

          return (
            <Card key={enrollment.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
              {/* Image Header */}
              <div className="relative h-48 bg-muted overflow-hidden">
                <Image
                  src={courseImage}
                  alt={enrollment.course_name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
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
                      Completed
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
                      In Progress
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
                      Not Started
                    </span>
                  )}
                </div>

                {/* Certificate Badge */}
                {status === 'completed' && (
                  <div className="absolute top-4 left-4">
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
                      Certificate
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Program Tag */}
                {enrollment.program_name && (
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
                    {enrollment.program_name}
                  </span>
                )}

                {/* Title */}
                <h3 className="line-clamp-2 group-hover:text-primary transition-colors" style={{
                  fontSize: 'var(--font-size-xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--text-heading))',
                  marginBottom: '0.5rem'
                }}>{enrollment.course_name}</h3>

                {/* Description */}
                {enrollment.course_description && (
                  <p className="line-clamp-2" style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-muted))',
                    marginBottom: '1rem'
                  }}>
                    {enrollment.course_description}
                  </p>
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
                      }}>Progress</span>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'hsl(var(--primary))'
                      }}>{enrollment.overall_progress}%</span>
                    </div>
                    <Progress value={enrollment.overall_progress} className="h-2 mb-2" />
                    <div className="flex items-center justify-between" style={{
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>
                      <span>{enrollment.completed_lessons}/{enrollment.total_lessons} lessons</span>
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
                    <span>{enrollment.total_lessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Enrollment Date */}
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '1rem'
                }}>
                  Enrolled on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                </p>

                {/* Actions */}
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
                        Review Course
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
                        Get Certificate
                      </button>
                    </>
                  ) : status === 'not_started' ? (
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
                      Start Learning
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
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
                      Continue Learning
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
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
            }}>No courses found</h3>
            <p style={{
              color: 'hsl(var(--text-muted))',
              marginBottom: '1.5rem',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {activeTab === 'all'
                ? 'You haven\'t enrolled in any courses yet'
                : `No ${activeTab.replace('_', ' ')} courses`
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
              Browse Courses
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

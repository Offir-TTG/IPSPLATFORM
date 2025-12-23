'use client';

export const dynamic = 'force-dynamic';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Trophy,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import { useUserLanguage } from '@/context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Program {
  id: string;
  program_id: string;
  name: string;
  description: string;
  image_url: string;
  status: 'active' | 'completed';
  progress: number;
  total_courses: number;
  completed_courses: number;
  enrolled_at: string;
  completed_at: string | null;
  estimated_completion: string | null;
  instructor: string | null;
  total_hours: number;
  hours_completed: number;
  certificate_eligible: boolean;
  courses: Array<{
    id: string;
    title: string;
    status: 'completed' | 'in_progress' | 'not_started';
  }>;
  payment_status: string;
  total_amount: number;
  paid_amount: number;
  currency: string;
}

async function fetchPrograms(): Promise<Program[]> {
  const response = await fetch('/api/user/programs', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch programs');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch programs');
  }

  return result.data;
}

export default function ProgramsPage() {
  const { t } = useUserLanguage();
  const { data: programs, isLoading, error, refetch } = useQuery({
    queryKey: ['user-programs'],
    queryFn: fetchPrograms,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('user.programs.loading', 'Loading your programs...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">{t('user.programs.errorTitle', 'Error loading programs')}</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{t('user.programs.errorMessage', 'Failed to load your programs. Please try again.')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('user.programs.retry', 'Retry')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))'
          }}>{t('user.programs.title', 'My Programs')}</h1>
          <span style={{
            paddingInlineStart: '0.75rem',
            paddingInlineEnd: '0.75rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            backgroundColor: 'hsl(var(--secondary))',
            color: 'hsl(var(--secondary-foreground))',
            borderRadius: 'calc(var(--radius) * 1.5)',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {programs?.length || 0} {t('user.programs.activePrograms', 'Active Programs')}
          </span>
        </div>
        <p style={{
          color: 'hsl(var(--text-muted))',
          fontSize: 'var(--font-size-base)',
          fontFamily: 'var(--font-family-primary)'
        }}>
          {t('user.programs.subtitle', 'Track your learning journey across all enrolled programs')}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
              <BookOpen className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>{t('user.programs.stats.totalPrograms', 'Total Programs')}</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{programs?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--success) / 0.15)' }}>
              <CheckCircle2 className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
            </div>
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>{t('user.programs.stats.completed', 'Completed')}</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>
                {programs?.filter((p: Program) => p.status === 'completed').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--warning) / 0.15)' }}>
              <PlayCircle className="h-5 w-5" style={{ color: 'hsl(var(--warning))' }} />
            </div>
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>{t('user.programs.stats.inProgress', 'In Progress')}</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>
                {programs?.filter((p: Program) => p.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--accent))' }}>
              <Trophy className="h-5 w-5" style={{ color: 'hsl(var(--accent-foreground))' }} />
            </div>
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>{t('user.programs.stats.certificates', 'Certificates')}</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>
                {programs?.filter((p: Program) => p.certificate_eligible).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Programs Grid */}
      <div className="space-y-6">
        {(programs || []).map((program: Program) => (
          <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="md:flex">
              {/* Image */}
              <div className="md:w-80 h-48 md:h-auto relative bg-muted flex-shrink-0">
                <Image
                  src={program.image_url}
                  alt={program.name}
                  fill
                  className="object-cover"
                />
                {program.status === 'completed' && (
                  <div className="absolute top-4 ltr:right-4 rtl:left-4">
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
                      {t('user.programs.card.completed', 'Completed')}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 style={{
                      fontSize: 'var(--font-size-xl)',
                      fontFamily: 'var(--font-family-heading)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'hsl(var(--text-heading))',
                      marginBottom: '0.5rem'
                    }}>{program.name}</h3>
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '0.75rem'
                      }}
                      dangerouslySetInnerHTML={{ __html: program.description }}
                    />

                    {/* Instructor & Dates */}
                    <div className="flex flex-wrap gap-4 mb-4" style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                        <span>{program.instructor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                        <span>{t('user.programs.card.started', 'Started')} {new Date(program.enrolled_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                        <span>{program.hours_completed}/{program.total_hours} {t('user.programs.card.hours', 'hours')}</span>
                      </div>
                    </div>
                  </div>

                  {program.certificate_eligible && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      border: '1px solid hsl(var(--warning))',
                      backgroundColor: 'transparent',
                      color: 'hsl(var(--warning))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      <Trophy className="h-3 w-3" />
                      {t('user.programs.card.certificateReady', 'Certificate Ready')}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-body))'
                    }}>{t('user.programs.card.overallProgress', 'Overall Progress')}</span>
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'hsl(var(--primary))'
                    }}>{program.progress}%</span>
                  </div>
                  <Progress value={program.progress} className="h-2" />
                  <div className="flex items-center justify-between mt-2" style={{
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-muted))'
                  }}>
                    <span>{program.completed_courses}/{program.total_courses} {t('user.programs.card.coursesCompleted', 'courses completed')}</span>
                    {program.status !== 'completed' && program.estimated_completion && (
                      <span>{t('user.programs.card.estCompletion', 'Est. completion')}: {new Date(program.estimated_completion).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Course Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {program.courses.slice(0, 4).map((course: any) => (
                    <span
                      key={course.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        paddingInlineStart: '0.625rem',
                        paddingInlineEnd: '0.625rem',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                        backgroundColor: course.status === 'completed' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                        color: course.status === 'completed' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}
                    >
                      {course.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {course.title}
                    </span>
                  ))}
                  {program.courses.length > 4 && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
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
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      +{program.courses.length - 4} {t('user.programs.card.more', 'more')}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
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
                    {program.status === 'completed' ? t('user.programs.card.viewCertificate', 'View Certificate') : t('user.programs.card.continueLearning', 'Continue Learning')}
                    <ArrowRight className="ltr:ml-2 rtl:mr-2 rtl:rotate-180 h-4 w-4" />
                  </button>
                  <button
                    style={{
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
                      transition: 'background-color 0.2s'
                    }}
                    className="hover:bg-accent"
                  >
                    {t('user.programs.card.viewDetails', 'View Details')}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State (hidden when there are programs) */}
      {(!programs || programs.length === 0) && (
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
            }}>{t('user.programs.empty.title', 'No programs yet')}</h3>
            <p style={{
              color: 'hsl(var(--text-muted))',
              marginBottom: '1.5rem',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('user.programs.empty.description', 'Browse our catalog and enroll in programs to start your learning journey')}
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
              {t('user.programs.empty.browseButton', 'Browse Programs')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

'use client';

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
  Trophy
} from 'lucide-react';
import Image from 'next/image';

// MOCKUP DATA
const mockPrograms = [
  {
    id: '1',
    name: 'Full Stack Web Development Bootcamp',
    description: 'Master modern web development with React, Node.js, and databases. Build production-ready applications.',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    status: 'in_progress',
    progress: 67,
    total_courses: 8,
    completed_courses: 5,
    enrolled_at: '2025-01-15',
    estimated_completion: '2025-06-30',
    instructor: 'Dr. Sarah Johnson',
    total_hours: 240,
    hours_completed: 161,
    certificate_eligible: false,
    courses: [
      { id: 'c1', title: 'HTML & CSS Fundamentals', status: 'completed' },
      { id: 'c2', title: 'JavaScript Mastery', status: 'completed' },
      { id: 'c3', title: 'React.js Development', status: 'in_progress' },
      { id: 'c4', title: 'Node.js & Express', status: 'not_started' },
    ]
  },
  {
    id: '2',
    name: 'Data Science & Machine Learning',
    description: 'Learn Python, statistics, and ML algorithms. Work on real-world data science projects.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    status: 'in_progress',
    progress: 34,
    total_courses: 10,
    completed_courses: 3,
    enrolled_at: '2025-02-01',
    estimated_completion: '2025-09-30',
    instructor: 'Prof. Michael Chen',
    total_hours: 320,
    hours_completed: 109,
    certificate_eligible: false,
    courses: [
      { id: 'c5', title: 'Python for Data Science', status: 'completed' },
      { id: 'c6', title: 'Statistics & Probability', status: 'in_progress' },
    ]
  },
  {
    id: '3',
    name: 'Professional Photography Course',
    description: 'From basics to advanced techniques. Master composition, lighting, and post-processing.',
    image_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=400&fit=crop',
    status: 'completed',
    progress: 100,
    total_courses: 6,
    completed_courses: 6,
    enrolled_at: '2024-09-01',
    estimated_completion: '2024-12-31',
    instructor: 'Emma Rodriguez',
    total_hours: 120,
    hours_completed: 120,
    certificate_eligible: true,
    courses: [
      { id: 'c7', title: 'Camera Basics', status: 'completed' },
      { id: 'c8', title: 'Composition Techniques', status: 'completed' },
      { id: 'c9', title: 'Portrait Photography', status: 'completed' },
    ]
  }
];

export default function ProgramsPage() {
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
          }}>My Programs</h1>
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
            {mockPrograms.length} Active Programs
          </span>
        </div>
        <p style={{
          color: 'hsl(var(--text-muted))',
          fontSize: 'var(--font-size-base)',
          fontFamily: 'var(--font-family-primary)'
        }}>
          Track your learning journey across all enrolled programs
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
              }}>Total Programs</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{mockPrograms.length}</p>
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
              }}>Completed</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>
                {mockPrograms.filter(p => p.status === 'completed').length}
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
              }}>In Progress</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>
                {mockPrograms.filter(p => p.status === 'in_progress').length}
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
              }}>Certificates</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>
                {mockPrograms.filter(p => p.certificate_eligible).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Programs Grid */}
      <div className="space-y-6">
        {mockPrograms.map((program) => (
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
                  <div className="absolute top-4 right-4">
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
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '0.75rem'
                    }}>
                      {program.description}
                    </p>

                    {/* Instructor & Dates */}
                    <div className="flex flex-wrap gap-4 mb-4" style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        <span>{program.instructor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Started {new Date(program.enrolled_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{program.hours_completed}/{program.total_hours} hours</span>
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
                      Certificate Ready
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
                    }}>Overall Progress</span>
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
                    <span>{program.completed_courses}/{program.total_courses} courses completed</span>
                    {program.status !== 'completed' && (
                      <span>Est. completion: {new Date(program.estimated_completion).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Course Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {program.courses.slice(0, 4).map((course) => (
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
                      +{program.courses.length - 4} more
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
                    {program.status === 'completed' ? 'View Certificate' : 'Continue Learning'}
                    <ArrowRight className="ltr:ml-2 rtl:mr-2 h-4 w-4" />
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
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State (hidden when there are programs) */}
      {mockPrograms.length === 0 && (
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
            }}>No programs yet</h3>
            <p style={{
              color: 'hsl(var(--text-muted))',
              marginBottom: '1.5rem',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)'
            }}>
              Browse our catalog and enroll in programs to start your learning journey
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
              Browse Programs
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

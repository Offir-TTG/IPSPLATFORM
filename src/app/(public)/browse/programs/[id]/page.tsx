'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Users, Star, BookOpen, Award,
  CheckCircle, Share2, Heart, BarChart3, Globe,
  Calendar, TrendingUp, Target, Briefcase
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data - will be replaced with actual API call
const mockProgram = {
  id: '1',
  title: 'Full-Stack Web Development Professional Certificate',
  subtitle: 'Master Modern Web Development from Beginner to Professional',
  description: 'This comprehensive program takes you from absolute beginner to job-ready full-stack developer. Through a carefully structured curriculum spanning 6 months, you\'ll master both frontend and backend technologies, build a professional portfolio, and gain the skills needed to launch your tech career.',
  image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
  instructor: {
    name: 'Tech Academy Team',
    title: 'Professional Development Team',
    bio: 'Our expert team of senior developers, instructors, and career coaches has collectively helped over 100,000 students transition into successful tech careers. With decades of combined industry experience at companies like Google, Meta, and Amazon, we know exactly what it takes to land your dream job.',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
    students: 125000,
    programs: 8,
    rating: 4.9
  },
  price: 2499,
  originalPrice: 4999,
  rating: 4.9,
  reviewCount: 8540,
  studentCount: 23450,
  duration: '6 months',
  estimatedTime: '15-20 hours/week',
  totalCourses: 5,
  totalLessons: 428,
  level: 'Beginner to Advanced',
  language: 'English',
  lastUpdated: '2024-01',
  category: 'Web Development',
  tags: ['Full-Stack', 'Career Path', 'Job-Ready', 'Portfolio Projects'],
  outcomes: [
    'Land a job as a Full-Stack Developer',
    'Build and deploy 20+ real-world applications',
    'Master frontend frameworks like React and Vue',
    'Create robust backend APIs with Node.js',
    'Work with databases (SQL and NoSQL)',
    'Implement authentication and security',
    'Use modern DevOps and deployment tools',
    'Build a professional portfolio website'
  ],
  careerSupport: [
    'Resume and portfolio review',
    'Mock interview preparation',
    'LinkedIn profile optimization',
    'Job search strategies and guidance',
    'Access to hiring partners network',
    'Career coaching sessions'
  ],
  requirements: [
    'Basic computer skills',
    'A computer with internet connection',
    'No prior programming experience needed',
    'Commitment of 15-20 hours per week',
    'Willingness to complete projects and assignments'
  ],
  skills: [
    'HTML5 & CSS3',
    'JavaScript (ES6+)',
    'React & Redux',
    'Vue.js',
    'Node.js & Express',
    'MongoDB & PostgreSQL',
    'REST APIs & GraphQL',
    'Git & GitHub',
    'Docker & Kubernetes',
    'AWS & Cloud Deployment',
    'Testing & CI/CD',
    'Agile Methodologies'
  ],
  courses: [
    {
      id: 1,
      title: 'Web Development Fundamentals',
      description: 'Master HTML, CSS, and JavaScript basics. Build responsive websites from scratch.',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      duration: '6 weeks',
      lessons: 82,
      projects: 4,
      skills: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design'],
      order: 1
    },
    {
      id: 2,
      title: 'Modern Frontend Development',
      description: 'Deep dive into React, state management, and modern frontend architecture.',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      duration: '8 weeks',
      lessons: 96,
      projects: 5,
      skills: ['React', 'Redux', 'Vue.js', 'TypeScript'],
      order: 2
    },
    {
      id: 3,
      title: 'Backend Development with Node.js',
      description: 'Build scalable server-side applications with Node.js, Express, and databases.',
      image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479',
      duration: '8 weeks',
      lessons: 102,
      projects: 6,
      skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL'],
      order: 3
    },
    {
      id: 4,
      title: 'Full-Stack Integration & DevOps',
      description: 'Connect frontend and backend, implement authentication, and deploy to production.',
      image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea',
      duration: '6 weeks',
      lessons: 78,
      projects: 4,
      skills: ['REST APIs', 'Authentication', 'Docker', 'AWS'],
      order: 4
    },
    {
      id: 5,
      title: 'Capstone Project & Career Prep',
      description: 'Build your portfolio project and prepare for job interviews with expert guidance.',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
      duration: '6 weeks',
      lessons: 70,
      projects: 3,
      skills: ['Portfolio Development', 'Interview Prep', 'System Design'],
      order: 5
    }
  ],
  stats: [
    { label: 'Average Salary Increase', value: '47%', icon: TrendingUp },
    { label: 'Job Placement Rate', value: '89%', icon: Target },
    { label: 'Portfolio Projects', value: '20+', icon: Briefcase },
    { label: 'Career Support Hours', value: '40+', icon: Users }
  ],
  reviews: [
    {
      id: 1,
      author: 'James Wilson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      rating: 5,
      date: '2024-01-20',
      outcome: 'Landed a job at a Fortune 500 company',
      text: 'This program completely transformed my career. I went from working in retail to landing a $85k/year developer position at a major tech company. The curriculum is comprehensive, the projects are challenging, and the career support is exceptional.'
    },
    {
      id: 2,
      author: 'Maria Garcia',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      rating: 5,
      date: '2024-01-15',
      outcome: 'Started freelancing full-time',
      text: 'I was able to start my own web development freelance business after completing this program. The skills I learned are directly applicable to real-world projects, and my clients are extremely satisfied with my work.'
    },
    {
      id: 3,
      author: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      rating: 5,
      date: '2024-01-10',
      outcome: 'Promoted to Senior Developer',
      text: 'Even though I had some coding experience, this program filled in all my knowledge gaps and taught me best practices I was missing. I got promoted within 3 months of completing the program!'
    }
  ],
  relatedPrograms: [
    {
      id: 2,
      title: 'Data Science Professional Certificate',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
      courses: 6,
      duration: '8 months',
      price: 2999,
      rating: 4.8,
      students: 18200
    },
    {
      id: 3,
      title: 'Mobile App Development Certificate',
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
      courses: 4,
      duration: '5 months',
      price: 2299,
      rating: 4.7,
      students: 12400
    }
  ]
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'outcomes' | 'reviews'>('overview');
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Sticky Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'hsl(var(--background) / 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid hsl(var(--border))'
      }}>
        <div style={{
          maxWidth: '80rem',
          marginInline: 'auto',
          paddingBlock: '1rem',
          paddingInline: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          justifyContent: 'space-between'
        }}>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Browse
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSaved(!isSaved)}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--primary) / 0.15) 100%)',
        paddingBlock: '4rem',
        borderBottom: '1px solid hsl(var(--border))'
      }}>
        <div style={{
          maxWidth: '80rem',
          marginInline: 'auto',
          paddingInline: '1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
            alignItems: 'start'
          }}>
            {/* Left Column */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <Badge style={{ backgroundColor: 'hsl(var(--primary))', color: 'white', fontSize: 'var(--font-size-sm)' }}>
                  🎓 Professional Certificate Program
                </Badge>
              </div>

              <h1 style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.75rem',
                lineHeight: '1.2'
              }}>
                {mockProgram.title}
              </h1>

              <p style={{
                fontSize: 'var(--font-size-lg)',
                color: 'hsl(var(--text-body))',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                {mockProgram.subtitle}
              </p>

              {/* Stats */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    {mockProgram.rating}
                  </span>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>
                    ({mockProgram.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>{mockProgram.studentCount.toLocaleString()} enrolled</span>
                </div>
              </div>

              {/* Program Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))'
              }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))', marginBottom: '0.25rem' }}>
                    Duration
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    <Clock className="h-4 w-4 inline marginInlineEnd-2" />
                    {mockProgram.duration}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))', marginBottom: '0.25rem' }}>
                    Time Commitment
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    <Calendar className="h-4 w-4 inline marginInlineEnd-2" />
                    {mockProgram.estimatedTime}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))', marginBottom: '0.25rem' }}>
                    Courses Included
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    <BookOpen className="h-4 w-4 inline marginInlineEnd-2" />
                    {mockProgram.totalCourses} courses
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))', marginBottom: '0.25rem' }}>
                    Skill Level
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    <BarChart3 className="h-4 w-4 inline marginInlineEnd-2" />
                    {mockProgram.level}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {mockProgram.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Right Column - Enrollment Card */}
            <Card style={{
              position: 'sticky',
              top: '5rem',
              padding: '0',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ position: 'relative', height: '14rem', overflow: 'hidden' }}>
                <Image
                  src={mockProgram.image}
                  alt={mockProgram.title}
                  fill
                  className="object-cover"
                />
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'hsl(var(--background))',
                  borderRadius: 'var(--radius)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  <Award className="h-4 w-4 inline marginInlineEnd-2 text-primary" />
                  Certificate Included
                </div>
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: 'var(--font-size-3xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'hsl(var(--primary))'
                    }}>
                      ${mockProgram.price}
                    </span>
                    <span style={{
                      fontSize: 'var(--font-size-lg)',
                      color: 'hsl(var(--text-muted))',
                      textDecoration: 'line-through'
                    }}>
                      ${mockProgram.originalPrice}
                    </span>
                  </div>
                  <Badge variant="destructive" style={{ fontSize: 'var(--font-size-sm)' }}>
                    Save 50% - Limited Time Offer!
                  </Badge>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'hsl(var(--text-muted))',
                    marginTop: '0.5rem'
                  }}>
                    Or 6 monthly payments of ${Math.round(mockProgram.price / 6)}
                  </div>
                </div>

                <Button size="lg" className="w-full" style={{
                  marginBottom: '0.75rem',
                  fontSize: 'var(--font-size-base)',
                  padding: '1.5rem'
                }}>
                  Enroll in Program
                </Button>
                <Button size="lg" variant="outline" className="w-full" style={{ marginBottom: '2rem' }}>
                  Request Information
                </Button>

                <div style={{
                  paddingBlock: '1.5rem',
                  borderTop: '1px solid hsl(var(--border))',
                  borderBottom: '1px solid hsl(var(--border))',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '1rem'
                  }}>
                    This program includes:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>{mockProgram.totalCourses} comprehensive courses</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>{mockProgram.totalLessons} lessons & projects</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Professional certificate</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Career support & mentorship</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Lifetime access to materials</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Job placement assistance</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                  ✓ 30-day money-back guarantee<br />
                  ✓ Flexible payment plans available
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Stats Section */}
      <div style={{
        backgroundColor: 'hsl(var(--background))',
        paddingBlock: '3rem',
        borderBottom: '1px solid hsl(var(--border))'
      }}>
        <div style={{
          maxWidth: '80rem',
          marginInline: 'auto',
          paddingInline: '1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem'
          }}>
            {mockProgram.stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'hsl(var(--muted) / 0.3)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'hsl(var(--primary))',
                    marginBottom: '0.5rem'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'hsl(var(--text-muted))'
                  }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        position: 'sticky',
        top: '4rem',
        zIndex: 40,
        backgroundColor: 'hsl(var(--background))',
        borderBottom: '1px solid hsl(var(--border))'
      }}>
        <div style={{
          maxWidth: '80rem',
          marginInline: 'auto',
          paddingInline: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'courses' as const, label: 'Courses' },
              { id: 'outcomes' as const, label: 'Outcomes & Career' },
              { id: 'reviews' as const, label: 'Success Stories' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  paddingBlock: '1rem',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: activeTab === tab.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                  color: activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                  borderBottom: activeTab === tab.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{
        maxWidth: '80rem',
        marginInline: 'auto',
        paddingBlock: '3rem',
        paddingInline: '1.5rem'
      }}>
        {activeTab === 'overview' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '3rem'
          }}>
            <div>
              <section style={{ marginBottom: '3rem' }}>
                <h2 style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: '1rem'
                }}>
                  Program Description
                </h2>
                <p style={{
                  fontSize: 'var(--font-size-base)',
                  lineHeight: '1.75',
                  color: 'hsl(var(--text-body))'
                }}>
                  {mockProgram.description}
                </p>
              </section>

              <section style={{ marginBottom: '3rem' }}>
                <h2 style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: '1rem'
                }}>
                  What You'll Achieve
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {mockProgram.outcomes.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: '1rem'
                }}>
                  Requirements
                </h2>
                <ul style={{
                  listStyle: 'disc',
                  paddingInlineStart: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {mockProgram.requirements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div>
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '1rem'
              }}>
                Skills You'll Master
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {mockProgram.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '0.5rem'
              }}>
                Program Curriculum
              </h2>
              <p style={{ color: 'hsl(var(--text-muted))' }}>
                {mockProgram.totalCourses} courses • {mockProgram.totalLessons} lessons • {mockProgram.duration} total program
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {mockProgram.courses.map((course, index) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '16rem 1fr',
                    gap: '0'
                  }}>
                    <div style={{ position: 'relative', height: '12rem', overflow: 'hidden' }}>
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'var(--font-weight-bold)',
                        fontSize: 'var(--font-size-lg)'
                      }}>
                        {course.order}
                      </div>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 'var(--font-weight-semibold)',
                        marginBottom: '0.5rem'
                      }}>
                        {course.title}
                      </h3>
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '1rem',
                        lineHeight: '1.6'
                      }}>
                        {course.description}
                      </p>

                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {course.duration}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {course.lessons} lessons
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
                          <Award className="h-4 w-4 text-muted-foreground" />
                          {course.projects} projects
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {course.skills.map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="outline" style={{ fontSize: '0.75rem' }}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'outcomes' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem'
          }}>
            <div>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '1.5rem'
              }}>
                Career Outcomes
              </h2>

              <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: '1rem'
                }}>
                  What You'll Build
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {mockProgram.outcomes.map((outcome, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: '1rem'
                }}>
                  Job Titles You'll Be Ready For
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    'Full-Stack Developer',
                    'Frontend Engineer',
                    'Backend Developer',
                    'JavaScript Developer',
                    'Web Developer',
                    'Software Engineer'
                  ].map((title, index) => (
                    <Badge key={index} variant="secondary">
                      {title}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '1.5rem'
              }}>
                Career Support
              </h2>

              <Card style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {mockProgram.careerSupport.map((support, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.75rem' }}>
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{support}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '1rem'
              }}>
                Success Stories
              </h2>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: 'hsl(var(--muted) / 0.5)',
                borderRadius: 'var(--radius)'
              }}>
                <div>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'var(--font-weight-bold)',
                    lineHeight: 1
                  }}>
                    {mockProgram.rating}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBlock: '0.5rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(mockProgram.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                    {mockProgram.reviewCount.toLocaleString()} program reviews
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {mockProgram.reviews.map(review => (
                <Card key={review.id} style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      position: 'relative',
                      width: '3.5rem',
                      height: '3.5rem',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <Image
                        src={review.avatar}
                        alt={review.author}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.25rem' }}>
                        {review.author}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <Badge variant="secondary" style={{ fontSize: '0.75rem' }}>
                        {review.outcome}
                      </Badge>
                    </div>
                  </div>
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    lineHeight: '1.75',
                    color: 'hsl(var(--text-body))'
                  }}>
                    {review.text}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Programs */}
      {mockProgram.relatedPrograms.length > 0 && (
        <div style={{
          backgroundColor: 'hsl(var(--muted) / 0.3)',
          paddingBlock: '3rem',
          borderTop: '1px solid hsl(var(--border))'
        }}>
          <div style={{
            maxWidth: '80rem',
            marginInline: 'auto',
            paddingInline: '1.5rem'
          }}>
            <h2 style={{
              fontSize: 'var(--font-size-2xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: '1.5rem'
            }}>
              You Might Also Like
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>
              {mockProgram.relatedPrograms.map(program => (
                <Link
                  key={program.id}
                  href={`/browse/programs/${program.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div style={{ position: 'relative', height: '12rem', overflow: 'hidden' }}>
                      <Image
                        src={program.image}
                        alt={program.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <Badge variant="secondary" style={{ marginBottom: '0.75rem' }}>
                        {program.courses} Courses
                      </Badge>
                      <h3 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 'var(--font-weight-semibold)',
                        marginBottom: '0.75rem',
                        lineHeight: '1.4'
                      }}>
                        {program.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>{program.duration}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                            {program.rating}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--primary))'
                      }}>
                        ${program.price}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

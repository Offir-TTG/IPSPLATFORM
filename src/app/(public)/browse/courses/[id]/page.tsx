'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Users, Star, BookOpen, Award,
  CheckCircle, Play, Download, Share2, Heart,
  BarChart3, Globe, Calendar, Video
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data - will be replaced with actual API call
const mockCourse = {
  id: '1',
  title: 'Complete Web Development Bootcamp',
  subtitle: 'From Zero to Full-Stack Developer',
  description: 'Master web development with hands-on projects. Learn HTML, CSS, JavaScript, React, Node.js, and more. Build real-world applications and get job-ready skills.',
  image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
  instructor: {
    name: 'Dr. Sarah Johnson',
    title: 'Senior Full-Stack Developer',
    bio: 'With 15+ years of experience in web development and teaching, Dr. Johnson has helped over 50,000 students launch their careers in tech.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    students: 52430,
    courses: 12,
    rating: 4.8
  },
  price: 499,
  originalPrice: 899,
  rating: 4.9,
  reviewCount: 12850,
  studentCount: 45230,
  duration: '42 hours',
  lessons: 156,
  level: 'Beginner',
  language: 'English',
  lastUpdated: '2024-01',
  category: 'Web Development',
  tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
  highlights: [
    'Build 15+ real-world projects',
    'Learn modern JavaScript (ES6+)',
    'Master React and Node.js',
    'Understand databases and APIs',
    'Deploy to production',
    'Get career guidance and resume help'
  ],
  requirements: [
    'Basic computer skills',
    'A computer with internet connection',
    'No prior programming experience needed',
    'Motivation to learn and practice'
  ],
  whatYouLearn: [
    'Build responsive websites with HTML, CSS, and JavaScript',
    'Create modern web applications using React',
    'Develop backend APIs with Node.js and Express',
    'Work with databases like MongoDB and PostgreSQL',
    'Deploy applications to cloud platforms',
    'Understand web security best practices',
    'Master version control with Git and GitHub',
    'Implement authentication and authorization'
  ],
  curriculum: [
    {
      section: 'Introduction to Web Development',
      lessons: 8,
      duration: '1.5 hours',
      items: [
        { title: 'Welcome to the Course', duration: '5:30', type: 'video', preview: true },
        { title: 'Setting Up Your Development Environment', duration: '12:45', type: 'video', preview: true },
        { title: 'How the Web Works', duration: '15:20', type: 'video', preview: false },
        { title: 'Your First Web Page', duration: '10:15', type: 'video', preview: false },
        { title: 'Quiz: Web Fundamentals', duration: '5:00', type: 'quiz', preview: false }
      ]
    },
    {
      section: 'HTML & CSS Mastery',
      lessons: 24,
      duration: '6 hours',
      items: [
        { title: 'HTML Basics', duration: '18:30', type: 'video', preview: false },
        { title: 'Semantic HTML', duration: '14:20', type: 'video', preview: false },
        { title: 'CSS Fundamentals', duration: '22:15', type: 'video', preview: false },
        { title: 'Flexbox Layout', duration: '16:40', type: 'video', preview: false },
        { title: 'CSS Grid', duration: '19:25', type: 'video', preview: false }
      ]
    },
    {
      section: 'JavaScript Programming',
      lessons: 32,
      duration: '8.5 hours',
      items: [
        { title: 'JavaScript Basics', duration: '20:15', type: 'video', preview: false },
        { title: 'Functions and Scope', duration: '18:30', type: 'video', preview: false },
        { title: 'Arrays and Objects', duration: '22:45', type: 'video', preview: false },
        { title: 'DOM Manipulation', duration: '25:20', type: 'video', preview: false }
      ]
    },
    {
      section: 'React Development',
      lessons: 28,
      duration: '7 hours',
      items: [
        { title: 'Introduction to React', duration: '16:30', type: 'video', preview: false },
        { title: 'Components and Props', duration: '19:15', type: 'video', preview: false },
        { title: 'State Management', duration: '22:40', type: 'video', preview: false }
      ]
    },
    {
      section: 'Backend Development with Node.js',
      lessons: 26,
      duration: '6.5 hours',
      items: [
        { title: 'Node.js Basics', duration: '17:20', type: 'video', preview: false },
        { title: 'Express Framework', duration: '21:15', type: 'video', preview: false },
        { title: 'RESTful APIs', duration: '24:30', type: 'video', preview: false }
      ]
    },
    {
      section: 'Databases and Deployment',
      lessons: 18,
      duration: '5 hours',
      items: [
        { title: 'MongoDB Basics', duration: '18:45', type: 'video', preview: false },
        { title: 'Database Design', duration: '16:30', type: 'video', preview: false },
        { title: 'Deploying to Production', duration: '22:15', type: 'video', preview: false }
      ]
    },
    {
      section: 'Final Projects',
      lessons: 20,
      duration: '7.5 hours',
      items: [
        { title: 'Project 1: Portfolio Website', duration: '45:00', type: 'project', preview: false },
        { title: 'Project 2: E-commerce App', duration: '60:00', type: 'project', preview: false },
        { title: 'Project 3: Social Media Platform', duration: '75:00', type: 'project', preview: false }
      ]
    }
  ],
  reviews: [
    {
      id: 1,
      author: 'Michael Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      rating: 5,
      date: '2024-01-15',
      text: 'This course completely changed my career! I went from knowing nothing about web development to landing my first job as a junior developer in just 6 months. The projects are challenging but rewarding.'
    },
    {
      id: 2,
      author: 'Emma Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      rating: 5,
      date: '2024-01-10',
      text: 'Best investment I\'ve made in my education. Dr. Johnson explains complex concepts in a way that\'s easy to understand. The hands-on approach really helps solidify the learning.'
    },
    {
      id: 3,
      author: 'David Park',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      rating: 4,
      date: '2024-01-05',
      text: 'Comprehensive course with great content. The only reason I didn\'t give 5 stars is that some videos could be more concise. Overall, highly recommend!'
    }
  ],
  relatedCourses: [
    {
      id: 2,
      title: 'Advanced React Patterns',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      instructor: 'John Smith',
      price: 399,
      rating: 4.7,
      students: 23400
    },
    {
      id: 3,
      title: 'Node.js Backend Development',
      image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479',
      instructor: 'Lisa Anderson',
      price: 449,
      rating: 4.8,
      students: 18200
    },
    {
      id: 4,
      title: 'Full-Stack TypeScript',
      image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea',
      instructor: 'Tom Wilson',
      price: 499,
      rating: 4.9,
      students: 15600
    }
  ]
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [expandedSections, setExpandedSections] = useState<number[]>([0]); // First section expanded by default
  const [isSaved, setIsSaved] = useState(false);

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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
        backgroundColor: 'hsl(var(--muted))',
        paddingBlock: '3rem',
        borderBottom: '1px solid hsl(var(--border))'
      }}>
        <div style={{
          maxWidth: '80rem',
          marginInline: 'auto',
          paddingInline: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem',
          alignItems: 'start'
        }}>
          {/* Left Column - Course Info */}
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              <Badge variant="secondary">{mockCourse.category}</Badge>
            </div>
            <h1 style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '0.5rem'
            }}>
              {mockCourse.title}
            </h1>
            <p style={{
              fontSize: 'var(--font-size-lg)',
              color: 'hsl(var(--text-body))',
              marginBottom: '1.5rem'
            }}>
              {mockCourse.subtitle}
            </p>

            {/* Stats */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  {mockCourse.rating}
                </span>
                <span style={{ color: 'hsl(var(--text-muted))' }}>
                  ({mockCourse.reviewCount.toLocaleString()} reviews)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{mockCourse.studentCount.toLocaleString()} students</span>
              </div>
            </div>

            {/* Instructor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                position: 'relative',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                overflow: 'hidden'
              }}>
                <Image
                  src={mockCourse.instructor.avatar}
                  alt={mockCourse.instructor.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                  {mockCourse.instructor.name}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                  {mockCourse.instructor.title}
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{mockCourse.duration}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{mockCourse.lessons} lessons</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{mockCourse.level}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{mockCourse.language}</span>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {mockCourse.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Right Column - Enrollment Card */}
          <Card style={{
            position: 'sticky',
            top: '5rem',
            padding: '0',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', height: '12rem', overflow: 'hidden' }}>
              <Image
                src={mockCourse.image}
                alt={mockCourse.title}
                fill
                className="object-cover"
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.4)'
              }}>
                <Button size="lg" variant="secondary" style={{
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem'
                }}>
                  <Play className="h-6 w-6" />
                </Button>
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'hsl(var(--primary))'
                  }}>
                    ${mockCourse.price}
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-lg)',
                    color: 'hsl(var(--text-muted))',
                    textDecoration: 'line-through'
                  }}>
                    ${mockCourse.originalPrice}
                  </span>
                  <Badge variant="destructive">44% OFF</Badge>
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                  <Calendar className="h-3.5 w-3.5 inline marginInlineEnd-1" />
                  Sale ends soon!
                </div>
              </div>

              <Button size="lg" className="w-full" style={{ marginBottom: '0.75rem' }}>
                Enroll Now
              </Button>
              <Button size="lg" variant="outline" className="w-full" style={{ marginBottom: '1.5rem' }}>
                Add to Cart
              </Button>

              <div style={{
                paddingBlock: '1rem',
                borderTop: '1px solid hsl(var(--border))',
                borderBottom: '1px solid hsl(var(--border))',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: '0.75rem'
                }}>
                  This course includes:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span>42 hours on-demand video</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>Downloadable resources</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>Certificate of completion</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Access to student community</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                30-day money-back guarantee
              </div>
            </div>
          </Card>
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
              { id: 'curriculum' as const, label: 'Curriculum' },
              { id: 'instructor' as const, label: 'Instructor' },
              { id: 'reviews' as const, label: 'Reviews' }
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 24rem',
          gap: '3rem'
        }}>
          {/* Main Content */}
          <div>
            {activeTab === 'overview' && (
              <div>
                <section style={{ marginBottom: '3rem' }}>
                  <h2 style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '1rem'
                  }}>
                    What you'll learn
                  </h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {mockCourse.whatYouLearn.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.75rem' }}>
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                  <h2 style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '1rem'
                  }}>
                    Description
                  </h2>
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    lineHeight: '1.75',
                    color: 'hsl(var(--text-body))'
                  }}>
                    {mockCourse.description}
                  </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                  <h2 style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '1rem'
                  }}>
                    Course Highlights
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {mockCourse.highlights.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.75rem' }}>
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
                    {mockCourse.requirements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '0.5rem'
                  }}>
                    Course Curriculum
                  </h2>
                  <p style={{ color: 'hsl(var(--text-muted))' }}>
                    {mockCourse.curriculum.length} sections • {mockCourse.lessons} lessons • {mockCourse.duration} total length
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {mockCourse.curriculum.map((section, index) => (
                    <Card key={index} style={{ padding: '0', overflow: 'hidden' }}>
                      <button
                        onClick={() => toggleSection(index)}
                        style={{
                          width: '100%',
                          padding: '1rem 1.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: 'hsl(var(--muted) / 0.5)',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'start'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.25rem' }}>
                            {section.section}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                            {section.lessons} lessons • {section.duration}
                          </div>
                        </div>
                        <div style={{
                          transform: expandedSections.includes(index) ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}>
                          ▼
                        </div>
                      </button>

                      {expandedSections.includes(index) && (
                        <div style={{ padding: '0.5rem 0' }}>
                          {section.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              style={{
                                padding: '0.75rem 1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: itemIndex > 0 ? '1px solid hsl(var(--border))' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {item.type === 'video' && <Play className="h-4 w-4 text-muted-foreground" />}
                                {item.type === 'quiz' && <CheckCircle className="h-4 w-4 text-muted-foreground" />}
                                {item.type === 'project' && <Award className="h-4 w-4 text-muted-foreground" />}
                                <span style={{
                                  fontSize: 'var(--font-size-sm)',
                                  color: item.preview ? 'hsl(var(--primary))' : 'hsl(var(--text-body))'
                                }}>
                                  {item.title}
                                </span>
                                {item.preview && (
                                  <Badge variant="outline" style={{ fontSize: '0.625rem' }}>Preview</Badge>
                                )}
                              </div>
                              <span style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                                {item.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'instructor' && (
              <div>
                <Card style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{
                      position: 'relative',
                      width: '6rem',
                      height: '6rem',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <Image
                        src={mockCourse.instructor.avatar}
                        alt={mockCourse.instructor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 'var(--font-weight-semibold)',
                        marginBottom: '0.25rem'
                      }}>
                        {mockCourse.instructor.name}
                      </h3>
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '1rem'
                      }}>
                        {mockCourse.instructor.title}
                      </p>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1.5rem'
                      }}>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                            Rating
                          </div>
                          <div style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {mockCourse.instructor.rating}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                            Students
                          </div>
                          <div style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)'
                          }}>
                            {mockCourse.instructor.students.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                            Courses
                          </div>
                          <div style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)'
                          }}>
                            {mockCourse.instructor.courses}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    lineHeight: '1.75',
                    color: 'hsl(var(--text-body))'
                  }}>
                    {mockCourse.instructor.bio}
                  </p>
                </Card>
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
                    Student Reviews
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
                        {mockCourse.rating}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBlock: '0.5rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${i < Math.floor(mockCourse.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
                        {mockCourse.reviewCount.toLocaleString()} reviews
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {mockCourse.reviews.map(review => (
                    <Card key={review.id} style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                          position: 'relative',
                          width: '3rem',
                          height: '3rem',
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
                          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                            {new Date(review.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
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

          {/* Sidebar - Related Courses */}
          <div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: '1rem'
            }}>
              Related Courses
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mockCourse.relatedCourses.map(course => (
                <Link
                  key={course.id}
                  href={`/browse/courses/${course.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div style={{ position: 'relative', height: '8rem', overflow: 'hidden' }}>
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <h4 style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        marginBottom: '0.5rem',
                        lineHeight: '1.4'
                      }}>
                        {course.title}
                      </h4>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '0.5rem'
                      }}>
                        {course.instructor}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                            {course.rating}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'hsl(var(--primary))'
                        }}>
                          ${course.price}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

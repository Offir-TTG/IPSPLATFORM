'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Star,
  Clock,
  Video,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Globe,
  Play
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';

// Mock data for landing page
const featuredPrograms = [
  {
    id: '1',
    title: 'Full Stack Web Development',
    description: 'Master React, Node.js, and modern web technologies',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    courses: 12,
    duration: '6 months',
    students: 1250,
    rating: 4.8,
    price: 2999,
    instructor: 'Dr. Sarah Johnson'
  },
  {
    id: '2',
    title: 'Data Science & AI',
    description: 'Learn Python, ML algorithms, and data analysis',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    courses: 15,
    duration: '8 months',
    students: 980,
    rating: 4.9,
    price: 3499,
    instructor: 'Prof. Michael Chen'
  },
  {
    id: '3',
    title: 'Digital Marketing Mastery',
    description: 'SEO, social media, content marketing, and analytics',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    courses: 10,
    duration: '4 months',
    students: 1560,
    rating: 4.7,
    price: 1999,
    instructor: 'Emma Rodriguez'
  }
];

const popularCourses = [
  {
    id: '1',
    title: 'React Advanced Patterns',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    instructor: 'Alex Martinez',
    rating: 4.9,
    students: 2340,
    price: 299,
    duration: '12 hours',
    level: 'Advanced'
  },
  {
    id: '2',
    title: 'Python for Data Science',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop',
    instructor: 'Dr. Lisa Wang',
    rating: 4.8,
    students: 3120,
    price: 249,
    duration: '15 hours',
    level: 'Beginner'
  },
  {
    id: '3',
    title: 'UI/UX Design Fundamentals',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop',
    instructor: 'Sophie Turner',
    rating: 4.7,
    students: 1890,
    price: 199,
    duration: '10 hours',
    level: 'Intermediate'
  },
  {
    id: '4',
    title: 'Node.js & Express API',
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop',
    instructor: 'John Smith',
    rating: 4.8,
    students: 2100,
    price: 279,
    duration: '14 hours',
    level: 'Intermediate'
  }
];

const stats = [
  { icon: Users, label: 'Active Students', value: '10,000+' },
  { icon: BookOpen, label: 'Expert Courses', value: '500+' },
  { icon: Award, label: 'Certifications', value: '50+' },
  { icon: Globe, label: 'Countries', value: '100+' }
];

const categories = [
  { icon: '💻', title: 'Technology', count: 150, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { icon: '📊', title: 'Business', count: 80, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { icon: '🎨', title: 'Design', count: 60, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  { icon: '📸', title: 'Photography', count: 40, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
  { icon: '🎓', title: 'Education', count: 55, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
  { icon: '💼', title: 'Marketing', count: 70, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' }
];

export default function LandingPage() {
  const { t, direction } = useUserLanguage();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
              <span style={{
                fontSize: 'var(--font-size-xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>EduPlatform</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/browse" style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-body))',
                textDecoration: 'none'
              }} className="hover:text-primary transition-colors">
                {t('public.nav.browse', 'Browse')}
              </Link>
              <Link href="/browse?type=programs" style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-body))',
                textDecoration: 'none'
              }} className="hover:text-primary transition-colors">
                {t('public.nav.programs', 'Programs')}
              </Link>
              <Link href="/about" style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-body))',
                textDecoration: 'none'
              }} className="hover:text-primary transition-colors">
                {t('public.nav.about', 'About')}
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <button style={{
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer'
                }} className="hover:bg-accent transition-colors">
                  {t('public.nav.login', 'Login')}
                </button>
              </Link>
              <Link href="/auth/register">
                <button style={{
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  border: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer'
                }} className="hover:opacity-90 transition-opacity">
                  {t('public.nav.signup', 'Sign Up')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'hsl(var(--primary))'
              }}>{t('public.hero.badge', 'Start Learning Today')}</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem',
              lineHeight: '1.2'
            }}>
              {t('public.hero.title', 'Transform Your Future with Expert-Led Learning')}
            </h1>

            <p style={{
              fontSize: 'var(--font-size-lg)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-muted))',
              marginBottom: '2.5rem',
              maxWidth: '42rem',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {t('public.hero.subtitle', 'Join thousands of students learning from industry professionals. Master in-demand skills and advance your career.')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/browse">
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '2rem',
                  paddingInlineEnd: '2rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: 'calc(var(--radius) * 2)',
                  border: 'none',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer'
                }} className="hover:opacity-90 transition-opacity">
                  {t('public.hero.browseCourses', 'Browse Courses')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/browse?type=programs">
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '2rem',
                  paddingInlineEnd: '2rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  border: '2px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 2)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer'
                }} className="hover:bg-accent transition-colors">
                  <Play className="h-5 w-5" />
                  {t('public.hero.viewPrograms', 'View Programs')}
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <stat.icon className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'hsl(var(--text-heading))'
                  }}>{stat.value}</div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-muted))'
                  }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '0.5rem'
            }}>{t('public.programs.title', 'Featured Programs')}</h2>
            <p style={{
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-muted))'
            }}>{t('public.programs.subtitle', 'Comprehensive learning paths to master your skills')}</p>
          </div>
          <Link href="/browse?type=programs" className="hidden md:block">
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingInlineStart: '1rem',
              paddingInlineEnd: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) * 1.5)',
              backgroundColor: 'transparent',
              color: 'hsl(var(--text-body))',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              cursor: 'pointer'
            }} className="hover:bg-accent transition-colors">
              {t('public.viewAll', 'View All')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPrograms.map((program) => (
            <Link key={program.id} href={`/browse/programs/${program.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full" style={{
                    backgroundColor: 'hsl(var(--background))',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    ${program.price}
                  </div>
                </div>
                <div className="p-6">
                  <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'hsl(var(--text-heading))',
                    marginBottom: '0.5rem'
                  }}>{program.title}</h3>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-muted))',
                    marginBottom: '1rem'
                  }}>{program.description}</p>

                  <div className="flex items-center gap-4 mb-4" style={{
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-muted))'
                  }}>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{program.courses} courses</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{program.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1" style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-body))'
                      }}>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{program.rating}</span>
                      </div>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>({program.students})</span>
                    </div>
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--primary))'
                    }} className="flex items-center gap-1">
                      {t('public.learnMore', 'Learn More')}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '0.5rem'
            }}>{t('public.courses.title', 'Popular Courses')}</h2>
            <p style={{
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-muted))'
            }}>{t('public.courses.subtitle', 'Start learning with our most loved courses')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {popularCourses.map((course) => (
              <Link key={course.id} href={`/browse/courses/${course.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded" style={{
                      backgroundColor: 'hsl(var(--background))',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      {course.level}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-heading)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'hsl(var(--text-heading))',
                      marginBottom: '0.5rem'
                    }}>{course.title}</h3>
                    <p style={{
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '0.75rem'
                    }}>{course.instructor}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1" style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-body))'
                      }}>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>({course.students})</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span style={{
                        fontSize: 'var(--font-size-lg)',
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'hsl(var(--text-heading))'
                      }}>${course.price}</span>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>{course.duration}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/browse">
              <button style={{
                paddingInlineStart: '2rem',
                paddingInlineEnd: '2rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) * 2)',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--text-body))',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer'
              }} className="hover:bg-accent transition-colors">
                {t('public.courses.viewAll', 'View All Courses')} →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 style={{
            fontSize: 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))',
            marginBottom: '0.5rem'
          }}>{t('public.categories.title', 'Explore by Category')}</h2>
          <p style={{
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)',
            color: 'hsl(var(--text-muted))'
          }}>{t('public.categories.subtitle', 'Find the perfect course for your interests')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <Link key={index} href={`/browse?category=${category.title.toLowerCase()}`}>
              <Card className={`p-6 text-center hover:shadow-md transition-shadow cursor-pointer ${category.color}`}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem'
                }}>{category.icon}</div>
                <h3 style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: '0.25rem'
                }}>{category.title}</h3>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  opacity: 0.8
                }}>{category.count} courses</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 style={{
            fontSize: 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: '1rem'
          }}>{t('public.cta.title', 'Ready to Start Learning?')}</h2>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            fontFamily: 'var(--font-family-primary)',
            marginBottom: '2rem',
            opacity: 0.9
          }}>{t('public.cta.subtitle', 'Join thousands of students and start your journey today')}</p>
          <Link href="/auth/register">
            <button style={{
              paddingInlineStart: '2.5rem',
              paddingInlineEnd: '2.5rem',
              paddingTop: '1rem',
              paddingBottom: '1rem',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--primary))',
              borderRadius: 'calc(var(--radius) * 2)',
              border: 'none',
              fontSize: 'var(--font-size-lg)',
              fontFamily: 'var(--font-family-primary)',
              fontWeight: 'var(--font-weight-bold)',
              cursor: 'pointer'
            }} className="hover:opacity-90 transition-opacity">
              {t('public.cta.button', 'Get Started Free')}
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
                <span style={{
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)'
                }}>EduPlatform</span>
              </div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>Empowering learners worldwide with quality education.</p>
            </div>

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '1rem'
              }}>Learn</h4>
              <div className="space-y-2">
                <Link href="/browse" style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  textDecoration: 'none',
                  display: 'block'
                }} className="hover:text-primary transition-colors">Browse Courses</Link>
                <Link href="/browse?type=programs" style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  textDecoration: 'none',
                  display: 'block'
                }} className="hover:text-primary transition-colors">Programs</Link>
              </div>
            </div>

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '1rem'
              }}>Company</h4>
              <div className="space-y-2">
                <Link href="/about" style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  textDecoration: 'none',
                  display: 'block'
                }} className="hover:text-primary transition-colors">About Us</Link>
                <Link href="/contact" style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  textDecoration: 'none',
                  display: 'block'
                }} className="hover:text-primary transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '1rem'
              }}>Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy" style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  textDecoration: 'none',
                  display: 'block'
                }} className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  textDecoration: 'none',
                  display: 'block'
                }} className="hover:text-primary transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t text-center">
            <p style={{
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-muted))'
            }}>© 2025 EduPlatform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

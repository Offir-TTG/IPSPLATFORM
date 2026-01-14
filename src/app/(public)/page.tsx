'use client';

export const dynamic = 'force-dynamic';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  Clock,
  GraduationCap,
  Sparkles,
  PlayCircle,
  LayoutGrid,
  List,
  ArrowRight,
  CheckCircle,
  Award,
  Target,
  Lightbulb,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { BackToTop } from '@/components/public/BackToTop';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  title: string;
  description: string;
  image_url: string;
  product_type: 'program' | 'course';
  payment_model: string;
  price?: number;
  currency?: string;
  total_courses?: number;
  total_lessons: number;
  total_hours: number;
  student_count: number;
  instructor?: string | null;
}

export default function LandingPage() {
  const { t, direction } = useUserLanguage();
  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<Product[]>([]);
  const [programs, setPrograms] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [programsView, setProgramsView] = useState<'grid' | 'list'>('list');
  const [coursesView, setCoursesView] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesResponse, programsResponse] = await Promise.all([
        fetch('/api/public/products?type=course&limit=6'),
        fetch('/api/public/products?type=program&limit=6'),
      ]);

      const coursesData = await coursesResponse.json();
      const programsData = await programsResponse.json();

      console.log('Courses API response:', coursesData);
      console.log('Programs API response:', programsData);

      if (coursesData.success && coursesData.products) {
        setCourses(coursesData.products);
        console.log('Set courses:', coursesData.products.length);
      }
      if (programsData.success && programsData.products) {
        setPrograms(programsData.products);
        console.log('Set programs:', programsData.products.length);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to strip HTML tags from description
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  // Helper function to format price display
  const formatPrice = (product: Product) => {
    if (product.payment_model === 'free') {
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">{t('public.products.free', 'Free')}</Badge>;
    }

    if (product.price && product.currency) {
      return (
        <Badge className="bg-background/95 border border-border text-foreground hover:bg-background">
          <span dir="ltr">
            {product.currency} {product.price.toFixed(2)}
          </span>
        </Badge>
      );
    }

    return null;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={direction} suppressHydrationWarning>
      {/* Navigation */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('public.hero.badge', 'Transform Your Learning Journey')}
              </span>
            </div>

            <h1 className="mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl">
              {t('public.hero.title', 'Learn Without Limits')}
            </h1>

            <p className="text-xl text-muted-foreground md:text-2xl">
              {t('public.hero.subtitle', 'Access quality education from expert instructors. Start learning today.')}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">800+</div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">
                {t('public.stats.students', 'Students')}
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">100+</div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">
                {t('public.stats.courses', 'Courses')}
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">30+</div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">
                {t('public.stats.instructors', 'Expert Instructors')}
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">10,000+</div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">
                {t('public.stats.hours', 'Learning Hours')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section id="programs" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-start">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {t('public.programs.badge', 'Structured Learning')}
                </span>
              </div>
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                {t('public.programs.title', 'Featured Programs')}
              </h2>
              <p className="text-lg text-muted-foreground md:text-xl">
                {t('public.programs.subtitle', 'Structured learning paths to master your skills')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={programsView === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setProgramsView('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={programsView === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setProgramsView('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className={programsView === 'grid' ? 'grid gap-8 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className={programsView === 'grid' ? 'h-56 animate-pulse bg-muted' : 'flex gap-4 p-4'}>
                    {programsView === 'list' && <div className="h-32 w-48 flex-shrink-0 animate-pulse bg-muted" />}
                    <div className="space-y-4 p-6">
                      <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : programs.length > 0 ? (
            <div className={programsView === 'grid' ? 'grid gap-8 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {programs.map((program) => (
                <Link key={program.id} href={`/program/${program.id}`}>
                  <Card className={`group overflow-hidden border-2 transition-all hover:border-primary hover:shadow-xl ${programsView === 'list' ? 'flex flex-col md:flex-row' : 'h-full'}`}>
                    <div className={`relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 ${programsView === 'grid' ? 'h-56' : 'h-48 md:h-auto md:w-64 flex-shrink-0'}`}>
                      <Image
                        src={program.image_url}
                        alt={program.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
                            {t('public.programs.program', 'Program')}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        {formatPrice(program)}
                      </div>
                    </div>
                    <div className="p-8 flex-1">
                      <h3 className={`mb-3 font-bold text-foreground transition-colors group-hover:text-primary ${programsView === 'grid' ? 'line-clamp-2 text-xl' : 'text-2xl'}`}>
                        {program.title}
                      </h3>
                      <p className={`mb-4 text-sm text-muted-foreground ${programsView === 'grid' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                        {stripHtml(program.description)}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {(program.total_courses ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium">{program.total_courses} {t('public.programs.courses', 'courses')}</span>
                          </div>
                        )}
                        {program.total_hours > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{program.total_hours} {t('public.programs.hours', 'hours')}</span>
                          </div>
                        )}
                        {program.student_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{program.student_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t('public.programs.noPrograms', 'No programs available at the moment')}
              </p>
            </div>
          )}

          {/* View All Button */}
          {!loading && programs.length > 0 && (
            <div className="mt-12 text-center">
              <Link href="/browse-programs">
                <Button size="lg" variant="outline">
                  {t('public.programs.viewAll', 'View All Programs')}
                  <ArrowRight className={`h-4 w-4 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses */}
      <section id="courses" className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-start">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {t('public.courses.badge', 'Individual Courses')}
                </span>
              </div>
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                {t('public.courses.title', 'Featured Courses')}
              </h2>
              <p className="text-lg text-muted-foreground md:text-xl">
                {t('public.courses.subtitle', 'Start with our most popular standalone courses')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={coursesView === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setCoursesView('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={coursesView === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setCoursesView('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className={coursesView === 'grid' ? 'grid gap-8 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className={coursesView === 'grid' ? 'h-56 animate-pulse bg-muted' : 'flex gap-4 p-4'}>
                    {coursesView === 'list' && <div className="h-32 w-48 flex-shrink-0 animate-pulse bg-muted" />}
                    <div className="space-y-4 p-6">
                      <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className={coursesView === 'grid' ? 'grid gap-8 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {courses.map((course) => (
                <Link key={course.id} href={`/course/${course.id}`}>
                  <Card className={`group overflow-hidden border-2 transition-all hover:border-primary hover:shadow-xl ${coursesView === 'list' ? 'flex flex-col md:flex-row' : 'h-full'}`}>
                    <div className={`relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 ${coursesView === 'grid' ? 'h-56' : 'h-48 md:h-auto md:w-64 flex-shrink-0'}`}>
                      <Image
                        src={course.image_url}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
                            {t('public.courses.course', 'Course')}
                          </div>
                          {course.instructor && (
                            <div className="flex items-center gap-2 text-white">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <Users className="h-3 w-3" />
                              </div>
                              <span className="text-xs font-medium">{course.instructor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        {formatPrice(course)}
                      </div>
                    </div>
                    <div className="p-8 flex-1">
                      <h3 className={`mb-3 font-bold text-foreground transition-colors group-hover:text-primary ${coursesView === 'grid' ? 'line-clamp-2 text-xl' : 'text-2xl'}`}>
                        {course.title}
                      </h3>
                      <p className={`mb-4 text-sm text-muted-foreground ${coursesView === 'grid' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                        {stripHtml(course.description)}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {course.total_lessons > 0 && (
                          <div className="flex items-center gap-1.5">
                            <PlayCircle className="h-4 w-4" />
                            <span className="font-medium">{course.total_lessons} {t('public.courses.lessons', 'lessons')}</span>
                          </div>
                        )}
                        {course.total_hours > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{course.total_hours} {t('public.courses.hours', 'hours')}</span>
                          </div>
                        )}
                        {course.student_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{course.student_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t('public.courses.noCourses', 'No courses available at the moment')}
              </p>
            </div>
          )}

          {/* View All Button */}
          {!loading && courses.length > 0 && (
            <div className="mt-12 text-center">
              <Link href="/browse-courses">
                <Button size="lg" variant="outline">
                  {t('public.courses.viewAll', 'View All Courses')}
                  <ArrowRight className={`h-4 w-4 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t('howItWorks.badge', 'Simple Process')}
              </span>
            </div>
            <h2 className="text-4xl font-bold text-foreground md:text-5xl mb-4">
              {t('howItWorks.title', 'How It Works')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('howItWorks.subtitle', 'Start your learning journey in 4 simple steps')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {/* Step 1 */}
            <Card className="relative p-6 text-center border-2 hover:border-primary transition-colors">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div className="mt-4 mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('howItWorks.step1.title', 'Choose Your Program')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.step1.description', 'Browse our programs and courses to find the perfect fit for your goals')}
              </p>
            </Card>

            {/* Step 2 */}
            <Card className="relative p-6 text-center border-2 hover:border-primary transition-colors">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div className="mt-4 mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('howItWorks.step2.title', 'Enroll & Complete Profile')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.step2.description', 'Sign up, complete your profile, and choose your payment plan')}
              </p>
            </Card>

            {/* Step 3 */}
            <Card className="relative p-6 text-center border-2 hover:border-primary transition-colors">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div className="mt-4 mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('howItWorks.step3.title', 'Learn at Your Pace')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.step3.description', 'Access lessons, participate in live sessions, and engage with the community')}
              </p>
            </Card>

            {/* Step 4 */}
            <Card className="relative p-6 text-center border-2 hover:border-primary transition-colors">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                4
              </div>
              <div className="mt-4 mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('howItWorks.step4.title', 'Get Certified')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.step4.description', 'Complete your program and receive your professional certification')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Accreditation Section */}
      <section className="py-16 md:py-20 border-y bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t('accreditation.badge', 'Accreditation')}
              </span>
            </div>
            <h2 className="text-4xl font-bold text-foreground md:text-5xl mb-6">
              {t('accreditation.title', 'Internationally Recognized Certification')}
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              {t('accreditation.description', 'Our programs are developed in partnership with leading academic institutions and professional organizations')}
            </p>

            <div className="grid gap-8 md:grid-cols-3 mb-12">
              <Card className="p-6 border-2">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {t('accreditation.university.title', 'University Partnership')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('accreditation.university.description', 'Certified by University of Haifa Clinical Center')}
                </p>
              </Card>

              <Card className="p-6 border-2">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {t('accreditation.adler.title', 'Adler Methodology')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('accreditation.adler.description', 'Based on Alfred Adler\'s proven approach to parent guidance')}
                </p>
              </Card>

              <Card className="p-6 border-2">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {t('accreditation.professional.title', 'Professional Recognition')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('accreditation.professional.description', 'Recognized by professional parent guidance associations')}
                </p>
              </Card>
            </div>

            <Link href="/about">
              <Button size="lg">
                {t('accreditation.learnMore', 'Learn More About Our Programs')}
                <ArrowRight className={`h-4 w-4 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {t('faq.badge', 'FAQ')}
                </span>
              </div>
              <h2 className="text-4xl font-bold text-foreground md:text-5xl mb-4">
                {t('faq.title', 'Frequently Asked Questions')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('faq.subtitle', 'Everything you need to know about our programs')}
              </p>
            </div>

            <div className="space-y-4">
              <FAQItem
                question={t('faq.q1.question', 'How long are the programs?')}
                answer={t('faq.q1.answer', 'Program duration varies. Most of our comprehensive parent guidance programs run for 8-12 months, with flexible scheduling to accommodate your needs.')}
              />
              <FAQItem
                question={t('faq.q2.question', 'Are the sessions live or recorded?')}
                answer={t('faq.q2.answer', 'We offer both live online sessions and recorded content. Live sessions allow real-time interaction with instructors, while recordings enable you to learn at your own pace.')}
              />
              <FAQItem
                question={t('faq.q3.question', 'What certification will I receive?')}
                answer={t('faq.q3.answer', 'Upon successful completion, you will receive a professional certification recognized by the University of Haifa Clinical Center and professional parent guidance associations.')}
              />
              <FAQItem
                question={t('faq.q4.question', 'What are the payment options?')}
                answer={t('faq.q4.answer', 'We offer flexible payment plans including one-time payment, deposit with installments, and subscription options. Payment plans can be customized during enrollment.')}
              />
              <FAQItem
                question={t('faq.q5.question', 'Do I need prior experience?')}
                answer={t('faq.q5.answer', 'No prior experience is required for most programs. Our courses are designed for both beginners and those seeking to enhance their existing knowledge in parent guidance.')}
              />
              <FAQItem
                question={t('faq.q6.question', 'Can I access course materials after completion?')}
                answer={t('faq.q6.answer', 'Yes! Once enrolled, you maintain lifetime access to all course materials, allowing you to revisit content whenever needed.')}
              />
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                {t('faq.stillHaveQuestions', 'Still have questions?')}
              </p>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  {t('faq.contactUs', 'Contact Us')}
                  <ArrowRight className={`h-4 w-4 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { direction } = useUserLanguage();

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-semibold text-lg pr-4">{question}</h3>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-muted-foreground">
          <p>{answer}</p>
        </div>
      )}
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Clock,
  Users,
  GraduationCap,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Award,
  Calendar
} from 'lucide-react';
import Image from 'next/image';
import { useUserLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { PublicHeader } from '@/components/public';
import { PublicFooter } from '@/components/public';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  instructor?: string;
  total_lessons: number;
  total_hours: number;
  modules?: Module[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  order: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  image_url: string;
  product_type: string;
  payment_model: string;
  price?: number;
  currency?: string;
  payment_plan?: any;
  requires_signature: boolean;
  completion_benefit?: string;
  completion_description?: string;
  access_duration?: string;
  access_description?: string;
  total_courses?: number;
  total_lessons: number;
  total_hours: number;
  student_count: number;
  program_id?: string;
  program?: {
    id: string;
    name: string;
    description: string;
    image_url: string;
  };
}

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, direction } = useUserLanguage();
  const { toast } = useToast();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/public/products?id=${productId}`);

      if (!response.ok) {
        setError('Product not found or unavailable');
        return;
      }

      const data = await response.json();

      if (!data.success || !data.product) {
        setError('Product not found');
        return;
      }

      setProduct(data.product);

      // Fetch courses if this is a program
      if (data.product.program?.id) {
        await fetchProgramCourses(data.product.program.id);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramCourses = async (programId: string) => {
    try {
      const response = await fetch(`/api/public/programs/${programId}/courses`);

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.courses) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error('Error fetching program courses:', err);
    }
  };

  const cleanDescription = (html: string) => {
    if (!html) return '';
    // Remove all HTML tags to get clean text
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const response = await fetch('/api/public/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          toast({
            title: t('errors.alreadyEnrolled', 'Already Enrolled'),
            description: t('errors.alreadyEnrolled', 'You are already enrolled in this program'),
            variant: 'destructive',
          });
          router.push('/dashboard');
          return;
        }
        throw new Error(error.error || 'Enrollment failed');
      }

      const { enrollment_token } = await response.json();

      // Redirect to enrollment wizard
      router.push(`/enroll/${enrollment_token}`);
    } catch (err: any) {
      toast({
        title: t('errors.enrollmentFailed', 'Enrollment Failed'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const formatPrice = () => {
    if (!product) return null;

    if (product.payment_model === 'free') {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/40 text-xl px-6 py-3 font-bold">
            {t('public.products.free', 'Free')}
          </Badge>
        </div>
      );
    }

    if (product.price && product.currency) {
      return (
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-white" dir="ltr">
              {product.currency} {product.price.toFixed(2)}
            </span>
          </div>
          {product.payment_model === 'deposit_then_plan' && product.payment_plan && (
            <p className="text-sm text-white/80">
              {product.payment_plan.installments} {t('detail.pricing.monthlyPayments', 'monthly payments available')}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={direction} suppressHydrationWarning>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir={direction} suppressHydrationWarning>
        <Card className="max-w-md w-full p-6">
          <Alert variant="destructive">
            <AlertDescription>{error || 'Product not found'}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/')} className="w-full mt-4">
            <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {t('detail.backToHome', 'Back to Home')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction} suppressHydrationWarning>
      {/* Navigation Header */}
      <PublicHeader />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4">
        <Breadcrumbs
          items={[
            { label: t('breadcrumbs.programs', 'Programs'), href: '/browse-programs' },
            { label: product.title },
          ]}
        />
      </div>

      {/* Hero Section */}
      <div className="relative h-[400px] w-full">
        <Image
          src={product.image_url}
          alt={product.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

        {/* Back Button */}
        <div className={`absolute top-4 ${direction === 'rtl' ? 'right-4' : 'left-4'}`}>
          <Button
            variant="secondary"
            onClick={() => router.push('/')}
            className="bg-white/90 hover:bg-white"
          >
            <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {t('detail.back', 'Back')}
          </Button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <Badge className="mb-4 bg-white/20 hover:bg-white/30 text-white border-white/40">
              <GraduationCap className={`h-4 w-4 ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`} />
              {t('public.programs.program', 'Program')}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{product.title}</h1>
            <div className="flex flex-wrap gap-6 text-sm">
              {(product.total_courses ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{product.total_courses} {t('detail.stats.courses', 'Courses')}</span>
                </div>
              )}
              {product.total_lessons > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{product.total_lessons} {t('detail.stats.lessons', 'Lessons')}</span>
                </div>
              )}
              {product.total_hours > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{product.total_hours} {t('detail.stats.hours', 'Hours')}</span>
                </div>
              )}
              {product.student_count > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{product.student_count} {t('detail.stats.students', 'Students Enrolled')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">{t('detail.aboutProgram', 'About This Program')}</h2>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: product.description || '' }}
              />
            </Card>

            {/* Curriculum Section */}
            {courses.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t('detail.curriculum', 'Program Curriculum')}</h2>
                </div>
                <p className="text-muted-foreground mb-6">
                  {courses.length} {t('detail.stats.courses', 'Courses')} • {product.total_lessons} {t('detail.stats.lessons', 'Lessons')} • {product.total_hours} {t('detail.stats.hours', 'Hours')}
                </p>

                <div className="space-y-4">
                  {courses.map((course, index) => (
                    <div key={course.id} className="border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                        className={`w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {course.instructor && (
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>{course.instructor}</span>
                                </div>
                              )}
                              {course.total_lessons > 0 && (
                                <div className="flex items-center gap-1">
                                  <PlayCircle className="h-4 w-4" />
                                  <span>{course.total_lessons} {t('detail.stats.lessons', 'Lessons')}</span>
                                </div>
                              )}
                              {course.total_hours > 0 && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{course.total_hours} {t('detail.stats.hours', 'Hours')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {expandedCourse === course.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      {expandedCourse === course.id && (
                        <div className="border-t border-border bg-muted/30 p-4">
                          {/* Course Description */}
                          {course.description && (
                            <div>
                              <p className="text-sm text-muted-foreground">{cleanDescription(course.description)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Pricing Card */}
              <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
                {/* Gradient Header */}
                <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
                  <div className="mb-4">
                    {formatPrice()}
                  </div>

                  {/* Enroll Button */}
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full text-lg py-6 bg-white text-primary hover:bg-white/90 shadow-md"
                    size="lg"
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className={`h-5 w-5 animate-spin ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                        {t('detail.enrolling', 'Enrolling...')}
                      </>
                    ) : (
                      t('detail.enrollButton', 'Enroll Now')
                    )}
                  </Button>
                </div>

                {/* Program Includes */}
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-lg mb-4">{t('detail.includes', 'This program includes:')}</h3>
                  {(product.total_courses ?? 0) > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{product.total_courses} {t('detail.stats.courses', 'Courses')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('detail.coursesDesc', 'Comprehensive curriculum')}</p>
                      </div>
                    </div>
                  )}
                  {product.total_lessons > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{product.total_lessons} {t('detail.stats.lessons', 'Lessons')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('detail.lessonsDesc', 'Step-by-step learning')}</p>
                      </div>
                    </div>
                  )}
                  {product.total_hours > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{product.total_hours} {t('detail.stats.hours', 'Hours')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('detail.hoursDesc', 'Of video content')}</p>
                      </div>
                    </div>
                  )}
                  {product.completion_benefit && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{product.completion_benefit}</p>
                        {product.completion_description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{product.completion_description}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {product.access_duration && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{product.access_duration}</p>
                        {product.access_description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{product.access_description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}

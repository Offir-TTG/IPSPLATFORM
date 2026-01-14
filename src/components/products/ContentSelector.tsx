'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductType } from '@/types/product';
import { useAdminLanguage } from '@/context/AppContext';
import {
  BookOpen,
  GraduationCap,
  Video,
  Users,
  Sparkles,
  Package,
  Calendar,
  Grid3x3,
  Loader2,
} from 'lucide-react';

interface Program {
  id: string;
  name: string;
  description?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  is_standalone: boolean;
}

interface ContentSelectorProps {
  productType: ProductType;
  onTypeChange: (type: ProductType) => void;
  programId?: string;
  onProgramChange: (id: string | undefined) => void;
  courseId?: string;
  onCourseChange: (id: string | undefined) => void;
  containsCourses?: string[];
  onContainsCoursesChange: (ids: string[]) => void;
  sessionCount?: number;
  onSessionCountChange: (count: number | undefined) => void;
  onContentNameChange?: (name: string) => void;
  validationErrors?: Record<string, string>;
  t: (key: string, fallback: string) => string;
}

export function ContentSelector({
  productType,
  onTypeChange,
  programId,
  onProgramChange,
  courseId,
  onCourseChange,
  containsCourses = [],
  onContainsCoursesChange,
  sessionCount,
  onSessionCountChange,
  onContentNameChange,
  validationErrors = {},
  t,
}: ContentSelectorProps) {
  const { direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContent = async () => {
    try {
      setLoading(true);

      // Fetch programs (correct API path)
      const programsRes = await fetch('/api/programs');
      if (programsRes.ok) {
        const programsData = await programsRes.json();
        // Handle both array and {success, data} response formats
        const programs = Array.isArray(programsData) ? programsData : (programsData?.data || []);
        setPrograms(programs);
      }

      // Fetch courses
      const coursesRes = await fetch('/api/lms/courses');
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        // Handle both array and {success, data} response formats
        const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.data || coursesData?.courses || []);
        setCourses(courses);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch programs and courses on mount
  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update parent's content name when selection changes
  useEffect(() => {
    if (!onContentNameChange) return;

    if (productType === 'program' && programId) {
      const program = programs.find((p) => p.id === programId);
      if (program) {
        onContentNameChange(program.name);
      }
    } else if (productType === 'bundle' && containsCourses.length > 0) {
      const selectedCourses = courses.filter((c) => containsCourses.includes(c.id));
      if (selectedCourses.length > 0) {
        onContentNameChange(`${t('products.bundle', 'Bundle')}: ${selectedCourses.length} ${t('products.courses', 'courses')}`);
      }
    } else if (courseId) {
      // All other types use course selector
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        onContentNameChange(course.title);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType, programId, courseId, containsCourses, programs, courses]);

  const getTypeIcon = (type: ProductType) => {
    switch (type) {
      case 'program':
        return <GraduationCap className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'lecture':
        return <Video className="h-4 w-4" />;
      case 'workshop':
        return <Users className="h-4 w-4" />;
      case 'webinar':
        return <Video className="h-4 w-4" />;
      case 'session':
        return <Calendar className="h-4 w-4" />;
      case 'session_pack':
        return <Package className="h-4 w-4" />;
      case 'bundle':
        return <Grid3x3 className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const handleTypeChange = (type: ProductType) => {
    // Clear previous selections
    onProgramChange(undefined);
    onCourseChange(undefined);
    onContainsCoursesChange([]);
    onSessionCountChange(undefined);

    onTypeChange(type);
  };

  const renderContentPicker = () => {
    // Program type uses program selector
    if (productType === 'program') {
      return (
        <div>
          <Label>{t('products.select_program', 'Select Program')} *</Label>
          <Select value={programId || ''} onValueChange={(val) => onProgramChange(val || undefined)} disabled={loading}>
            <SelectTrigger className={validationErrors.program_id ? 'border-destructive' : ''}>
              <SelectValue placeholder={t('products.select_program_placeholder', 'Choose a program...')} />
            </SelectTrigger>
            <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
              {programs.length === 0 ? (
                <SelectItem value="__no_programs__" disabled>
                  <span suppressHydrationWarning>{loading ? <Loader2 className="h-4 w-4 animate-spin text-primary inline" /> : t('products.no_programs', 'No programs available')}</span>
                </SelectItem>
              ) : (
                programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    <span suppressHydrationWarning>{program.name}</span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {validationErrors.program_id && (
            <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              {validationErrors.program_id}
            </p>
          )}
          {!validationErrors.program_id && programId && (
            <p className="text-xs text-muted-foreground mt-1">
              {programs.find((p) => p.id === programId)?.description}
            </p>
          )}
        </div>
      );
    }

    // Bundle type uses multi-course selector
    if (productType === 'bundle') {
      return (
        <div>
          <Label>{t('products.select_courses_bundle', 'Select Courses for Bundle')} *</Label>
          <div className={`border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto ${validationErrors.contains_courses ? 'border-destructive' : ''}`}>
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            {!loading && courses.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                {t('products.no_courses', 'No courses available')}
              </div>
            )}
            {courses.map((course) => (
              <div key={course.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`course-${course.id}`}
                  checked={containsCourses.includes(course.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onContainsCoursesChange([...containsCourses, course.id]);
                    } else {
                      onContainsCoursesChange(containsCourses.filter((id) => id !== course.id));
                    }
                  }}
                />
                <label
                  htmlFor={`course-${course.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {course.title}
                </label>
              </div>
            ))}
          </div>
          {validationErrors.contains_courses && (
            <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              {validationErrors.contains_courses}
            </p>
          )}
          {!validationErrors.contains_courses && containsCourses.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {containsCourses.map((id) => {
                const course = courses.find((c) => c.id === id);
                return course ? (
                  <Badge key={id} variant="secondary">
                    {course.title}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      );
    }

    // Session pack uses session count input
    if (productType === 'session_pack') {
      return (
        <div>
          <Label>{t('products.session_count', 'Number of Sessions')} *</Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={sessionCount || ''}
            onChange={(e) => onSessionCountChange(parseInt(e.target.value) || undefined)}
            placeholder={t('products.session_count_placeholder', 'e.g., 10')}
            className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.session_count ? 'border-destructive' : ''}`}
          />
          {validationErrors.session_count && (
            <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              {validationErrors.session_count}
            </p>
          )}
          {!validationErrors.session_count && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('products.session_count_desc', 'Number of sessions included in this pack')}
            </p>
          )}
        </div>
      );
    }

    // All other types (course, lecture, workshop, webinar, session, custom) use course selector
    return (
      <div>
        <Label>
          {productType === 'course'
            ? t('products.select_course', 'Select Course')
            : t('products.select_course_for_type', 'Select Course')} *
        </Label>
        <Select value={courseId || ''} onValueChange={(val) => onCourseChange(val || undefined)} disabled={loading}>
          <SelectTrigger className={validationErrors.course_id ? 'border-destructive' : ''}>
            <SelectValue placeholder={t('products.select_course_placeholder', 'Choose a course...')} />
          </SelectTrigger>
          <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
            {courses.length === 0 ? (
              <SelectItem value="__no_courses__" disabled>
                <span suppressHydrationWarning>{loading ? <Loader2 className="h-4 w-4 animate-spin text-primary inline" /> : t('products.no_courses', 'No courses available')}</span>
              </SelectItem>
            ) : (
              courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <span suppressHydrationWarning>{course.title}</span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {validationErrors.course_id && (
          <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
            {validationErrors.course_id}
          </p>
        )}
        {!validationErrors.course_id && courseId && (
          <p className="text-xs text-muted-foreground mt-1">
            {courses.find((c) => c.id === courseId)?.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Product Type Selector */}
      <div>
        <Label>{t('products.product_type', 'Product Type')} *</Label>
        <Select value={productType} onValueChange={(value) => handleTypeChange(value as ProductType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
            <SelectItem value="program">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.program', 'Program')}</span>
              </div>
            </SelectItem>
            <SelectItem value="course">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.course', 'Course')}</span>
              </div>
            </SelectItem>
            <SelectItem value="bundle">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.bundle', 'Bundle')}</span>
              </div>
            </SelectItem>
            <SelectItem value="session_pack">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.session_pack', 'Session Pack')}</span>
              </div>
            </SelectItem>
            <SelectItem value="lecture">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.lecture', 'Lecture')}</span>
              </div>
            </SelectItem>
            <SelectItem value="workshop">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.workshop', 'Workshop')}</span>
              </div>
            </SelectItem>
            <SelectItem value="webinar">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.webinar', 'Webinar')}</span>
              </div>
            </SelectItem>
            <SelectItem value="session">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.session', 'Session')}</span>
              </div>
            </SelectItem>
            <SelectItem value="custom">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span suppressHydrationWarning>{t('products.type.custom', 'Custom')}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {t('products.type_desc', 'Select the type of content this product will provide access to')}
        </p>
      </div>

      {/* Content Picker */}
      {renderContentPicker()}
    </div>
  );
}

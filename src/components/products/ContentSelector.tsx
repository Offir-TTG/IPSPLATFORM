'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ContentPicker, type PickerItem } from './ContentPicker';
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
  Repeat,
} from 'lucide-react';

/** The product types as choice cards, each with its picture. "Club" is not a
 *  type of its own: it saves a course product sold as a monthly membership,
 *  which is what the portal shows as a club. */
type TypeCard = ProductType | 'club';
const PRODUCT_TYPE_CARDS: { value: TypeCard; icon: typeof BookOpen; fallback: string }[] = [
  { value: 'program', icon: GraduationCap, fallback: 'Program' },
  { value: 'course', icon: BookOpen, fallback: 'Course' },
  { value: 'club', icon: Repeat, fallback: 'Club' },
  { value: 'bundle', icon: Grid3x3, fallback: 'Bundle' },
  { value: 'session_pack', icon: Package, fallback: 'Personal guidance' },
  { value: 'lecture', icon: Video, fallback: 'Lecture' },
  { value: 'workshop', icon: Users, fallback: 'Workshop' },
  { value: 'webinar', icon: Video, fallback: 'Webinar' },
  { value: 'session', icon: Calendar, fallback: 'Session' },
  { value: 'custom', icon: Sparkles, fallback: 'Custom' },
];

interface Program {
  id: string;
  name: string;
  description?: string;
  image_url?: string | null;
  course_count?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  is_standalone: boolean;
  course_type?: string | null;
  image_url?: string | null;
  start_date?: string | null;
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
  /** The product is a club (a course sold as a monthly membership). */
  isClub?: boolean;
  /** "Club" was chosen; the editor sets the membership payment. */
  onClubSelect?: () => void;
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
  isClub = false,
  onClubSelect,
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

  // Fetch programs and courses on mount, and again when the admin comes back
  // to this tab (after creating a course or program from the picker's link).
  useEffect(() => {
    fetchContent();
    const onFocus = () => {
      if (document.visibilityState === 'visible') fetchContent();
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
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

  const handleTypeChange = (card: TypeCard) => {
    // Clear previous selections
    onProgramChange(undefined);
    onCourseChange(undefined);
    onContainsCoursesChange([]);
    onSessionCountChange(undefined);

    onTypeChange(card === 'club' ? 'course' : card);
    if (card === 'club') onClubSelect?.();
  };

  const dateText = (d?: string | null) => {
    if (!d) return '';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  };
  const courseKind = (c: Course) =>
    c.course_type === 'lecture'
      ? { key: 'lecture', label: t('lms.course.type_lecture', 'Lecture') }
      : { key: 'course', label: t('lms.course.type_course', 'Course') };
  const courseItems: PickerItem[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    meta: c.start_date ? t('products.picker.starts', 'Starts {date}').replace('{date}', dateText(c.start_date)) : '',
    kind: courseKind(c),
    imageUrl: c.image_url || null,
  }));
  const programItems: PickerItem[] = programs.map((p) => ({
    id: p.id,
    title: p.name,
    meta: typeof p.course_count === 'number' ? t('products.picker.courseCount', '{n} courses').replace('{n}', String(p.course_count)) : '',
    imageUrl: p.image_url || null,
  }));
  const common = {
    loading,
    allLabel: t('products.picker.all', 'All'),
    dir: direction as 'ltr' | 'rtl',
    t,
  };

  const renderContentPicker = () => {
    // A program: pick one program.
    if (productType === 'program') {
      return (
        <ContentPicker
          {...common}
          label={t('products.picker.programLabel', 'Which program does the product open?')}
          hint={t('products.picker.programHint', 'Search by name and choose one program.')}
          items={programItems}
          value={programId}
          onChange={onProgramChange}
          error={validationErrors.program_id}
          searchPlaceholder={t('products.picker.programSearch', 'Search a program by name...')}
          emptyText={t('products.no_programs', 'No programs available')}
          noneFoundText={t('products.picker.programNoneFound', 'No program by that name.')}
          createLabel={t('products.picker.programCreate', 'Program not listed? Create a new program')}
          createHref="/admin/lms/programs/new"
        />
      );
    }

    // A bundle: pick several courses.
    if (productType === 'bundle') {
      return (
        <ContentPicker
          {...common}
          multiple
          label={t('products.picker.bundleLabel', 'Which courses are in the bundle?')}
          hint={t('products.picker.bundleHint', 'You can choose several courses. Chosen courses show on top; ✕ removes one.')}
          items={courseItems}
          values={containsCourses}
          onChangeMany={onContainsCoursesChange}
          error={validationErrors.contains_courses}
          searchPlaceholder={t('products.picker.courseSearch', 'Search a course by name...')}
          emptyText={t('products.no_courses', 'No courses available')}
          noneFoundText={t('products.picker.courseNoneFound', 'No course by that name.')}
          createLabel={t('products.picker.courseCreateMissing', 'Course missing? Create a new course')}
          createHref="/admin/lms/courses/new"
        />
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

    // Every other type opens one course: pick one. A club is a course too.
    return (
      <ContentPicker
        {...common}
        label={isClub ? t('products.picker.clubLabel', 'Which course is the club?') : t('products.picker.courseLabel', 'Which course does the product open?')}
        hint={
          isClub
            ? t('products.picker.clubHint', 'The club is a course with its meetings and recordings. Its payment is a monthly membership ("Club membership").')
            : t('products.picker.courseHint', 'Search by name and choose one course or lecture.')
        }
        items={courseItems}
        value={courseId}
        onChange={onCourseChange}
        error={validationErrors.course_id}
        searchPlaceholder={t('products.picker.courseSearch', 'Search a course by name...')}
        emptyText={t('products.no_courses', 'No courses available')}
        noneFoundText={t('products.picker.courseNoneFound', 'No course by that name.')}
        createLabel={t('products.picker.courseCreate', 'Course not listed? Create a new course')}
        createHref="/admin/lms/courses/new"
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Product type: one card per kind, with a picture */}
      <div>
        <Label>{t('products.product_type', 'Product Type')} *</Label>
        <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
          {t('products.type_desc', 'Select the type of content this product will provide access to')}
        </p>
        <div role="radiogroup" aria-label={t('products.product_type', 'Product Type')} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PRODUCT_TYPE_CARDS.map(({ value, icon: Icon, fallback }) => {
            const on = value === 'club' ? isClub : productType === value && !(value === 'course' && isClub);
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => handleTypeChange(value)}
                className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  on ? 'border-2 border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${on ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`} aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <span suppressHydrationWarning>{t(`products.type.${value}`, fallback)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Picker */}
      {renderContentPicker()}
    </div>
  );
}

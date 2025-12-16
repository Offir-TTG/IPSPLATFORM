'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  BookOpen,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List,
  X,
  Check,
  Upload,
  Image,
  GraduationCap,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { Course, CourseFilter } from '@/types/lms';

// ============================================================================
// TYPES
// ============================================================================

interface CreateCourseData {
  program_id: string | undefined;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active?: boolean;
  is_standalone?: boolean;
  course_type?: 'course' | 'lecture' | 'workshop' | 'webinar' | 'session' | 'session_pack' | 'bundle' | 'custom';
  is_published?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CoursesListPage() {
  const router = useRouter();
  const { t, direction, language } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Error states for inline display
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Responsive breakpoints
  const isMobile = windowWidth <= 640;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form state for create dialog
  const [newCourse, setNewCourse] = useState<CreateCourseData>({
    program_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
    is_standalone: false,
    course_type: 'course',
    is_published: false,
  });

  // Form state for edit dialog
  const [editCourse, setEditCourse] = useState<CreateCourseData>({
    program_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
    is_standalone: false,
    course_type: 'course',
    is_published: false,
  });

  // Form state for duplicate dialog
  const [duplicateCourse, setDuplicateCourse] = useState<CreateCourseData>({
    program_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
    is_standalone: false,
    course_type: 'course',
    is_published: false,
  });

  // Load programs
  const loadPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      const result = await response.json();
      if (result.success) {
        setPrograms(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  };

  // Load courses
  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== 'all') {
        params.append('is_active', statusFilter === 'active' ? 'true' : 'false');
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/lms/courses?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setCourses(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load programs and courses on mount and when filters change
  useEffect(() => {
    loadPrograms();
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery]);

  // Upload image through server-side API for proper authentication
  const uploadCourseImage = async (file: File, courseId?: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (courseId) {
        formData.append('courseId', courseId);
      }

      const response = await fetch('/api/lms/courses/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return result.url;
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Delete image through server-side API
  const deleteCourseImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/lms/courses/upload-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle search
  const handleSearch = () => {
    loadCourses();
  };

  // Handle create course
  const handleCreateCourse = async () => {
    // Reset errors
    setCreateError(null);
    setValidationErrors({});

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!newCourse.title?.trim()) {
      errors.title = t('lms.courses.error.title_required', 'Course title is required');
    }
    // Program is required only if not standalone
    if (!newCourse.is_standalone && !newCourse.program_id) {
      errors.program_id = t('lms.courses.error.program_required', 'Please select a program');
    }
    // Standalone courses should not have a program
    if (newCourse.is_standalone && newCourse.program_id) {
      errors.program_id = t('lms.course.error_standalone_cannot_have_program', 'Standalone courses cannot be part of a program');
    }
    if (!newCourse.start_date) {
      errors.start_date = t('lms.courses.error.start_date_required', 'Start date is required');
    }
    // Validate end date is after start date if provided
    if (newCourse.end_date && newCourse.start_date && newCourse.end_date < newCourse.start_date) {
      errors.end_date = t('lms.courses.error.end_date_invalid', 'End date must be after start date');
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Don't set a generic error - the specific field errors will show
      return;
    }

    try {
      setCreateLoading(true);

      let uploadedImageUrl: string | null = null;

      // Upload image if there's a new file
      if (imageFile) {
        try {
          uploadedImageUrl = await uploadCourseImage(imageFile);
          if (!uploadedImageUrl) {
            console.error('Image upload returned null');
            setCreateError(t('lms.courses.image_upload_error', 'Failed to upload image. Creating course without image.'));
            // Continue without image
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          setCreateError(t('lms.courses.image_upload_error', 'Failed to upload image. Creating course without image.'));
          // Continue without image
        }
      }

      const courseData = {
        ...newCourse,
        image_url: uploadedImageUrl,
      };

      const response = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (result.success) {
        // If image was uploaded and course was created, update the course with the courseId
        if (imageFile && uploadedImageUrl && result.data?.id) {
          // Re-upload with the courseId for better file organization
          try {
            const finalImageUrl = await uploadCourseImage(imageFile, result.data.id);
            if (finalImageUrl && finalImageUrl !== uploadedImageUrl) {
              // Delete the temp image
              await deleteCourseImage(uploadedImageUrl);
              // Update course with final image URL
              await fetch(`/api/lms/courses/${result.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_url: finalImageUrl }),
              });
            }
          } catch (err) {
            console.error('Failed to update image with courseId:', err);
          }
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('lms.courses.created', 'Course created successfully'),
        });
        setShowCreateDialog(false);
        setCreateError(null);
        setValidationErrors({});
        setNewCourse({
          program_id: '',
          title: '',
          description: '',
          start_date: '',
          end_date: '',
          is_active: true,
        });
        setImageFile(null);
        setImagePreview(null);
        loadCourses();
      } else {
        // If course creation failed but image was uploaded, delete it
        if (uploadedImageUrl) {
          await deleteCourseImage(uploadedImageUrl);
        }
        // Translate error if it's a translation key, otherwise use as-is
        const errorMessage = result.error
          ? (result.error.startsWith('lms.') ? t(result.error, result.message || result.error) : result.error)
          : t('lms.courses.create_error', 'Failed to create course');
        setCreateError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      const errorMessage = error instanceof Error ? error.message : t('lms.courses.create_error', 'Failed to create course');
      setCreateError(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle edit course - open dialog
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setEditCourse({
      program_id: course.program_id,
      title: course.title,
      description: course.description || '',
      start_date: course.start_date?.split('T')[0] || course.start_date,
      end_date: course.end_date?.split('T')[0] || course.end_date || '',
      is_active: course.is_active,
      course_type: course.course_type || 'course',
      is_standalone: course.is_standalone || false,
      is_published: course.is_published || false,
    });
    setImagePreview(course.image_url);
    setImageFile(null);
    setEditError(null);
    setValidationErrors({});
    setShowEditDialog(true);
  };

  // Handle update course
  const handleUpdateCourse = async () => {
    // Reset errors
    setEditError(null);
    setValidationErrors({});

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!editCourse.title?.trim()) {
      errors.title = t('lms.courses.error.title_required', 'Course title is required');
    }
    // Program is required only if not standalone
    if (!editCourse.is_standalone && !editCourse.program_id) {
      errors.program_id = t('lms.courses.error.program_required', 'Please select a program');
    }
    // Standalone courses should not have a program
    if (editCourse.is_standalone && editCourse.program_id) {
      errors.program_id = t('lms.course.error_standalone_cannot_have_program', 'Standalone courses cannot be part of a program');
    }
    if (!editCourse.start_date) {
      errors.start_date = t('lms.courses.error.start_date_required', 'Start date is required');
    }
    // Validate end date is after start date if provided
    if (editCourse.end_date && editCourse.start_date && editCourse.end_date < editCourse.start_date) {
      errors.end_date = t('lms.courses.error.end_date_invalid', 'End date must be after start date');
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Don't set a generic error - the specific field errors will show
      return;
    }

    if (!selectedCourse) {
      setEditError(t('common.error', 'Course not found'));
      return;
    }

    try {
      setEditLoading(true);

      let finalImageUrl: string | null = selectedCourse.image_url;

      // Upload new image if there's a file
      if (imageFile) {
        try {
          // Delete old image if it exists
          if (selectedCourse.image_url) {
            await deleteCourseImage(selectedCourse.image_url);
          }

          // Upload new image
          const uploadedUrl = await uploadCourseImage(imageFile, selectedCourse.id);
          if (uploadedUrl) {
            finalImageUrl = uploadedUrl;
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          setEditError(t('lms.courses.image_upload_error', 'Failed to upload image. Course updated without new image.'));
        }
      } else if (imagePreview === null && selectedCourse.image_url) {
        // Image was removed
        await deleteCourseImage(selectedCourse.image_url);
        finalImageUrl = null;
      }

      const courseData = {
        ...editCourse,
        image_url: finalImageUrl,
      };

      const response = await fetch(`/api/lms/courses/${selectedCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('lms.courses.updated', 'Course updated successfully'),
        });
        setShowEditDialog(false);
        setEditError(null);
        setValidationErrors({});
        setSelectedCourse(null);
        setImageFile(null);
        setImagePreview(null);
        loadCourses();
      } else {
        // Translate error if it's a translation key, otherwise use as-is
        const errorMessage = result.error
          ? (result.error.startsWith('lms.') ? t(result.error, result.message || result.error) : result.error)
          : t('lms.courses.update_error', 'Failed to update course');
        setEditError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to update course:', error);
      const errorMessage = error instanceof Error ? error.message : t('lms.courses.update_error', 'Failed to update course');
      setEditError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle duplicate course - open dialog
  const handleOpenDuplicateDialog = (course: Course) => {
    setSelectedCourse(course);
    setDuplicateCourse({
      program_id: course.program_id,
      title: `${course.title} (Copy)`,
      description: course.description || '',
      start_date: course.start_date?.split('T')[0] || course.start_date,
      end_date: course.end_date?.split('T')[0] || course.end_date || '',
      is_active: course.is_active,
    });
    setDuplicateError(null);
    setValidationErrors({});
    setShowDuplicateDialog(true);
  };

  // Handle submit duplicate course
  const handleSubmitDuplicate = async () => {
    // Reset errors
    setDuplicateError(null);
    setValidationErrors({});

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!duplicateCourse.title?.trim()) {
      errors.title = t('lms.courses.error.title_required', 'Course title is required');
    }
    // Program is required only if not standalone
    if (!duplicateCourse.is_standalone && !duplicateCourse.program_id) {
      errors.program_id = t('lms.courses.error.program_required', 'Please select a program');
    }
    // Standalone courses should not have a program
    if (duplicateCourse.is_standalone && duplicateCourse.program_id) {
      errors.program_id = t('lms.course.error_standalone_cannot_have_program', 'Standalone courses cannot be part of a program');
    }
    if (!duplicateCourse.start_date) {
      errors.start_date = t('lms.courses.error.start_date_required', 'Start date is required');
    }
    // Validate end date is after start date if provided
    if (duplicateCourse.end_date && duplicateCourse.start_date && duplicateCourse.end_date < duplicateCourse.start_date) {
      errors.end_date = t('lms.courses.error.end_date_invalid', 'End date must be after start date');
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Don't set a generic error - the specific field errors will show
      return;
    }

    if (!selectedCourse) {
      setDuplicateError(t('common.error', 'Course not found'));
      return;
    }

    try {
      setDuplicateLoading(true);
      const response = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateCourse),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('lms.courses.duplicated', 'Course duplicated successfully'),
        });
        setShowDuplicateDialog(false);
        setDuplicateError(null);
        setValidationErrors({});
        setSelectedCourse(null);
        loadCourses();
      } else {
        const errorMessage = result.error || t('lms.courses.duplicate_error', 'Failed to duplicate course');
        setDuplicateError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to duplicate course:', error);
      const errorMessage = error instanceof Error ? error.message : t('lms.courses.duplicate_error', 'Failed to duplicate course');
      setDuplicateError(errorMessage);
    } finally {
      setDuplicateLoading(false);
    }
  };

  // Handle delete course
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/lms/courses/${selectedCourse.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('lms.courses.deleted', 'Course deleted successfully'),
        });
        setShowDeleteDialog(false);
        setSelectedCourse(null);
        loadCourses();
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || t('lms.courses.delete_error', 'Failed to delete course'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.courses.delete_error', 'Failed to delete course'),
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (course: Course) => {
    try {
      const response = await fetch(`/api/lms/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !course.is_active }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('lms.courses.status_updated', 'Course status updated successfully'),
        });
        loadCourses();
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || t('lms.courses.update_error', 'Failed to update course'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update course:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.courses.update_error', 'Failed to update course'),
        variant: 'destructive',
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const locale = language === 'he' ? 'he-IL' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 suppressHydrationWarning style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              <span suppressHydrationWarning>{t('lms.courses.title', 'Courses')}</span>
            </h1>
            <p suppressHydrationWarning style={{
              color: 'hsl(var(--muted-foreground))',
              fontSize: 'var(--font-size-sm)',
              marginTop: '0.25rem'
            }}>
              {t('lms.courses.subtitle', 'Manage your courses, modules, and lessons')}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            style={{
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <Plus className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span suppressHydrationWarning>{t('lms.courses.create', 'Create Course')}</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '1rem',
              alignItems: 'center'
            }}>
              {/* Search */}
              <div style={{
                flex: 1,
                display: 'flex',
                gap: '0.5rem'
              }}>
                <Input
                  placeholder={t('lms.courses.search_placeholder', 'Search courses...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ flex: 1 }}
                />
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value: any) => setStatusFilter(value)}
                dir={direction}
              >
                <SelectTrigger style={{ width: isMobile ? '100%' : '180px' }} className={isRtl ? 'text-right' : 'text-left'}>
                  <SelectValue placeholder={t('lms.courses.filter_by_status', 'Filter by status')} />
                </SelectTrigger>
                <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                  <SelectItem value="all" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('lms.courses.all_courses', 'All Courses')}</span></SelectItem>
                  <SelectItem value="active" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('lms.courses.active', 'Active')}</span></SelectItem>
                  <SelectItem value="inactive" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('lms.courses.inactive', 'Inactive')}</span></SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle - Far Right */}
              <div style={{
                display: 'flex',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                padding: '0.25rem',
                backgroundColor: 'hsl(var(--background))',
                width: isMobile ? '100%' : 'auto'
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    borderRadius: 'calc(var(--radius) * 1)',
                    backgroundColor: viewMode === 'grid' ? 'hsl(var(--primary))' : 'transparent',
                    color: viewMode === 'grid' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: 'var(--font-size-sm)',
                    transition: 'all 0.2s',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center'
                  }}
                  title={t('lms.courses.view_grid', 'Grid View')}
                >
                  <LayoutGrid className="w-4 h-4" />
                  {isMobile && <span suppressHydrationWarning>{t('lms.courses.view_grid', 'Grid')}</span>}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    borderRadius: 'calc(var(--radius) * 1)',
                    backgroundColor: viewMode === 'list' ? 'hsl(var(--primary))' : 'transparent',
                    color: viewMode === 'list' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: 'var(--font-size-sm)',
                    transition: 'all 0.2s',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center'
                  }}
                  title={t('lms.courses.view_list', 'List View')}
                >
                  <List className="w-4 h-4" />
                  {isMobile && <span suppressHydrationWarning>{t('lms.courses.view_list', 'List')}</span>}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground" suppressHydrationWarning>{t('lms.courses.loading', 'Loading courses...')}</p>
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>{t('lms.courses.no_courses', 'No courses found')}</h3>
              <p className="text-muted-foreground mb-4">
                <span suppressHydrationWarning>{t('lms.courses.get_started', 'Get started by creating your first course')}</span>
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('lms.courses.create', 'Create Course')}</span>
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="relative overflow-hidden">
                {course.image_url && (
                  <div className="h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!course.image_url && (
                  <div className="h-48 w-full bg-muted flex items-center justify-center">
                    <Image className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={course.is_active ? 'default' : 'secondary'}>
                        {course.is_active
                          ? t('lms.courses.active', 'Active')
                          : t('lms.courses.inactive', 'Inactive')
                        }
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm" suppressHydrationWarning>
                        {formatDate(course.start_date)}
                        {course.end_date && ` ${t('lms.courses.date_separator', '-')} ${formatDate(course.end_date)}`}
                      </span>
                    </div>
                    {course.instructor && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {`${course.instructor.first_name} ${course.instructor.last_name}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        <span suppressHydrationWarning>{t(`lms.course.type_${course.course_type}`, course.course_type)}</span>
                      </Badge>
                      {course.is_standalone && (
                        <Badge variant="outline" className="bg-purple-50 border-purple-300 text-purple-700 text-xs">
                          <span suppressHydrationWarning>{t('lms.course.is_standalone', 'Standalone Course')}</span>
                        </Badge>
                      )}
                      {course.is_published ? (
                        <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                          <span suppressHydrationWarning>{t('lms.course.published_label', 'Published')}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-600 text-xs">
                          <span suppressHydrationWarning>{t('lms.course.draft', 'Draft')}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/admin/lms/courses/${course.id}`)}
                    >
                      <BookOpen className={`${isRtl ? 'ml-2' : 'mr-2'} h-3 w-3`} />
                      <span suppressHydrationWarning>{t('lms.courses.manage', 'Manage Course')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/admin/lms/courses/${course.id}/grading/gradebook`)}
                    >
                      <GraduationCap className={`${isRtl ? 'ml-2' : 'mr-2'} h-3 w-3`} />
                      <span suppressHydrationWarning>{t('lms.courses.gradebook', 'Gradebook')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/admin/lms/courses/${course.id}/attendance`)}
                    >
                      <UserCheck className={`${isRtl ? 'ml-2' : 'mr-2'} h-3 w-3`} />
                      <span suppressHydrationWarning>{t('lms.courses.attendance', 'Attendance')}</span>
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Edit className={`${isRtl ? 'ml-2' : 'mr-2'} h-3 w-3`} />
                        <span suppressHydrationWarning>{t('lms.courses.edit', 'Edit')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className={`${isRtl ? 'ml-2' : 'mr-2'} h-3 w-3`} />
                        <span suppressHydrationWarning>{t('lms.courses.delete', 'Delete')}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '1rem',
                    alignItems: isMobile ? 'stretch' : 'flex-start'
                  }}>
                    {/* Course Info - Left Side */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        marginBottom: '0.5rem'
                      }}>
                        <h3
                          style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'hsl(var(--text-heading))',
                            cursor: 'pointer',
                            margin: 0
                          }}
                          onClick={() => router.push(`/admin/lms/courses/${course.id}`)}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--primary))'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--text-heading))'}
                        >
                          {course.title}
                        </h3>
                        <Badge variant={course.is_active ? 'default' : 'secondary'}>
                          {course.is_active
                            ? t('lms.courses.active', 'Active')
                            : t('lms.courses.inactive', 'Inactive')
                          }
                        </Badge>
                      </div>

                      {course.description && (
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'hsl(var(--muted-foreground))',
                          marginBottom: '0.75rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as any,
                          overflow: 'hidden'
                        }}>
                          {course.description}
                        </p>
                      )}

                      <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        flexWrap: 'wrap',
                        gap: isMobile ? '0.5rem' : '1.5rem',
                        fontSize: 'var(--font-size-sm)',
                        color: 'hsl(var(--muted-foreground))'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Calendar className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          <span suppressHydrationWarning>
                            {formatDate(course.start_date)}
                            {course.end_date && ` ${t('lms.courses.date_separator', '-')} ${formatDate(course.end_date)}`}
                          </span>
                        </div>

                        {course.instructor && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Users className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>
                              {`${course.instructor.first_name} ${course.instructor.last_name}` || t('lms.courses.no_instructor', 'No instructor')}
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Badge variant="secondary" className="text-xs">
                            <span suppressHydrationWarning>{t(`lms.course.type_${course.course_type}`, course.course_type)}</span>
                          </Badge>
                          {course.is_standalone && (
                            <Badge variant="outline" className="bg-purple-50 border-purple-300 text-purple-700 text-xs">
                              <span suppressHydrationWarning>{t('lms.course.is_standalone', 'Standalone Course')}</span>
                            </Badge>
                          )}
                          {course.is_published ? (
                            <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                              <span suppressHydrationWarning>{t('lms.course.published_label', 'Published')}</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-600 text-xs">
                              <span suppressHydrationWarning>{t('lms.course.draft', 'Draft')}</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions - Right Side */}
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'row' : 'column',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: '0.5rem',
                      alignItems: 'stretch',
                      minWidth: isMobile ? '100%' : '200px',
                      flexShrink: 0
                    }}>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/admin/lms/courses/${course.id}`)}
                        style={{
                          width: isMobile ? '100%' : 'auto',
                          flex: isMobile ? '1 1 100%' : '0 0 auto'
                        }}
                      >
                        <BookOpen className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        <span suppressHydrationWarning>{t('lms.courses.manage', 'Manage Course')}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/lms/courses/${course.id}/grading/gradebook`)}
                        style={{
                          width: isMobile ? '100%' : 'auto',
                          flex: isMobile ? '1 1 100%' : '0 0 auto'
                        }}
                      >
                        <GraduationCap className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        <span suppressHydrationWarning>{t('lms.courses.gradebook', 'Gradebook')}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/lms/courses/${course.id}/attendance`)}
                        style={{
                          width: isMobile ? '100%' : 'auto',
                          flex: isMobile ? '1 1 100%' : '0 0 auto'
                        }}
                      >
                        <UserCheck className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        <span suppressHydrationWarning>{t('lms.courses.attendance', 'Attendance')}</span>
                      </Button>

                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        width: isMobile ? '100%' : 'auto'
                      }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                          style={{
                            flex: 1,
                            minWidth: isMobile ? 'auto' : '100px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Edit className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          {!isMobile && t('lms.courses.edit', 'Edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowDeleteDialog(true);
                          }}
                          style={{
                            flex: 1,
                            minWidth: isMobile ? 'auto' : '100px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Trash2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          {!isMobile && t('lms.courses.delete', 'Delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Course Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          // If trying to close the dialog (open === false), validate first
          if (!open) {
            if (!newCourse.start_date || !newCourse.start_date.trim()) {
              // Show validation error and prevent closing
              setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              return; // Prevent closing
            }
          }
          // Allow the dialog to open/close and clear errors
          if (open) {
            setValidationErrors({});
          }
          setShowCreateDialog(open);
        }}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] flex flex-col"
            dir={direction}
            onPointerDownOutside={(e) => {
              if (!newCourse.start_date || !newCourse.start_date.trim()) {
                e.preventDefault();
                setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              }
            }}
            onEscapeKeyDown={(e) => {
              if (!newCourse.start_date || !newCourse.start_date.trim()) {
                e.preventDefault();
                setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              }
            }}
          >
            <DialogHeader>
              <DialogTitle className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('lms.courses.create_dialog_title', 'Create New Course')}</span></DialogTitle>
              <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                <span suppressHydrationWarning>{t('lms.courses.create_dialog_description', 'Enter the course details below. You can add modules and lessons after creating the course.')}</span>
              </DialogDescription>
            </DialogHeader>

            {/* Error Alert */}
            {createError && (
              <Alert variant="destructive" className={isRtl ? 'text-right' : 'text-left'}>
                <XCircle className="h-4 w-4" />
                <AlertTitle suppressHydrationWarning>{t('common.error', 'Error')}</AlertTitle>
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.courses.course_title', 'Course Title')}</span> <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={t('lms.courses.course_title_placeholder', 'e.g., Introduction to Programming')}
                  value={newCourse.title}
                  onChange={(e) => {
                    setNewCourse({ ...newCourse, title: e.target.value });
                    if (validationErrors.title) {
                      setValidationErrors({ ...validationErrors, title: '' });
                    }
                  }}
                  className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.title ? 'border-destructive' : ''}`}
                />
                {validationErrors.title && (
                  <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {validationErrors.title}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <Label className={isRtl ? 'text-right' : 'text-left'}>
                  <span suppressHydrationWarning>{t('lms.courses.image', 'Course Image')}</span>
                </Label>
                <div className="flex gap-4 items-start mt-2">
                  {imagePreview && (
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <img
                        src={imagePreview}
                        alt={t('lms.courses.image_preview', 'Course preview')}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 p-1 h-6 w-6"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-create"
                    />
                    <Label
                      htmlFor="image-upload-create"
                      className="cursor-pointer"
                    >
                      <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                            {t('lms.courses.upload_image', 'Click to upload image')}
                          </span>
                          <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {t('lms.courses.image_formats', 'PNG, JPG, GIF up to 5MB')}
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className={isRtl ? 'text-right' : 'text-left'}>
                  <span suppressHydrationWarning>{t('lms.courses.description', 'Description')}</span>
                </Label>
                <RichTextEditor
                  value={newCourse.description || ''}
                  onChange={(content) => setNewCourse({ ...newCourse, description: content })}
                  placeholder={t('lms.courses.description_placeholder', 'Course description...')}
                  dir={direction}
                />
              </div>

              {/* Course Type */}
              <div>
                <label className={`text-sm font-medium block mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.course.type_label', 'Course Type')}</span> <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newCourse.course_type}
                  onValueChange={(value: any) => setNewCourse({ ...newCourse, course_type: value })}
                  dir={direction}
                  required
                >
                  <SelectTrigger className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectItem value="course"><span suppressHydrationWarning>{t('lms.course.type_course', 'Course')}</span></SelectItem>
                    <SelectItem value="lecture"><span suppressHydrationWarning>{t('lms.course.type_lecture', 'Lecture')}</span></SelectItem>
                    <SelectItem value="workshop"><span suppressHydrationWarning>{t('lms.course.type_workshop', 'Workshop')}</span></SelectItem>
                    <SelectItem value="webinar"><span suppressHydrationWarning>{t('lms.course.type_webinar', 'Webinar')}</span></SelectItem>
                    <SelectItem value="session"><span suppressHydrationWarning>{t('lms.course.type_session', 'Session')}</span></SelectItem>
                    <SelectItem value="session_pack"><span suppressHydrationWarning>{t('lms.course.type_session_pack', 'Session Pack')}</span></SelectItem>
                    <SelectItem value="bundle"><span suppressHydrationWarning>{t('lms.course.type_bundle', 'Bundle')}</span></SelectItem>
                    <SelectItem value="custom"><span suppressHydrationWarning>{t('lms.course.type_custom', 'Custom')}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.courses.program', 'Program')}</span> {!newCourse.is_standalone && <span className="text-red-500">*</span>}
                  {newCourse.is_standalone && <span className="text-xs text-muted-foreground ml-2" suppressHydrationWarning>({t('lms.course.not_applicable_standalone', 'Not applicable for standalone courses')})</span>}
                </label>
                <Select
                  value={newCourse.program_id || undefined}
                  onValueChange={(value) => {
                    const newValue: string | undefined = value === '_clear' ? undefined : value;
                    setNewCourse({ ...newCourse, program_id: newValue });
                    if (validationErrors.program_id) {
                      setValidationErrors({ ...validationErrors, program_id: '' });
                    }
                  }}
                  dir={direction}
                  disabled={newCourse.is_standalone}
                >
                  <SelectTrigger className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.program_id ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder={t('lms.courses.select_program', 'Select a program')} />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    {newCourse.program_id && (
                      <SelectItem value="_clear" className={`${isRtl ? 'text-right' : 'text-left'} text-muted-foreground italic`}>
                        <span suppressHydrationWarning>{t('common.clear_selection', 'Clear selection')}</span>
                      </SelectItem>
                    )}
                    {programs.length === 0 ? (
                      <SelectItem value="_none" disabled className={isRtl ? 'text-right' : 'text-left'}>
                        <span suppressHydrationWarning>{t('lms.courses.no_programs', 'No programs available')}</span>
                      </SelectItem>
                    ) : (
                      programs.map((program) => (
                        <SelectItem key={program.id} value={program.id} className={isRtl ? 'text-right' : 'text-left'}>
                          {program.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.program_id ? (
                  <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {validationErrors.program_id}
                  </p>
                ) : !newCourse.is_standalone ? (
                  <p className={`text-xs text-muted-foreground mt-1 ${isRtl ? 'text-right' : 'text-left'}`} suppressHydrationWarning>
                    {t('lms.courses.program_help', 'Select the program this course belongs to')}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span suppressHydrationWarning>{t('lms.courses.start_date', 'Start Date')}</span> <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={newCourse.start_date}
                    onChange={(e) => {
                      setNewCourse({ ...newCourse, start_date: e.target.value });
                      if (validationErrors.start_date) {
                        setValidationErrors({ ...validationErrors, start_date: '' });
                      }
                    }}
                    className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.start_date ? 'border-destructive' : ''}`}
                    required
                  />
                  {validationErrors.start_date && (
                    <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {validationErrors.start_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}><span suppressHydrationWarning>{t('lms.courses.end_date', 'End Date')}</span></label>
                  <Input
                    type="date"
                    value={newCourse.end_date}
                    onChange={(e) => {
                      setNewCourse({ ...newCourse, end_date: e.target.value });
                      if (validationErrors.end_date) {
                        setValidationErrors({ ...validationErrors, end_date: '' });
                      }
                    }}
                    className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.end_date ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.end_date && (
                    <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {validationErrors.end_date}
                    </p>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <Label
                      htmlFor="is_active_create"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <span suppressHydrationWarning>{t('lms.courses.activate_immediately', 'Activate course immediately')}</span>
                    </Label>
                    <Switch
                      id="is_active_create"
                      checked={newCourse.is_active}
                      onCheckedChange={(checked) =>
                        setNewCourse({ ...newCourse, is_active: checked })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_active_create"
                      checked={newCourse.is_active}
                      onCheckedChange={(checked) =>
                        setNewCourse({ ...newCourse, is_active: checked })
                      }
                    />
                    <Label
                      htmlFor="is_active_create"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <span suppressHydrationWarning>{t('lms.courses.activate_immediately', 'Activate course immediately')}</span>
                    </Label>
                  </>
                )}
              </div>

              {/* Standalone Availability */}
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <div className="flex-1">
                      <Label htmlFor="is_standalone_create" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.standalone_label', 'Available as Standalone')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.standalone_description', 'Allow this course to be purchased separately from programs')}</span>
                      </p>
                    </div>
                    <Switch
                      id="is_standalone_create"
                      checked={newCourse.is_standalone}
                      onCheckedChange={(checked) => {
                        setNewCourse({
                          ...newCourse,
                          is_standalone: checked,
                          // Clear program if switching to standalone
                          program_id: (checked ? undefined : newCourse.program_id) as string | undefined
                        });
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_standalone_create"
                      checked={newCourse.is_standalone}
                      onCheckedChange={(checked) => {
                        setNewCourse({
                          ...newCourse,
                          is_standalone: checked,
                          // Clear program if switching to standalone
                          program_id: (checked ? undefined : newCourse.program_id) as string | undefined
                        });
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor="is_standalone_create" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.standalone_label', 'Available as Standalone')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.standalone_description', 'Allow this course to be purchased separately from programs')}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Published Status */}
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <div className="flex-1">
                      <Label htmlFor="is_published_create" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.published_label', 'Published')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.published_description', 'Make this course visible to users in the user portal')}</span>
                      </p>
                    </div>
                    <Switch
                      id="is_published_create"
                      checked={newCourse.is_published}
                      onCheckedChange={(checked) =>
                        setNewCourse({ ...newCourse, is_published: checked })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_published_create"
                      checked={newCourse.is_published}
                      onCheckedChange={(checked) =>
                        setNewCourse({ ...newCourse, is_published: checked })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="is_published_create" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.published_label', 'Published')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.published_description', 'Make this course visible to users in the user portal')}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>

            </div>

            <DialogFooter className={isRtl ? 'flex-row-reverse gap-3' : 'gap-3'}>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={createLoading}
              >
                <span suppressHydrationWarning>{t('lms.courses.cancel', 'Cancel')}</span>
              </Button>
              <Button onClick={handleCreateCourse} disabled={createLoading}>
                {createLoading ? t('lms.courses.creating', 'Creating...') : t('lms.courses.create', 'Create Course')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => {
          // If trying to close the dialog (open === false), validate first
          if (!open) {
            if (!editCourse.start_date || !editCourse.start_date.trim()) {
              // Show validation error and prevent closing
              setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              return; // Prevent closing
            }
          }
          // Allow the dialog to open/close and clear errors
          if (open) {
            setValidationErrors({});
          }
          setShowEditDialog(open);
        }}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] flex flex-col"
            dir={direction}
            onPointerDownOutside={(e) => {
              if (!editCourse.start_date || !editCourse.start_date.trim()) {
                e.preventDefault();
                setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              }
            }}
            onEscapeKeyDown={(e) => {
              if (!editCourse.start_date || !editCourse.start_date.trim()) {
                e.preventDefault();
                setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              }
            }}
          >
            <DialogHeader>
              <DialogTitle className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('lms.courses.edit_dialog_title', 'Edit Course')}</span></DialogTitle>
              <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                <span suppressHydrationWarning>{t('lms.courses.edit_dialog_description', 'Update the course details below.')}</span>
              </DialogDescription>
            </DialogHeader>

            {/* Error Alert */}
            {editError && (
              <Alert variant="destructive" className={isRtl ? 'text-right' : 'text-left'}>
                <XCircle className="h-4 w-4" />
                <AlertTitle suppressHydrationWarning>{t('common.error', 'Error')}</AlertTitle>
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.courses.course_title', 'Course Title')}</span> <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={t('lms.courses.course_title_placeholder', 'e.g., Introduction to Programming')}
                  value={editCourse.title}
                  onChange={(e) => {
                    setEditCourse({ ...editCourse, title: e.target.value });
                    if (validationErrors.title) {
                      setValidationErrors({ ...validationErrors, title: '' });
                    }
                  }}
                  className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.title ? 'border-destructive' : ''}`}
                />
                {validationErrors.title && (
                  <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {validationErrors.title}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <Label className={isRtl ? 'text-right' : 'text-left'}>
                  <span suppressHydrationWarning>{t('lms.courses.image', 'Course Image')}</span>
                </Label>
                <div className="flex gap-4 items-start mt-2">
                  {imagePreview && (
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <img
                        src={imagePreview}
                        alt={t('lms.courses.image_preview', 'Course preview')}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 p-1 h-6 w-6"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <Label
                      htmlFor="image-upload-edit"
                      className="cursor-pointer"
                    >
                      <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                            {t('lms.courses.upload_image', 'Click to upload image')}
                          </span>
                          <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {t('lms.courses.image_formats', 'PNG, JPG, GIF up to 5MB')}
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description" className={isRtl ? 'text-right' : 'text-left'}>
                  <span suppressHydrationWarning>{t('lms.courses.description', 'Description')}</span>
                </Label>
                <RichTextEditor
                  value={editCourse.description || ''}
                  onChange={(content) => setEditCourse({ ...editCourse, description: content })}
                  placeholder={t('lms.courses.description_placeholder', 'Course description...')}
                  dir={direction}
                />
              </div>

              {/* Course Type */}
              <div>
                <label className={`text-sm font-medium block mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.course.type_label', 'Course Type')}</span> <span className="text-red-500">*</span>
                </label>
                <Select
                  value={editCourse.course_type}
                  onValueChange={(value: any) => setEditCourse({ ...editCourse, course_type: value })}
                  dir={direction}
                  required
                >
                  <SelectTrigger className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectItem value="course"><span suppressHydrationWarning>{t('lms.course.type_course', 'Course')}</span></SelectItem>
                    <SelectItem value="lecture"><span suppressHydrationWarning>{t('lms.course.type_lecture', 'Lecture')}</span></SelectItem>
                    <SelectItem value="workshop"><span suppressHydrationWarning>{t('lms.course.type_workshop', 'Workshop')}</span></SelectItem>
                    <SelectItem value="webinar"><span suppressHydrationWarning>{t('lms.course.type_webinar', 'Webinar')}</span></SelectItem>
                    <SelectItem value="session"><span suppressHydrationWarning>{t('lms.course.type_session', 'Session')}</span></SelectItem>
                    <SelectItem value="session_pack"><span suppressHydrationWarning>{t('lms.course.type_session_pack', 'Session Pack')}</span></SelectItem>
                    <SelectItem value="bundle"><span suppressHydrationWarning>{t('lms.course.type_bundle', 'Bundle')}</span></SelectItem>
                    <SelectItem value="custom"><span suppressHydrationWarning>{t('lms.course.type_custom', 'Custom')}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.courses.program', 'Program')}</span> {!editCourse.is_standalone && <span className="text-red-500">*</span>}
                  {editCourse.is_standalone && <span className="text-xs text-muted-foreground ml-2" suppressHydrationWarning>({t('lms.course.not_applicable_standalone', 'Not applicable for standalone courses')})</span>}
                </label>
                <Select
                  value={editCourse.program_id || undefined}
                  onValueChange={(value) => {
                    const newValue: string | undefined = value === '_clear' ? undefined : value;
                    setEditCourse({ ...editCourse, program_id: newValue });
                    if (validationErrors.program_id) {
                      setValidationErrors({ ...validationErrors, program_id: '' });
                    }
                  }}
                  dir={direction}
                  disabled={editCourse.is_standalone}
                >
                  <SelectTrigger className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.program_id ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder={t('lms.courses.select_program', 'Select a program')} />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    {editCourse.program_id && (
                      <SelectItem value="_clear" className={`${isRtl ? 'text-right' : 'text-left'} text-muted-foreground italic`}>
                        <span suppressHydrationWarning>{t('common.clear_selection', 'Clear selection')}</span>
                      </SelectItem>
                    )}
                    {programs.length === 0 ? (
                      <SelectItem value="_none" disabled className={isRtl ? 'text-right' : 'text-left'}>
                        <span suppressHydrationWarning>{t('lms.courses.no_programs', 'No programs available')}</span>
                      </SelectItem>
                    ) : (
                      programs.map((program) => (
                        <SelectItem key={program.id} value={program.id} className={isRtl ? 'text-right' : 'text-left'}>
                          {program.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.program_id ? (
                  <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {validationErrors.program_id}
                  </p>
                ) : !editCourse.is_standalone ? (
                  <p className={`text-xs text-muted-foreground mt-1 ${isRtl ? 'text-right' : 'text-left'}`} suppressHydrationWarning>
                    {t('lms.courses.program_help', 'Select the program this course belongs to')}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span suppressHydrationWarning>{t('lms.courses.start_date', 'Start Date')}</span> <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={editCourse.start_date}
                    onChange={(e) => {
                      setEditCourse({ ...editCourse, start_date: e.target.value });
                      if (validationErrors.start_date) {
                        setValidationErrors({ ...validationErrors, start_date: '' });
                      }
                    }}
                    className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.start_date ? 'border-destructive' : ''}`}
                    required
                  />
                  {validationErrors.start_date && (
                    <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {validationErrors.start_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}><span suppressHydrationWarning>{t('lms.courses.end_date', 'End Date')}</span></label>
                  <Input
                    type="date"
                    value={editCourse.end_date}
                    onChange={(e) => {
                      setEditCourse({ ...editCourse, end_date: e.target.value });
                      if (validationErrors.end_date) {
                        setValidationErrors({ ...validationErrors, end_date: '' });
                      }
                    }}
                    className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.end_date ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.end_date && (
                    <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {validationErrors.end_date}
                    </p>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <Label
                      htmlFor="is_active_edit"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <span suppressHydrationWarning>{t('lms.courses.course_active', 'Course is active')}</span>
                    </Label>
                    <Switch
                      id="is_active_edit"
                      checked={editCourse.is_active}
                      onCheckedChange={(checked) =>
                        setEditCourse({ ...editCourse, is_active: checked })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_active_edit"
                      checked={editCourse.is_active}
                      onCheckedChange={(checked) =>
                        setEditCourse({ ...editCourse, is_active: checked })
                      }
                    />
                    <Label
                      htmlFor="is_active_edit"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <span suppressHydrationWarning>{t('lms.courses.course_active', 'Course is active')}</span>
                    </Label>
                  </>
                )}
              </div>

              {/* Standalone Availability */}
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <div className="flex-1">
                      <Label htmlFor="is_standalone_edit" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.standalone_label', 'Available as Standalone')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.standalone_description', 'Allow this course to be purchased separately from programs')}</span>
                      </p>
                    </div>
                    <Switch
                      id="is_standalone_edit"
                      checked={editCourse.is_standalone}
                      onCheckedChange={(checked) => {
                        setEditCourse({
                          ...editCourse,
                          is_standalone: checked,
                          // Clear program if switching to standalone
                          program_id: (checked ? undefined : editCourse.program_id) as string | undefined
                        });
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_standalone_edit"
                      checked={editCourse.is_standalone}
                      onCheckedChange={(checked) => {
                        setEditCourse({
                          ...editCourse,
                          is_standalone: checked,
                          // Clear program if switching to standalone
                          program_id: (checked ? undefined : editCourse.program_id) as string | undefined
                        });
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor="is_standalone_edit" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.standalone_label', 'Available as Standalone')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.standalone_description', 'Allow this course to be purchased separately from programs')}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Published Status */}
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <div className="flex-1">
                      <Label htmlFor="is_published_edit" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.published_label', 'Published')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.published_description', 'Make this course visible to users in the user portal')}</span>
                      </p>
                    </div>
                    <Switch
                      id="is_published_edit"
                      checked={editCourse.is_published}
                      onCheckedChange={(checked) =>
                        setEditCourse({ ...editCourse, is_published: checked })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_published_edit"
                      checked={editCourse.is_published}
                      onCheckedChange={(checked) =>
                        setEditCourse({ ...editCourse, is_published: checked })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="is_published_edit" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.published_label', 'Published')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.published_description', 'Make this course visible to users in the user portal')}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>

            </div>

            <DialogFooter className={isRtl ? 'flex-row-reverse gap-3' : 'gap-3'}>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={editLoading}
              >
                <span suppressHydrationWarning>{t('lms.courses.cancel', 'Cancel')}</span>
              </Button>
              <Button onClick={handleUpdateCourse} disabled={editLoading}>
                <span suppressHydrationWarning>{editLoading ? t('lms.courses.updating', 'Updating...') : t('lms.courses.update', 'Update Course')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate Course Dialog */}
        <Dialog open={showDuplicateDialog} onOpenChange={(open) => {
          // If trying to close the dialog (open === false), validate first
          if (!open) {
            if (!duplicateCourse.start_date || !duplicateCourse.start_date.trim()) {
              // Show validation error and prevent closing
              setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              return; // Prevent closing
            }
          }
          // Allow the dialog to open/close and clear errors
          if (open) {
            setValidationErrors({});
          }
          setShowDuplicateDialog(open);
        }}>
          <DialogContent
            className="max-w-2xl"
            dir={direction}
            onPointerDownOutside={(e) => {
              if (!duplicateCourse.start_date || !duplicateCourse.start_date.trim()) {
                e.preventDefault();
                setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              }
            }}
            onEscapeKeyDown={(e) => {
              if (!duplicateCourse.start_date || !duplicateCourse.start_date.trim()) {
                e.preventDefault();
                setValidationErrors(prev => ({ ...prev, start_date: t('lms.courses.error.start_date_required', 'Start date is required') }));
              }
            }}
          >
            <DialogHeader>
              <DialogTitle className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('lms.courses.duplicate_dialog_title', 'Duplicate Course')}</span></DialogTitle>
              <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                <span suppressHydrationWarning>{t('lms.courses.duplicate_dialog_description', 'Customize the details for the duplicated course.')}</span>
              </DialogDescription>
            </DialogHeader>

            {/* Error Alert */}
            {duplicateError && (
              <Alert variant="destructive" className={isRtl ? 'text-right' : 'text-left'}>
                <XCircle className="h-4 w-4" />
                <AlertTitle suppressHydrationWarning>{t('common.error', 'Error')}</AlertTitle>
                <AlertDescription>{duplicateError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.courses.course_title', 'Course Title')}</span> <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={t('lms.courses.course_title_placeholder', 'e.g., Introduction to Programming')}
                  value={duplicateCourse.title}
                  onChange={(e) => {
                    setDuplicateCourse({ ...duplicateCourse, title: e.target.value });
                    if (validationErrors.title) {
                      setValidationErrors({ ...validationErrors, title: '' });
                    }
                  }}
                  className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.title ? 'border-destructive' : ''}`}
                />
                {validationErrors.title && (
                  <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="duplicate-description" className={isRtl ? 'text-right' : 'text-left'}>
                  <span suppressHydrationWarning>{t('lms.courses.description', 'Description')}</span>
                </Label>
                <RichTextEditor
                  value={duplicateCourse.description || ''}
                  onChange={(content) => setDuplicateCourse({ ...duplicateCourse, description: content })}
                  placeholder={t('lms.courses.description_placeholder', 'Course description...')}
                  dir={direction}
                />
              </div>

              {/* Course Type */}
              <div>
                <label className={`text-sm font-medium block mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.course.type_label', 'Course Type')}</span> <span className="text-red-500">*</span>
                </label>
                <Select
                  value={duplicateCourse.course_type}
                  onValueChange={(value: any) => setDuplicateCourse({ ...duplicateCourse, course_type: value })}
                  dir={direction}
                  required
                >
                  <SelectTrigger className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectItem value="course"><span suppressHydrationWarning>{t('lms.course.type_course', 'Course')}</span></SelectItem>
                    <SelectItem value="lecture"><span suppressHydrationWarning>{t('lms.course.type_lecture', 'Lecture')}</span></SelectItem>
                    <SelectItem value="workshop"><span suppressHydrationWarning>{t('lms.course.type_workshop', 'Workshop')}</span></SelectItem>
                    <SelectItem value="webinar"><span suppressHydrationWarning>{t('lms.course.type_webinar', 'Webinar')}</span></SelectItem>
                    <SelectItem value="session"><span suppressHydrationWarning>{t('lms.course.type_session', 'Session')}</span></SelectItem>
                    <SelectItem value="session_pack"><span suppressHydrationWarning>{t('lms.course.type_session_pack', 'Session Pack')}</span></SelectItem>
                    <SelectItem value="bundle"><span suppressHydrationWarning>{t('lms.course.type_bundle', 'Bundle')}</span></SelectItem>
                    <SelectItem value="custom"><span suppressHydrationWarning>{t('lms.course.type_custom', 'Custom')}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span suppressHydrationWarning>{t('lms.courses.program', 'Program')}</span> {!duplicateCourse.is_standalone && <span className="text-red-500">*</span>}
                  {duplicateCourse.is_standalone && <span className="text-xs text-muted-foreground ml-2" suppressHydrationWarning>({t('lms.course.not_applicable_standalone', 'Not applicable for standalone courses')})</span>}
                </label>
                <Select
                  value={duplicateCourse.program_id || undefined}
                  onValueChange={(value) => {
                    const newValue: string | undefined = value === '_clear' ? undefined : value;
                    setDuplicateCourse({ ...duplicateCourse, program_id: newValue });
                    if (validationErrors.program_id) {
                      setValidationErrors({ ...validationErrors, program_id: '' });
                    }
                  }}
                  dir={direction}
                  disabled={duplicateCourse.is_standalone}
                >
                  <SelectTrigger className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.program_id ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder={t('lms.courses.select_program', 'Select a program')} />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    {duplicateCourse.program_id && (
                      <SelectItem value="_clear" className={`${isRtl ? 'text-right' : 'text-left'} text-muted-foreground italic`}>
                        <span suppressHydrationWarning>{t('common.clear_selection', 'Clear selection')}</span>
                      </SelectItem>
                    )}
                    {programs.length === 0 ? (
                      <SelectItem value="_none" disabled className={isRtl ? 'text-right' : 'text-left'}>
                        <span suppressHydrationWarning>{t('lms.courses.no_programs', 'No programs available')}</span>
                      </SelectItem>
                    ) : (
                      programs.map((program) => (
                        <SelectItem key={program.id} value={program.id} className={isRtl ? 'text-right' : 'text-left'}>
                          {program.name}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span suppressHydrationWarning>{t('lms.courses.start_date', 'Start Date')}</span> <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={duplicateCourse.start_date}
                    onChange={(e) => {
                      setDuplicateCourse({ ...duplicateCourse, start_date: e.target.value });
                      if (validationErrors.start_date) {
                        setValidationErrors({ ...validationErrors, start_date: '' });
                      }
                    }}
                    className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.start_date ? 'border-destructive' : ''}`}
                    required
                  />
                  {validationErrors.start_date && (
                    <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {validationErrors.start_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}><span suppressHydrationWarning>{t('lms.courses.end_date', 'End Date')}</span></label>
                  <Input
                    type="date"
                    value={duplicateCourse.end_date}
                    onChange={(e) => {
                      setDuplicateCourse({ ...duplicateCourse, end_date: e.target.value });
                      if (validationErrors.end_date) {
                        setValidationErrors({ ...validationErrors, end_date: '' });
                      }
                    }}
                    className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.end_date ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.end_date && (
                    <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {validationErrors.end_date}
                    </p>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <Label
                      htmlFor="is_active_duplicate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <span suppressHydrationWarning>{t('lms.courses.activate_immediately', 'Activate course immediately')}</span>
                    </Label>
                    <Switch
                      id="is_active_duplicate"
                      checked={duplicateCourse.is_active}
                      onCheckedChange={(checked) =>
                        setDuplicateCourse({ ...duplicateCourse, is_active: checked })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_active_duplicate"
                      checked={duplicateCourse.is_active}
                      onCheckedChange={(checked) =>
                        setDuplicateCourse({ ...duplicateCourse, is_active: checked })
                      }
                    />
                    <Label
                      htmlFor="is_active_duplicate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <span suppressHydrationWarning>{t('lms.courses.activate_immediately', 'Activate course immediately')}</span>
                    </Label>
                  </>
                )}
              </div>

              {/* Standalone Availability */}
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <div className="flex-1">
                      <Label htmlFor="is_standalone_duplicate" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.standalone_label', 'Available as Standalone')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.standalone_description', 'Allow this course to be purchased separately from programs')}</span>
                      </p>
                    </div>
                    <Switch
                      id="is_standalone_duplicate"
                      checked={duplicateCourse.is_standalone}
                      onCheckedChange={(checked) => {
                        setDuplicateCourse({
                          ...duplicateCourse,
                          is_standalone: checked,
                          // Clear program if switching to standalone
                          program_id: (checked ? undefined : duplicateCourse.program_id) as string | undefined
                        });
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_standalone_duplicate"
                      checked={duplicateCourse.is_standalone}
                      onCheckedChange={(checked) => {
                        setDuplicateCourse({
                          ...duplicateCourse,
                          is_standalone: checked,
                          // Clear program if switching to standalone
                          program_id: (checked ? undefined : duplicateCourse.program_id) as string | undefined
                        });
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor="is_standalone_duplicate" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.standalone_label', 'Available as Standalone')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.standalone_description', 'Allow this course to be purchased separately from programs')}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Published Status */}
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {isRtl ? (
                  <>
                    <div className="flex-1">
                      <Label htmlFor="is_published_duplicate" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.published_label', 'Published')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.published_description', 'Make this course visible to users in the user portal')}</span>
                      </p>
                    </div>
                    <Switch
                      id="is_published_duplicate"
                      checked={duplicateCourse.is_published}
                      onCheckedChange={(checked) =>
                        setDuplicateCourse({ ...duplicateCourse, is_published: checked })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Switch
                      id="is_published_duplicate"
                      checked={duplicateCourse.is_published}
                      onCheckedChange={(checked) =>
                        setDuplicateCourse({ ...duplicateCourse, is_published: checked })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="is_published_duplicate" className="text-sm font-medium cursor-pointer">
                        <span suppressHydrationWarning>{t('lms.course.published_label', 'Published')}</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span suppressHydrationWarning>{t('lms.course.published_description', 'Make this course visible to users in the user portal')}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className={isRtl ? 'flex-row-reverse gap-3' : 'gap-3'}>
              <Button
                variant="outline"
                onClick={() => setShowDuplicateDialog(false)}
                disabled={duplicateLoading}
              >
                <span suppressHydrationWarning>{t('lms.courses.cancel', 'Cancel')}</span>
              </Button>
              <Button onClick={handleSubmitDuplicate} disabled={duplicateLoading}>
                <span suppressHydrationWarning>{duplicateLoading ? t('lms.courses.duplicating', 'Duplicating...') : t('lms.courses.duplicate', 'Duplicate Course')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setShowDeleteDialog(false);
          }
        }}>
          <AlertDialogContent
            className="max-w-[90vw] sm:max-w-[500px]"
            style={{ direction }}>
            <AlertDialogHeader>
              <AlertDialogTitle className={isRtl ? 'text-right' : 'text-left'}>
                <span suppressHydrationWarning>{t('lms.courses.delete_dialog_title', 'Delete Course')}</span>
              </AlertDialogTitle>
              <AlertDialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                <span suppressHydrationWarning>{t(
                  'lms.courses.delete_dialog_description',
                  `Are you sure you want to delete "{title}"? This will also delete all modules, lessons, and student progress. This action cannot be undone.`
                ).replace('{title}', selectedCourse?.title || '')}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className={`flex gap-3 mt-6 pt-6 border-t ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteLoading}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <X className="h-4 w-4" />
                <span suppressHydrationWarning>{t('lms.courses.cancel', 'Cancel')}</span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCourse}
                disabled={deleteLoading}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                {deleteLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span suppressHydrationWarning>{t('lms.courses.deleting', 'Deleting...')}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span suppressHydrationWarning>{t('lms.courses.delete', 'Delete')}</span>
                  </>
                )}
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

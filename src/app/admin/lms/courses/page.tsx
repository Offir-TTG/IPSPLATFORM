'use client';

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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Course, CourseFilter } from '@/types/lms';

// ============================================================================
// TYPES
// ============================================================================

interface CreateCourseData {
  program_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CoursesListPage() {
  const router = useRouter();
  const { t } = useAdminLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state for create dialog
  const [newCourse, setNewCourse] = useState<CreateCourseData>({
    program_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  // Load programs and courses
  useEffect(() => {
    loadPrograms();
    loadCourses();
  }, [statusFilter]);

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

  // Handle search
  const handleSearch = () => {
    loadCourses();
  };

  // Handle create course
  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.program_id || !newCourse.start_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreateLoading(true);
      const response = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateDialog(false);
        setNewCourse({
          program_id: '',
          title: '',
          description: '',
          start_date: '',
          end_date: '',
          is_active: true,
        });
        loadCourses();
      } else {
        alert(result.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Failed to create course');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle duplicate course
  const handleDuplicateCourse = async (course: Course) => {
    if (!confirm(`Duplicate "${course.title}"?`)) return;

    try {
      const response = await fetch(`/api/lms/courses/${course.id}/duplicate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        loadCourses();
      } else {
        alert(result.error || 'Failed to duplicate course');
      }
    } catch (error) {
      console.error('Failed to duplicate course:', error);
      alert('Failed to duplicate course');
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
        setShowDeleteDialog(false);
        setSelectedCourse(null);
        loadCourses();
      } else {
        alert(result.error || 'Failed to delete course');
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course');
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
        loadCourses();
      } else {
        alert(result.error || 'Failed to update course');
      }
    } catch (error) {
      console.error('Failed to update course:', error);
      alert('Failed to update course');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('lms.courses.title', 'Courses')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('lms.courses.subtitle', 'Manage your courses, modules, and lessons')}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('lms.courses.create', 'Create Course')}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder={t('lms.courses.search_placeholder', 'Search courses...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value: any) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('lms.courses.filter_by_status', 'Filter by status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('lms.courses.all_courses', 'All Courses')}</SelectItem>
                  <SelectItem value="active">{t('lms.courses.active', 'Active')}</SelectItem>
                  <SelectItem value="inactive">{t('lms.courses.inactive', 'Inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Course List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('lms.courses.loading', 'Loading courses...')}</p>
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('lms.courses.no_courses', 'No courses found')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('lms.courses.get_started', 'Get started by creating your first course')}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('lms.courses.create', 'Create Course')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle
                        className="text-lg mb-1 hover:text-primary"
                        onClick={() => router.push(`/admin/lms/courses/${course.id}`)}
                      >
                        {course.title}
                      </CardTitle>
                      {course.is_active ? (
                        <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('lms.courses.active', 'Active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          <XCircle className="w-3 h-3 mr-1" />
                          {t('lms.courses.inactive', 'Inactive')}
                        </span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/lms/courses/${course.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {t('lms.courses.edit', 'Edit Course')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicateCourse(course)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {t('lms.courses.duplicate', 'Duplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(course)}>
                          {course.is_active ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              {t('lms.courses.deactivate', 'Deactivate')}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t('lms.courses.activate', 'Activate')}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('lms.courses.delete', 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {formatDate(course.start_date)}
                        {course.end_date && ` - ${formatDate(course.end_date)}`}
                      </span>
                    </div>

                    {course.instructor && (
                      <div className="flex items-center text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{`${course.instructor.first_name} ${course.instructor.last_name}` || t('lms.courses.no_instructor', 'No instructor')}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => router.push(`/admin/lms/courses/${course.id}`)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t('lms.courses.manage', 'Manage Course')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Course Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('lms.courses.create_dialog_title', 'Create New Course')}</DialogTitle>
              <DialogDescription>
                {t('lms.courses.create_dialog_description', 'Enter the course details below. You can add modules and lessons after creating the course.')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {t('lms.courses.course_title', 'Course Title')} <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={t('lms.courses.course_title_placeholder', 'e.g., Introduction to Programming')}
                  value={newCourse.title}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t('lms.courses.description', 'Description')}</label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                  placeholder={t('lms.courses.description_placeholder', 'Course description...')}
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  {t('lms.courses.program', 'Program')} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newCourse.program_id}
                  onValueChange={(value) =>
                    setNewCourse({ ...newCourse, program_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('lms.courses.select_program', 'Select a program')} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        {t('lms.courses.no_programs', 'No programs available')}
                      </SelectItem>
                    ) : (
                      programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('lms.courses.program_help', 'Select the program this course belongs to')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    {t('lms.courses.start_date', 'Start Date')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={newCourse.start_date}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('lms.courses.end_date', 'End Date')}</label>
                  <Input
                    type="date"
                    value={newCourse.end_date}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newCourse.is_active}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, is_active: e.target.checked })
                  }
                />
                <label htmlFor="is_active" className="text-sm">
                  {t('lms.courses.activate_immediately', 'Activate course immediately')}
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={createLoading}
              >
                {t('lms.courses.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleCreateCourse} disabled={createLoading}>
                {createLoading ? t('lms.courses.creating', 'Creating...') : t('lms.courses.create', 'Create Course')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('lms.courses.delete_dialog_title', 'Delete Course')}</DialogTitle>
              <DialogDescription>
                {t('lms.courses.delete_dialog_description', `Are you sure you want to delete "${selectedCourse?.title}"? This will also delete all modules, lessons, and student progress. This action cannot be undone.`)}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteLoading}
              >
                {t('lms.courses.cancel', 'Cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCourse}
                disabled={deleteLoading}
              >
                {deleteLoading ? t('lms.courses.deleting', 'Deleting...') : t('lms.courses.delete', 'Delete Course')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

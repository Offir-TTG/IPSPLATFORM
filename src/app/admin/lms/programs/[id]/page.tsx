'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Users, Plus, Trash2, GripVertical, Check, X, Loader2, Search, UserX, Link2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminLanguage } from '@/context/AppContext';

interface Program {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  price: number;
  currency: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
}

interface ProgramCourse {
  id: string;
  order: number;
  is_required: boolean;
  created_at: string;
  course: Course;
}

interface Student {
  id: string;
  enrollment_status: string;
  enrolled_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const programId = params.id as string;

  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'instructor'>('courses');
  const [program, setProgram] = useState<Program | null>(null);
  const [programCourses, setProgramCourses] = useState<ProgramCourse[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [showEnrollStudentDialog, setShowEnrollStudentDialog] = useState(false);
  const [showRemoveCourseDialog, setShowRemoveCourseDialog] = useState(false);
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [courseToRemove, setCourseToRemove] = useState<ProgramCourse | null>(null);
  const [studentToUnenroll, setStudentToUnenroll] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [bridgeLink, setBridgeLink] = useState<any>(null);
  const [loadingBridge, setLoadingBridge] = useState(false);
  const [creatingBridge, setCreatingBridge] = useState(false);

  // Helper function to strip HTML tags
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Load program data
  useEffect(() => {
    loadProgramData();
  }, [programId]);

  // Load courses when Courses tab is active
  useEffect(() => {
    if (activeTab === 'courses') {
      loadProgramCourses();
      loadAllCourses();
    }
  }, [activeTab]);

  // Load students when Students tab is active
  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
      loadAllUsers();
    }
  }, [activeTab]);

  // Filter users based on search term
  useEffect(() => {
    if (!userSearchTerm) {
      setFilteredUsers(allUsers);
      return;
    }

    const search = userSearchTerm.toLowerCase();
    const filtered = allUsers.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(search) || email.includes(search);
    });
    setFilteredUsers(filtered);
  }, [userSearchTerm, allUsers]);

  // Load bridge link when Instructor Access tab is active
  useEffect(() => {
    if (activeTab === 'instructor') {
      loadBridgeLink();
    }
  }, [activeTab]);

  const loadProgramData = async () => {
    try {
      const res = await fetch(`/api/admin/programs/${programId}`);
      if (!res.ok) throw new Error('Failed to load program');
      const data = await res.json();
      setProgram(data);
    } catch (error) {
      console.error('Error loading program:', error);
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: t('lms.program_detail.load_error', 'Failed to load program'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProgramCourses = async () => {
    try {
      const res = await fetch(`/api/admin/programs/${programId}/courses`);
      if (!res.ok) throw new Error('Failed to load courses');
      const data = await res.json();
      setProgramCourses(data);
    } catch (error) {
      console.error('Error loading program courses:', error);
    }
  };

  const loadAllCourses = async () => {
    try {
      const res = await fetch('/api/lms/courses');
      if (!res.ok) throw new Error('Failed to load courses');
      const data = await res.json();
      setAllCourses(data.success ? data.data : []);
    } catch (error) {
      console.error('Error loading all courses:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await fetch(`/api/admin/enrollments?program_id=${programId}`);
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      // Filter to only show students and instructors (not admins)
      const nonAdminUsers = data.filter((u: User) => u.role === 'student' || u.role === 'instructor');
      setAllUsers(nonAdminUsers);
      setFilteredUsers(nonAdminUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddCourses = async () => {
    if (selectedCourses.size === 0) return;

    setSaving(true);
    try {
      // Add courses sequentially to maintain order
      for (const courseId of selectedCourses) {
        const res = await fetch(`/api/admin/programs/${programId}/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: courseId,
            is_required: true
          })
        });

        if (!res.ok) throw new Error('Failed to add course');
      }

      toast({
        title: t('lms.program_detail.toast_success', 'Success'),
        description: t('lms.program_detail.courses_added', '{count} course(s) added to program').replace('{count}', selectedCourses.size.toString())
      });

      setShowAddCourseDialog(false);
      setSelectedCourses(new Set());
      setCourseSearchTerm('');
      loadProgramCourses();
    } catch (error) {
      console.error('Error adding courses:', error);
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: t('lms.program_detail.course_add_error', 'Failed to add courses'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    const newSelection = new Set(selectedCourses);
    if (newSelection.has(courseId)) {
      newSelection.delete(courseId);
    } else {
      newSelection.add(courseId);
    }
    setSelectedCourses(newSelection);
  };

  const selectAllCourses = () => {
    const filteredAvailableCourses = availableCourses.filter(course =>
      course.title.toLowerCase().includes(courseSearchTerm.toLowerCase())
    );
    setSelectedCourses(new Set(filteredAvailableCourses.map(c => c.id)));
  };

  const deselectAllCourses = () => {
    setSelectedCourses(new Set());
  };

  const handleRemoveCourse = async () => {
    if (!courseToRemove) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/programs/${programId}/courses/${courseToRemove.course.id}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to remove course');

      toast({
        title: t('lms.program_detail.toast_success', 'Success'),
        description: t('lms.program_detail.course_removed', 'Course removed from program')
      });

      setShowRemoveCourseDialog(false);
      setCourseToRemove(null);
      loadProgramCourses();
    } catch (error) {
      console.error('Error removing course:', error);
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: t('lms.program_detail.course_remove_error', 'Failed to remove course'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCourseRequired = async (programCourseId: string, courseId: string, currentValue: boolean) => {
    try {
      const res = await fetch(
        `/api/admin/programs/${programId}/courses/${courseId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_required: !currentValue })
        }
      );

      if (!res.ok) throw new Error('Failed to update course');

      loadProgramCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: t('lms.program_detail.course_update_error', 'Failed to update course'),
        variant: 'destructive'
      });
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser,
          program_id: programId,
          enrollment_status: 'active'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to enroll student');
      }

      toast({
        title: t('lms.program_detail.toast_success', 'Success'),
        description: t('lms.program_detail.student_enrolled_success', 'Student enrolled successfully')
      });

      setShowEnrollStudentDialog(false);
      setSelectedUser('');
      setUserSearchTerm('');
      loadStudents();
    } catch (error: any) {
      console.error('Error enrolling student:', error);
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: error.message || t('lms.program_detail.student_enroll_error', 'Failed to enroll student'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEnrollmentStatus = async (enrollmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update enrollment status');

      toast({
        title: t('lms.program_detail.toast_success', 'Success'),
        description: t('lms.program_detail.enrollment_status_updated', 'Enrollment status updated')
      });

      loadStudents();
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: t('lms.program_detail.enrollment_status_error', 'Failed to update enrollment status'),
        variant: 'destructive'
      });
    }
  };

  const handleUnenrollStudent = async () => {
    if (!studentToUnenroll) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${studentToUnenroll.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to unenroll student');

      toast({
        title: t('lms.program_detail.toast_success', 'Success'),
        description: t('lms.program_detail.student_unenrolled', 'Student unenrolled from program')
      });

      setShowUnenrollDialog(false);
      setStudentToUnenroll(null);
      loadStudents();
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: t('lms.program_detail.student_unenroll_error', 'Failed to unenroll student'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const loadBridgeLink = async () => {
    setLoadingBridge(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/bridge`);
      const data = await res.json();

      if (data.success && data.data) {
        setBridgeLink(data.data);
      } else {
        setBridgeLink(null);
      }
    } catch (error) {
      console.error('Error loading bridge link:', error);
      setBridgeLink(null);
    } finally {
      setLoadingBridge(false);
    }
  };

  const handleCreateBridgeLink = async () => {
    setCreatingBridge(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/bridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (data.success && data.data) {
        setBridgeLink(data.data);
        toast({
          title: t('lms.program_detail.toast_success', 'Success'),
          description: t('lms.program_detail.bridge_toast_created', 'Instructor bridge link created successfully')
        });
      } else {
        toast({
          title: t('lms.program_detail.toast_error', 'Error'),
          description: data.error || t('lms.program_detail.bridge_create_error', 'Failed to create bridge link'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating bridge link:', error);
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: t('lms.program_detail.bridge_create_error', 'Failed to create bridge link'),
        variant: 'destructive'
      });
    } finally {
      setCreatingBridge(false);
    }
  };

  const copyBridgeLink = () => {
    if (bridgeLink?.bridge_url) {
      navigator.clipboard.writeText(bridgeLink.bridge_url);
      toast({
        title: t('lms.program_detail.toast_copied', 'Copied!'),
        description: t('lms.program_detail.bridge_copied', 'Bridge link copied to clipboard')
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!program) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className={isRtl ? 'text-right' : 'text-left'}>
            {t('lms.program_detail.program_not_found', 'Program not found')}
          </p>
        </div>
      </AdminLayout>
    );
  }

  // Get courses not already in program
  const availableCourses = allCourses.filter(
    course => !programCourses.some(pc => pc.course.id === course.id)
  );

  // Filter available courses by search term
  const filteredAvailableCourses = availableCourses.filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(courseSearchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/lms/programs')}
            >
              <ArrowLeft className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              {t('lms.program_detail.back_to_programs', 'Back to Programs')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {program?.name || t('lms.program_detail.untitled_program', 'Untitled Program')}
              </h1>
              {program?.description && stripHtml(program.description).trim() !== '' && (
                <div
                  className="text-sm text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: program.description }}
                />
              )}
            </div>
          </div>
          <Badge variant={program?.is_active ? 'default' : 'secondary'}>
            {program?.is_active
              ? t('lms.program_detail.status_active', 'Active')
              : t('lms.program_detail.status_inactive', 'Inactive')
            }
          </Badge>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'courses' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('courses')}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            {t('lms.program_detail.tab_courses', 'Courses')} ({programCourses.length})
          </Button>
          <Button
            variant={activeTab === 'students' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('students')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            {t('lms.program_detail.tab_students', 'Students')} ({students.length})
          </Button>
          <Button
            variant={activeTab === 'instructor' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('instructor')}
            className="gap-2"
          >
            <Link2 className="h-4 w-4" />
            {t('lms.program_detail.tab_instructor_access', 'Instructor Access')}
          </Button>
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('lms.program_detail.courses_title', 'Program Courses')}</CardTitle>
                  <CardDescription>
                    {t('lms.program_detail.courses_description', 'Manage which courses are included in this program')}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddCourseDialog(true)}>
                  <Plus className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                  {t('lms.program_detail.courses_add', 'Add Course')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {programCourses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{t('lms.program_detail.courses_empty', 'No courses added to this program yet')}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddCourseDialog(true)}
                  >
                    {t('lms.program_detail.courses_add_first', 'Add First Course')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {programCourses.map((pc, index) => (
                    <div
                      key={pc.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{index + 1}.</span>
                          <span className="font-medium">{pc.course.title}</span>
                          <Badge variant={pc.is_required ? 'default' : 'secondary'}>
                            {pc.is_required
                              ? t('lms.program_detail.course_required', 'Required')
                              : t('lms.program_detail.course_optional', 'Optional')
                            }
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pc.course.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCourseRequired(pc.id, pc.course.id, pc.is_required)}
                        >
                          {pc.is_required
                            ? t('lms.program_detail.course_make_optional', 'Make Optional')
                            : t('lms.program_detail.course_make_required', 'Make Required')
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCourseToRemove(pc);
                            setShowRemoveCourseDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('lms.program_detail.students_title', 'Enrolled Students')}</CardTitle>
                  <CardDescription>
                    {t('lms.program_detail.students_description', 'Manage student enrollments in this program')}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowEnrollStudentDialog(true)}>
                  <Plus className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                  {t('lms.program_detail.students_enroll', 'Enroll Student')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{t('lms.program_detail.students_empty', 'No students enrolled in this program yet')}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowEnrollStudentDialog(true)}
                  >
                    {t('lms.program_detail.students_enroll_first', 'Enroll First Student')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {student.user.first_name} {student.user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{student.user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('lms.program_detail.student_enrolled', 'Enrolled')}: {new Date(student.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={student.enrollment_status}
                          onValueChange={(value) => handleUpdateEnrollmentStatus(student.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent dir={direction}>
                            <SelectItem value="active">{t('lms.program_detail.enrollment_active', 'Active')}</SelectItem>
                            <SelectItem value="pending">{t('lms.program_detail.enrollment_pending', 'Pending')}</SelectItem>
                            <SelectItem value="suspended">{t('lms.program_detail.enrollment_suspended', 'Suspended')}</SelectItem>
                            <SelectItem value="completed">{t('lms.program_detail.enrollment_completed', 'Completed')}</SelectItem>
                            <SelectItem value="dropped">{t('lms.program_detail.enrollment_dropped', 'Dropped')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStudentToUnenroll(student);
                            setShowUnenrollDialog(true);
                          }}
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructor Access Tab */}
        {activeTab === 'instructor' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('lms.program_detail.bridge_title', 'Instructor Bridge Link')}</CardTitle>
              <CardDescription>
                {t('lms.program_detail.bridge_description', 'Generate a permanent link for instructors to access their live Zoom sessions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBridge ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : bridgeLink ? (
                <div className="space-y-6">
                  <div className="rounded-lg border bg-muted/30 p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          {t('lms.program_detail.bridge_url_label', 'Bridge URL')}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={bridgeLink.bridge_url}
                            readOnly
                            className="font-mono text-sm"
                            dir="ltr"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyBridgeLink}
                            title={t('lms.program_detail.bridge_copy_tooltip', 'Copy to clipboard')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(bridgeLink.bridge_url, '_blank')}
                            title={t('lms.program_detail.bridge_open_tooltip', 'Open in new tab')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('lms.program_detail.bridge_slug', 'Slug')}</p>
                          <p className="font-mono" dir="ltr">{bridgeLink.bridge_slug}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('lms.program_detail.bridge_created', 'Created')}</p>
                          <p>{new Date(bridgeLink.created_at).toLocaleDateString()}</p>
                        </div>
                        {bridgeLink.last_used_at && (
                          <>
                            <div>
                              <p className="text-muted-foreground">{t('lms.program_detail.bridge_last_used', 'Last Used')}</p>
                              <p>{new Date(bridgeLink.last_used_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{t('lms.program_detail.bridge_usage_count', 'Usage Count')}</p>
                              <p>{bridgeLink.usage_count || 0}</p>
                            </div>
                          </>
                        )}
                        {bridgeLink.instructor && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground">{t('lms.program_detail.bridge_instructor', 'Instructor')}</p>
                            <p>
                              {bridgeLink.instructor.first_name} {bridgeLink.instructor.last_name}
                              {' '}
                              <span className="text-muted-foreground">
                                ({bridgeLink.instructor.email})
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <Link2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-medium mb-1">{t('lms.program_detail.bridge_how_title', 'How it works')}</p>
                        <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                          <li>• {t('lms.program_detail.bridge_how_point1', 'This link automatically routes instructors to their current or next scheduled lesson')}</li>
                          <li>• {t('lms.program_detail.bridge_how_point2', 'The system checks lesson times within a 15-minute window before and 30 minutes after start')}</li>
                          <li>• {t('lms.program_detail.bridge_how_point3', 'If a session is live, instructors are auto-redirected to the Zoom start URL')}</li>
                          <li>• {t('lms.program_detail.bridge_how_point4', 'The link is permanent and can be bookmarked for easy access')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Link2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {t('lms.program_detail.bridge_empty_title', 'No Bridge Link Created')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('lms.program_detail.bridge_empty_description', 'Create a permanent bridge link for instructors to access their live sessions. The link will automatically direct them to the correct Zoom meeting.')}
                  </p>
                  <Button
                    onClick={handleCreateBridgeLink}
                    disabled={creatingBridge}
                  >
                    {creatingBridge ? (
                      <>
                        <Loader2 className={isRtl ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
                        {t('lms.program_detail.bridge_creating', 'Creating Link...')}
                      </>
                    ) : (
                      <>
                        <Plus className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                        {t('lms.program_detail.bridge_create_button', 'Generate Bridge Link')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Course Dialog */}
        <Dialog open={showAddCourseDialog} onOpenChange={(open) => {
          setShowAddCourseDialog(open);
          if (!open) {
            setSelectedCourses(new Set());
            setCourseSearchTerm('');
          }
        }}>
          <DialogContent className="max-w-3xl" dir={direction}>
            <DialogHeader>
              <DialogTitle>{t('lms.program_detail.add_courses_title', 'Add Courses to Program')}</DialogTitle>
              <DialogDescription>
                {t('lms.program_detail.add_courses_description', 'Select one or more courses to add to this program')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search and Bulk Actions */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRtl ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={t('lms.program_detail.search_courses', 'Search courses...')}
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                    className={isRtl ? 'pr-9' : 'pl-9'}
                  />
                </div>
                {selectedCourses.size > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllCourses}
                  >
                    {t('lms.program_detail.deselect_all', 'Deselect All')}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllCourses}
                    disabled={filteredAvailableCourses.length === 0}
                  >
                    {t('lms.program_detail.select_all', 'Select All')}
                  </Button>
                )}
              </div>

              {/* Selected Count */}
              {selectedCourses.size > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {t('lms.program_detail.courses_selected', '{count} course(s) selected').replace('{count}', selectedCourses.size.toString())}
                  </span>
                </div>
              )}

              {/* Course List */}
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {filteredAvailableCourses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>
                      {courseSearchTerm
                        ? t('lms.program_detail.no_courses_found', 'No courses found matching your search')
                        : t('lms.program_detail.no_available_courses', 'No available courses to add')
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAvailableCourses.map((course) => {
                      const isSelected = selectedCourses.has(course.id);
                      return (
                        <div
                          key={course.id}
                          className={`p-4 cursor-pointer hover:bg-accent transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                          onClick={() => toggleCourseSelection(course.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleCourseSelection(course.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1">{course.title}</h4>
                              {course.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {course.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCourseDialog(false);
                  setSelectedCourses(new Set());
                  setCourseSearchTerm('');
                }}
              >
                {t('lms.program_detail.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleAddCourses} disabled={selectedCourses.size === 0 || saving}>
                {saving ? (
                  <Loader2 className={isRtl ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
                ) : null}
                {selectedCourses.size > 0
                  ? t('lms.program_detail.add_courses_count', 'Add {count} Course(s)').replace('{count}', selectedCourses.size.toString())
                  : t('lms.program_detail.add_courses_button', 'Add Courses')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Course Dialog */}
        <AlertDialog open={showRemoveCourseDialog} onOpenChange={setShowRemoveCourseDialog}>
          <AlertDialogContent dir={direction}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('lms.program_detail.remove_course_title', 'Remove Course?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('lms.program_detail.remove_course_description', 'Are you sure you want to remove "{title}" from this program? The course itself will not be deleted.').replace('{title}', courseToRemove?.course.title || '')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('lms.program_detail.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveCourse} disabled={saving}>
                {saving ? <Loader2 className={isRtl ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} /> : null}
                {t('lms.program_detail.remove_course_button', 'Remove')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Enroll Student Dialog */}
        <Dialog open={showEnrollStudentDialog} onOpenChange={setShowEnrollStudentDialog}>
          <DialogContent className="max-w-2xl" dir={direction}>
            <DialogHeader>
              <DialogTitle>{t('lms.program_detail.enroll_student_title', 'Enroll Student in Program')}</DialogTitle>
              <DialogDescription>
                {t('lms.program_detail.enroll_student_description', 'Search and select a student to enroll in {name}').replace('{name}', program?.name || '')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-search">{t('lms.program_detail.enroll_search_label', 'Search Students')}</Label>
                <div className="relative">
                  <Search className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRtl ? 'right-3' : 'left-3'}`} />
                  <Input
                    id="user-search"
                    placeholder={t('lms.program_detail.enroll_search_placeholder', 'Search by name or email...')}
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className={isRtl ? 'pr-9' : 'pl-9'}
                  />
                </div>
              </div>

              {/* User List */}
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>{t('lms.program_detail.enroll_no_users', 'No users found')}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers
                      .filter(user => !students.some(s => s.user.id === user.id))
                      .map((user) => (
                        <div
                          key={user.id}
                          className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                            selectedUser === user.id ? 'bg-accent' : ''
                          }`}
                          onClick={() => setSelectedUser(user.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {user.role === 'student'
                                  ? t('lms.program_detail.enroll_role_student', 'Student')
                                  : t('lms.program_detail.enroll_role_instructor', 'Instructor')
                                }
                              </Badge>
                              {selectedUser === user.id && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEnrollStudentDialog(false);
                  setSelectedUser('');
                  setUserSearchTerm('');
                }}
              >
                {t('lms.program_detail.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleEnrollStudent} disabled={!selectedUser || saving}>
                {saving ? <Loader2 className={isRtl ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} /> : null}
                {t('lms.program_detail.enroll_button', 'Enroll Student')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unenroll Student Dialog */}
        <AlertDialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
          <AlertDialogContent dir={direction}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('lms.program_detail.unenroll_student_title', 'Unenroll Student?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('lms.program_detail.unenroll_student_description', 'Are you sure you want to unenroll {firstName} {lastName} from this program? Their enrollment status will be changed to "dropped".')
                  .replace('{firstName}', studentToUnenroll?.user.first_name || '')
                  .replace('{lastName}', studentToUnenroll?.user.last_name || '')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('lms.program_detail.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnenrollStudent} disabled={saving}>
                {saving ? <Loader2 className={isRtl ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} /> : null}
                {t('lms.program_detail.unenroll_button', 'Unenroll')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

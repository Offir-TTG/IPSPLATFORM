'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Eye, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useAdminLanguage } from '@/context/AppContext';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface ProgramEnrollment {
  enrollment_id: string;
  program_id: string;
  program_name: string;
  enrollment_status: string;
  enrolled_at: string;
  course_count: number;
}

interface CourseEnrollment {
  enrollment_id: string;
  course_id: string;
  course_name: string;
  enrollment_status: string;
  enrolled_at: string;
}

interface CourseOverride {
  id: string;
  course_id: string;
  course_title: string;
  access_type: 'grant' | 'hide';
  reason: string;
  created_at: string;
}

interface VisibleCourse {
  course_id: string;
  course_title: string;
  source: string;
  program_id?: string;
  program_name?: string;
  is_required: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

interface UserAccessManagementProps {
  userId: string;
  embedded?: boolean;
}

export function UserAccessManagement({ userId, embedded = false }: UserAccessManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const dateLocale = isRtl ? 'he-IL' : undefined;

  const [user, setUser] = useState<User | null>(null);
  const [programEnrollments, setProgramEnrollments] = useState<ProgramEnrollment[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [courseOverrides, setCourseOverrides] = useState<CourseOverride[]>([]);
  const [visibleCourses, setVisibleCourses] = useState<VisibleCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [showRemoveOverrideDialog, setShowRemoveOverrideDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideToRemove, setOverrideToRemove] = useState<CourseOverride | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
    loadAccessData();
    loadAllCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserData = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/summary`);
      if (!res.ok) throw new Error('Failed to load user');
      const data = await res.json();
      if (data?.user) {
        setUser({
          id: data.user.id,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          email: data.user.email,
          role: data.user.role,
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive'
      });
    }
  };

  const loadAccessData = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/course-access`);
      if (!res.ok) throw new Error('Failed to load access data');
      const data = await res.json();

      setProgramEnrollments(data.program_enrollments || []);
      setCourseEnrollments(data.course_enrollments || []);
      setCourseOverrides(data.course_overrides || []);
      setVisibleCourses(data.visible_courses || []);
    } catch (error) {
      console.error('Error loading access data:', error);
      toast({
        title: t('admin.users.activity.error', 'Error'),
        description: t('admin.users.activity.access.toasts.errorLoading', 'Failed to load access data'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllCourses = async () => {
    try {
      const res = await fetch('/api/lms/courses');
      if (!res.ok) throw new Error('Failed to load courses');
      const data = await res.json();
      setAllCourses(data.success ? data.data : []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedCourse) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/course-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          course_id: selectedCourse,
          access_type: 'grant',
          reason: overrideReason || 'Manual grant by admin'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to grant access');
      }

      toast({
        title: t('admin.users.activity.access.toasts.grantSuccess', 'Course access granted'),
      });

      setShowGrantDialog(false);
      setSelectedCourse('');
      setOverrideReason('');
      loadAccessData();
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast({
        title: t('admin.users.activity.error', 'Error'),
        description: error.message || t('admin.users.activity.access.toasts.grantError', 'Failed to grant access'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleHideAccess = async () => {
    if (!selectedCourse) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/course-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          course_id: selectedCourse,
          access_type: 'hide',
          reason: overrideReason || 'Hidden by admin'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to hide course');
      }

      toast({
        title: t('admin.users.activity.access.toasts.hideSuccess', 'Course hidden from student'),
      });

      setShowHideDialog(false);
      setSelectedCourse('');
      setOverrideReason('');
      loadAccessData();
    } catch (error: any) {
      console.error('Error hiding course:', error);
      toast({
        title: t('admin.users.activity.error', 'Error'),
        description: error.message || t('admin.users.activity.access.toasts.hideError', 'Failed to hide course'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveOverride = async () => {
    if (!overrideToRemove) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/course-overrides/${overrideToRemove.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to remove override');

      toast({
        title: t('admin.users.activity.access.toasts.removeSuccess', 'Override removed'),
      });

      setShowRemoveOverrideDialog(false);
      setOverrideToRemove(null);
      loadAccessData();
    } catch (error) {
      console.error('Error removing override:', error);
      toast({
        title: t('admin.users.activity.error', 'Error'),
        description: t('admin.users.activity.access.toasts.removeError', 'Failed to remove override'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <p>User not found</p>
      </div>
    );
  }

  const grantedOverrides = courseOverrides.filter(o => o.access_type === 'grant');
  const hiddenOverrides = courseOverrides.filter(o => o.access_type === 'hide');

  const availableForGrant = allCourses.filter(
    course => !visibleCourses.some(vc => vc.course_id === course.id) &&
              !grantedOverrides.some(o => o.course_id === course.id)
  );

  const availableForHide = visibleCourses.filter(
    vc => vc.source === 'program' && !hiddenOverrides.some(o => o.course_id === vc.course_id)
  );

  const headerCell = isRtl ? 'text-right' : 'text-left';
  const headerCellEnd = isRtl ? 'text-left' : 'text-right';

  return (
    <div className={embedded ? 'space-y-4' : 'p-6 space-y-4'} dir={direction}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/settings/users')}
            >
              <ArrowLeft className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('admin.users.activity.backToUsers', 'Back to users')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('admin.users.activity.tabs.access', 'Access')}</h1>
              <p className="text-sm text-muted-foreground">
                {user.first_name} {user.last_name} ({user.email})
              </p>
            </div>
          </div>
          <Badge variant="outline">
            {t(`admin.users.roles.${user.role.toLowerCase()}`, user.role)}
          </Badge>
        </div>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('admin.users.activity.access.formulaTitle', 'Access resolution formula')}</AlertTitle>
        <AlertDescription>
          {t('admin.users.activity.access.formulaBody', 'Visible courses = (Program courses ∪ Granted) − Hidden')}
        </AlertDescription>
      </Alert>

      {/* Program enrollments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>{t('admin.users.activity.access.programs.title', 'Program enrollments')}</span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.access.programs.count', '{{count}} programs').replace('{{count}}', String(programEnrollments.length))}
            </span>
          </CardTitle>
          <CardDescription>
            {t('admin.users.activity.access.programs.description', 'Programs this user is enrolled in (provides default course access)')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {programEnrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.programs.empty', 'Not enrolled in any programs')}</p>
            </div>
          ) : (
            <ResponsiveTable>
              <ResponsiveTable.Desktop>
                <div className="overflow-x-auto" dir={direction}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.programs.col.program', 'Program')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.programs.col.courses', 'Courses')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.programs.col.enrolled', 'Enrolled')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.programs.col.status', 'Status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programEnrollments.map((e) => (
                        <TableRow key={e.enrollment_id}>
                          <TableCell className="font-medium" dir="auto">{e.program_name}</TableCell>
                          <TableCell className="tabular-nums">{e.course_count}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(e.enrolled_at).toLocaleDateString(dateLocale)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {t(`admin.users.activity.values.enrollmentStatus.${e.enrollment_status}`, e.enrollment_status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ResponsiveTable.Desktop>

              <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
                {programEnrollments.map((e) => (
                  <div key={e.enrollment_id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium break-words" dir="auto">{e.program_name}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {t(`admin.users.activity.values.enrollmentStatus.${e.enrollment_status}`, e.enrollment_status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.users.activity.access.programs.coursesCount', { count: e.course_count })}
                      {' · '}
                      {new Date(e.enrolled_at).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                ))}
              </ResponsiveTable.Mobile>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* Direct course enrollments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>{t('admin.users.activity.access.courses.title', 'Course enrollments')}</span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.access.courses.count', '{{count}} courses').replace('{{count}}', String(courseEnrollments.length))}
            </span>
          </CardTitle>
          <CardDescription>
            {t('admin.users.activity.access.courses.description', 'Courses this user is enrolled in directly (outside of any program)')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {courseEnrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.courses.empty', 'No direct course enrollments')}</p>
            </div>
          ) : (
            <ResponsiveTable>
              <ResponsiveTable.Desktop>
                <div className="overflow-x-auto" dir={direction}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.courses.col.course', 'Course')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.courses.col.enrolled', 'Enrolled')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.courses.col.status', 'Status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseEnrollments.map((e) => (
                        <TableRow key={e.enrollment_id}>
                          <TableCell className="font-medium" dir="auto">{e.course_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(e.enrolled_at).toLocaleDateString(dateLocale)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {t(`admin.users.activity.values.enrollmentStatus.${e.enrollment_status}`, e.enrollment_status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ResponsiveTable.Desktop>

              <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
                {courseEnrollments.map((e) => (
                  <div key={e.enrollment_id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium break-words" dir="auto">{e.course_name}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {t(`admin.users.activity.values.enrollmentStatus.${e.enrollment_status}`, e.enrollment_status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.enrolled_at).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                ))}
              </ResponsiveTable.Mobile>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* Granted courses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-3 flex-wrap">
              <span>{t('admin.users.activity.access.granted.title', 'Granted courses')}</span>
              <span className="text-sm text-muted-foreground font-normal tabular-nums">
                {t('admin.users.activity.access.granted.count', '{{count}} granted').replace('{{count}}', String(grantedOverrides.length))}
              </span>
            </span>
            <Button
              size="sm"
              onClick={() => setShowGrantDialog(true)}
              disabled={availableForGrant.length === 0}
            >
              <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('admin.users.activity.access.granted.action', 'Grant access')}
            </Button>
          </CardTitle>
          <CardDescription>
            {t('admin.users.activity.access.granted.description', 'Courses granted outside of program enrollments')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {grantedOverrides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.granted.empty', 'No granted courses')}</p>
            </div>
          ) : (
            <ResponsiveTable>
              <ResponsiveTable.Desktop>
                <div className="overflow-x-auto" dir={direction}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.granted.col.course', 'Course')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.granted.col.reason', 'Reason')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.granted.col.granted', 'Granted')}</TableHead>
                        <TableHead className={headerCellEnd}>{t('common.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grantedOverrides.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium" dir="auto">{o.course_title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground" dir="auto">{o.reason || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(o.created_at).toLocaleDateString(dateLocale)}
                          </TableCell>
                          <TableCell className={headerCellEnd}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setOverrideToRemove(o);
                                setShowRemoveOverrideDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ResponsiveTable.Desktop>

              <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
                {grantedOverrides.map((o) => (
                  <div key={o.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium break-words" dir="auto">{o.course_title}</p>
                        {o.reason && (
                          <p className="text-sm text-muted-foreground break-words" dir="auto">{o.reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(o.created_at).toLocaleDateString(dateLocale)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          setOverrideToRemove(o);
                          setShowRemoveOverrideDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ResponsiveTable.Mobile>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* Hidden courses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-3 flex-wrap">
              <span>{t('admin.users.activity.access.hidden.title', 'Hidden courses')}</span>
              <span className="text-sm text-muted-foreground font-normal tabular-nums">
                {t('admin.users.activity.access.hidden.count', '{{count}} hidden').replace('{{count}}', String(hiddenOverrides.length))}
              </span>
            </span>
            <Button
              size="sm"
              onClick={() => setShowHideDialog(true)}
              disabled={availableForHide.length === 0}
            >
              <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('admin.users.activity.access.hidden.action', 'Hide course')}
            </Button>
          </CardTitle>
          <CardDescription>
            {t('admin.users.activity.access.hidden.description', "Courses hidden from this student's program(s)")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {hiddenOverrides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.hidden.empty', 'No hidden courses')}</p>
            </div>
          ) : (
            <ResponsiveTable>
              <ResponsiveTable.Desktop>
                <div className="overflow-x-auto" dir={direction}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.hidden.col.course', 'Course')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.hidden.col.reason', 'Reason')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.hidden.col.hidden', 'Hidden')}</TableHead>
                        <TableHead className={headerCellEnd}>{t('common.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hiddenOverrides.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium" dir="auto">{o.course_title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground" dir="auto">{o.reason || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(o.created_at).toLocaleDateString(dateLocale)}
                          </TableCell>
                          <TableCell className={headerCellEnd}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setOverrideToRemove(o);
                                setShowRemoveOverrideDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ResponsiveTable.Desktop>

              <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
                {hiddenOverrides.map((o) => (
                  <div key={o.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium break-words" dir="auto">{o.course_title}</p>
                        {o.reason && (
                          <p className="text-sm text-muted-foreground break-words" dir="auto">{o.reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(o.created_at).toLocaleDateString(dateLocale)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          setOverrideToRemove(o);
                          setShowRemoveOverrideDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ResponsiveTable.Mobile>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* Final visible courses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span>{t('admin.users.activity.access.visible.title', 'Final visible courses')}</span>
            </span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.access.visible.count', '{{count}} visible').replace('{{count}}', String(visibleCourses.length))}
            </span>
          </CardTitle>
          <CardDescription>
            {t('admin.users.activity.access.visible.description', 'Courses this student can actually see (after applying all rules)')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {visibleCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.visible.empty', 'No visible courses')}</p>
            </div>
          ) : (
            <ResponsiveTable>
              <ResponsiveTable.Desktop>
                <div className="overflow-x-auto" dir={direction}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.visible.col.course', 'Course')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.visible.col.source', 'Source')}</TableHead>
                        <TableHead className={headerCell}>{t('admin.users.activity.access.visible.col.required', 'Required')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleCourses.map((course) => {
                        const src = course.source as 'program' | 'course_enrollment' | 'manual_grant' | string;
                        let subtitle: string;
                        let badgeLabel: string;
                        let badgeVariant: 'default' | 'secondary' | 'outline';
                        if (src === 'program') {
                          subtitle = course.program_name
                            ? t('admin.users.activity.access.visible.fromProgram', { program: course.program_name })
                            : t('admin.users.activity.access.visible.fromProgramNoName', 'From a program');
                          badgeLabel = t('admin.users.activity.access.visible.sourceProgram', 'Program');
                          badgeVariant = 'default';
                        } else if (src === 'course_enrollment') {
                          subtitle = t('admin.users.activity.access.visible.fromCourseEnrollment', 'Direct course enrollment');
                          badgeLabel = t('admin.users.activity.access.visible.sourceCourseEnrollment', 'Course');
                          badgeVariant = 'secondary';
                        } else {
                          subtitle = t('admin.users.activity.access.visible.grantedDirectly', 'Granted directly');
                          badgeLabel = t('admin.users.activity.access.visible.sourceManualGrant', 'Manual grant');
                          badgeVariant = 'outline';
                        }
                        return (
                          <TableRow key={`${course.course_id}-${src}`}>
                            <TableCell className="font-medium" dir="auto">{course.course_title}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={badgeVariant} className="text-[10px] w-fit">{badgeLabel}</Badge>
                                <span className="text-xs text-muted-foreground" dir="auto">{subtitle}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {course.is_required ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {t('admin.users.activity.access.visible.requiredBadge', 'Required')}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ResponsiveTable.Desktop>

              <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
                {visibleCourses.map((course) => {
                  const src = course.source as 'program' | 'course_enrollment' | 'manual_grant' | string;
                  let subtitle: string;
                  let badgeLabel: string;
                  let badgeVariant: 'default' | 'secondary' | 'outline';
                  if (src === 'program') {
                    subtitle = course.program_name
                      ? t('admin.users.activity.access.visible.fromProgram', { program: course.program_name })
                      : t('admin.users.activity.access.visible.fromProgramNoName', 'From a program');
                    badgeLabel = t('admin.users.activity.access.visible.sourceProgram', 'Program');
                    badgeVariant = 'default';
                  } else if (src === 'course_enrollment') {
                    subtitle = t('admin.users.activity.access.visible.fromCourseEnrollment', 'Direct course enrollment');
                    badgeLabel = t('admin.users.activity.access.visible.sourceCourseEnrollment', 'Course');
                    badgeVariant = 'secondary';
                  } else {
                    subtitle = t('admin.users.activity.access.visible.grantedDirectly', 'Granted directly');
                    badgeLabel = t('admin.users.activity.access.visible.sourceManualGrant', 'Manual grant');
                    badgeVariant = 'outline';
                  }
                  return (
                    <div key={`${course.course_id}-${src}`} className="rounded-lg border p-3 space-y-1">
                      <p className="font-medium break-words" dir="auto">{course.course_title}</p>
                      <p className="text-xs text-muted-foreground break-words" dir="auto">{subtitle}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant={badgeVariant} className="text-[10px]">{badgeLabel}</Badge>
                        {course.is_required && (
                          <Badge variant="outline" className="text-[10px]">
                            {t('admin.users.activity.access.visible.requiredBadge', 'Required')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </ResponsiveTable.Mobile>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.activity.access.dialogs.grantTitle', 'Grant course access')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.activity.access.dialogs.grantSubtitle', 'Give this student access to a course outside their program')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.users.activity.access.dialogs.selectCourse', 'Select course')}</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.users.activity.access.dialogs.coursePlaceholder', 'Choose a course')} />
                </SelectTrigger>
                <SelectContent>
                  {availableForGrant.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.activity.access.dialogs.reason', 'Reason (optional)')}</Label>
              <Textarea
                placeholder={t('admin.users.activity.access.dialogs.grantReasonPh', 'Why is this access being granted?')}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGrantDialog(false);
                setSelectedCourse('');
                setOverrideReason('');
              }}
            >
              {t('admin.users.activity.access.dialogs.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleGrantAccess} disabled={!selectedCourse || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" /> : null}
              {t('admin.users.activity.access.dialogs.confirmGrant', 'Grant access')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.activity.access.dialogs.hideTitle', 'Hide course')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.activity.access.dialogs.hideSubtitle', 'Hide a course that this student would normally see from their program')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.users.activity.access.dialogs.selectCourse', 'Select course')}</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.users.activity.access.dialogs.hidePlaceholder', 'Choose a course to hide')} />
                </SelectTrigger>
                <SelectContent>
                  {availableForHide.map((course) => (
                    <SelectItem key={course.course_id} value={course.course_id}>
                      {course.course_title} {course.program_name ? `(${course.program_name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.activity.access.dialogs.reason', 'Reason (optional)')}</Label>
              <Textarea
                placeholder={t('admin.users.activity.access.dialogs.hideReasonPh', 'Why is this course being hidden?')}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowHideDialog(false);
                setSelectedCourse('');
                setOverrideReason('');
              }}
            >
              {t('admin.users.activity.access.dialogs.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleHideAccess} disabled={!selectedCourse || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" /> : null}
              {t('admin.users.activity.access.dialogs.confirmHide', 'Hide course')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRemoveOverrideDialog} onOpenChange={setShowRemoveOverrideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.users.activity.access.dialogs.removeTitle', 'Remove override?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {overrideToRemove?.access_type === 'grant'
                ? t('admin.users.activity.access.dialogs.removeGrantBody', 'The student will lose access to this course.')
                : t('admin.users.activity.access.dialogs.removeHideBody', 'The student will be able to see this course again.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.users.activity.access.dialogs.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveOverride} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" /> : null}
              {t('admin.users.activity.access.dialogs.remove', 'Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Eye, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

// Direct course enrollments — when a student bought / was enrolled in a
// single course rather than a whole program. Distinct from
// ProgramEnrollment because there's no program wrapper to roll up.
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
  /**
   * When true, hides the back-button header (used when embedded inside the
   * per-user tabbed page, which renders its own header).
   */
  embedded?: boolean;
}

export function UserAccessManagement({ userId, embedded = false }: UserAccessManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useAdminLanguage();

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
      // There is no GET /api/admin/users/[id] — pull the profile fields we
      // need (id, first/last name, email, role) from /summary, which is
      // always available to admins.
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

  return (
    <div className={embedded ? 'space-y-6' : 'p-6 space-y-6'}>
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

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.users.activity.access.programs.title', 'Program enrollments')}</CardTitle>
          <CardDescription>
            {t('admin.users.activity.access.programs.description', 'Programs this user is enrolled in (provides default course access)')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programEnrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.programs.empty', 'Not enrolled in any programs')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {programEnrollments.map((enrollment) => (
                <div
                  key={enrollment.enrollment_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{enrollment.program_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('admin.users.activity.access.programs.coursesCount', { count: enrollment.course_count })}
                      {' · '}
                      {t('admin.users.activity.access.programs.enrolledOn', 'Enrolled')}: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge>
                    {t(`admin.users.activity.values.enrollmentStatus.${enrollment.enrollment_status}`, enrollment.enrollment_status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct course enrollments — distinct from program enrollments
          above. A student can be enrolled in a single course without
          being part of any program; previously those didn't surface
          anywhere on this tab, only in "Final visible courses" at the
          bottom (if at all). */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.users.activity.access.courses.title', 'Course enrollments')}
          </CardTitle>
          <CardDescription>
            {t(
              'admin.users.activity.access.courses.description',
              'Courses this user is enrolled in directly (outside of any program)'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courseEnrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>
                {t(
                  'admin.users.activity.access.courses.empty',
                  'No direct course enrollments'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {courseEnrollments.map((enrollment) => (
                <div
                  key={enrollment.enrollment_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{enrollment.course_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'admin.users.activity.access.courses.enrolledOn',
                        'Enrolled'
                      )}
                      : {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge>
                    {t(
                      `admin.users.activity.values.enrollmentStatus.${enrollment.enrollment_status}`,
                      enrollment.enrollment_status
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.users.activity.access.granted.title', 'Granted courses')}</CardTitle>
              <CardDescription>
                {t('admin.users.activity.access.granted.description', 'Courses granted outside of program enrollments')}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowGrantDialog(true)}
              disabled={availableForGrant.length === 0}
            >
              <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('admin.users.activity.access.granted.action', 'Grant access')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {grantedOverrides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.granted.empty', 'No granted courses')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {grantedOverrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{override.course_title}</p>
                    <p className="text-sm text-muted-foreground">{override.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('admin.users.activity.access.granted.grantedOn', 'Granted')}: {new Date(override.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOverrideToRemove(override);
                      setShowRemoveOverrideDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.users.activity.access.hidden.title', 'Hidden courses')}</CardTitle>
              <CardDescription>
                {t('admin.users.activity.access.hidden.description', "Courses hidden from this student's program(s)")}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowHideDialog(true)}
              disabled={availableForHide.length === 0}
            >
              <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('admin.users.activity.access.hidden.action', 'Hide course')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hiddenOverrides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.hidden.empty', 'No hidden courses')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hiddenOverrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{override.course_title}</p>
                    <p className="text-sm text-muted-foreground">{override.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('admin.users.activity.access.hidden.hiddenOn', 'Hidden')}: {new Date(override.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOverrideToRemove(override);
                      setShowRemoveOverrideDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <div>
              <CardTitle>{t('admin.users.activity.access.visible.title', 'Final visible courses')}</CardTitle>
              <CardDescription>
                {t('admin.users.activity.access.visible.description', 'Courses this student can actually see (after applying all rules)')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visibleCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('admin.users.activity.access.visible.empty', 'No visible courses')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleCourses.map((course) => {
                // Three source buckets after the API's refinement:
                //   'program'           → student is enrolled in a program that includes this course
                //   'course_enrollment' → student is enrolled directly in this course
                //   'manual_grant' (or other) → admin explicitly granted access
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
                  subtitle = t(
                    'admin.users.activity.access.visible.fromCourseEnrollment',
                    'Direct course enrollment',
                  );
                  badgeLabel = t(
                    'admin.users.activity.access.visible.sourceCourseEnrollment',
                    'Course',
                  );
                  badgeVariant = 'secondary';
                } else {
                  subtitle = t(
                    'admin.users.activity.access.visible.grantedDirectly',
                    'Granted directly',
                  );
                  badgeLabel = t(
                    'admin.users.activity.access.visible.sourceManualGrant',
                    'Manual grant',
                  );
                  badgeVariant = 'outline';
                }
                return (
                  <div
                    key={`${course.course_id}-${src}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{course.course_title}</p>
                      <p className="text-sm text-muted-foreground">{subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                      {course.is_required && (
                        <Badge variant="outline">
                          {t('admin.users.activity.access.visible.requiredBadge', 'Required')}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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

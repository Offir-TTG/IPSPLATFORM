'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Eye, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

export default function UserAccessManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [programEnrollments, setProgramEnrollments] = useState<ProgramEnrollment[]>([]);
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
  }, [userId]);

  const loadUserData = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error('Failed to load user');
      const data = await res.json();
      setUser(data);
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
      setCourseOverrides(data.course_overrides || []);
      setVisibleCourses(data.visible_courses || []);
    } catch (error) {
      console.error('Error loading access data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load access data',
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
        title: 'Success',
        description: 'Course access granted'
      });

      setShowGrantDialog(false);
      setSelectedCourse('');
      setOverrideReason('');
      loadAccessData();
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant access',
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
        title: 'Success',
        description: 'Course hidden from student'
      });

      setShowHideDialog(false);
      setSelectedCourse('');
      setOverrideReason('');
      loadAccessData();
    } catch (error: any) {
      console.error('Error hiding course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to hide course',
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
        title: 'Success',
        description: 'Override removed'
      });

      setShowRemoveOverrideDialog(false);
      setOverrideToRemove(null);
      loadAccessData();
    } catch (error) {
      console.error('Error removing override:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove override',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p>User not found</p>
        </div>
      </AdminLayout>
    );
  }

  const grantedOverrides = courseOverrides.filter(o => o.access_type === 'grant');
  const hiddenOverrides = courseOverrides.filter(o => o.access_type === 'hide');

  // Get courses available for granting (not already visible)
  const availableForGrant = allCourses.filter(
    course => !visibleCourses.some(vc => vc.course_id === course.id) &&
              !grantedOverrides.some(o => o.course_id === course.id)
  );

  // Get courses available for hiding (currently visible from programs)
  const availableForHide = visibleCourses.filter(
    vc => vc.source === 'program' && !hiddenOverrides.some(o => o.course_id === vc.course_id)
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/users')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                Course Access Management
              </h1>
              <p className="text-sm text-muted-foreground">
                {user.first_name} {user.last_name} ({user.email})
              </p>
            </div>
          </div>
          <Badge variant="outline">{user.role}</Badge>
        </div>

        {/* Access Formula Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Resolution Formula</AlertTitle>
          <AlertDescription>
            Visible Courses = (Program Courses ∪ Granted) − Hidden
          </AlertDescription>
        </Alert>

        {/* Program Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle>Program Enrollments</CardTitle>
            <CardDescription>
              Programs this user is enrolled in (provides default course access)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programEnrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Not enrolled in any programs</p>
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
                        {enrollment.course_count} courses • Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{enrollment.enrollment_status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Granted Courses (Overrides) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Granted Courses</CardTitle>
                <CardDescription>
                  Courses granted outside of program enrollments
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowGrantDialog(true)}
                disabled={availableForGrant.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Grant Access
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {grantedOverrides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No granted courses</p>
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
                        Granted: {new Date(override.created_at).toLocaleDateString()}
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

        {/* Hidden Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hidden Courses</CardTitle>
                <CardDescription>
                  Courses hidden from this student's program(s)
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowHideDialog(true)}
                disabled={availableForHide.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Hide Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {hiddenOverrides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No hidden courses</p>
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
                        Hidden: {new Date(override.created_at).toLocaleDateString()}
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

        {/* Final Visible Courses (Preview) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <div>
                <CardTitle>Final Visible Courses</CardTitle>
                <CardDescription>
                  Courses this student can actually see (after applying all rules)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {visibleCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No visible courses</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleCourses.map((course) => (
                  <div
                    key={`${course.course_id}-${course.source}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{course.course_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.source === 'program' && course.program_name
                          ? `From: ${course.program_name}`
                          : 'Granted directly'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.source === 'program' ? 'default' : 'secondary'}>
                        {course.source}
                      </Badge>
                      {course.is_required && (
                        <Badge variant="outline">Required</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grant Access Dialog */}
        <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Course Access</DialogTitle>
              <DialogDescription>
                Give this student access to a course outside their program
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course" />
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
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Why is this access being granted?"
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
                Cancel
              </Button>
              <Button onClick={handleGrantAccess} disabled={!selectedCourse || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Grant Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hide Course Dialog */}
        <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hide Course</DialogTitle>
              <DialogDescription>
                Hide a course that this student would normally see from their program
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course to hide" />
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
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Why is this course being hidden?"
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
                Cancel
              </Button>
              <Button onClick={handleHideAccess} disabled={!selectedCourse || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Hide Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Override Dialog */}
        <AlertDialog open={showRemoveOverrideDialog} onOpenChange={setShowRemoveOverrideDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Override?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this {overrideToRemove?.access_type === 'grant' ? 'granted access' : 'hidden course'} override?
                {overrideToRemove?.access_type === 'grant'
                  ? ' The student will lose access to this course.'
                  : ' The student will be able to see this course again.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveOverride} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

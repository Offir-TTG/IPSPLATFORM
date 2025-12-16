'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Upload, Calculator, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface GradeItem {
  id: string;
  name: string;
  max_points: number;
  category_id: string | null;
  category_name?: string;
  display_order: number;
}

interface StudentGrade {
  id?: string;
  grade_item_id: string;
  student_id: string;
  points_earned: number | null;
  percentage: number | null;
  status: string;
  is_excused: boolean;
}

interface GradebookData {
  student_id: string;
  [gradeItemId: string]: number | null | string;
}

export default function GradebookPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';

  const [students, setStudents] = useState<Student[]>([]);
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [grades, setGrades] = useState<Map<string, StudentGrade>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGradebookData();
  }, [courseId]);

  async function loadGradebookData() {
    try {
      setLoading(true);

      // Load students enrolled in the course
      const studentsRes = await fetch(`/api/admin/lms/courses/${courseId}/students`);
      if (!studentsRes.ok) throw new Error('Failed to load students');
      const studentsData = await studentsRes.json();

      // Load grade items for the course
      const itemsRes = await fetch(`/api/admin/lms/courses/${courseId}/grading/items`);
      if (!itemsRes.ok) throw new Error('Failed to load grade items');
      const itemsData = await itemsRes.json();

      // Load all grades for this course
      const gradesRes = await fetch(`/api/admin/lms/courses/${courseId}/grading/grades`);
      if (!gradesRes.ok) throw new Error('Failed to load grades');
      const gradesData = await gradesRes.json();

      setStudents(studentsData.data || []);
      setGradeItems(itemsData.data || []);

      // Convert grades array to map for quick lookup
      const gradesMap = new Map<string, StudentGrade>();
      (gradesData.data || []).forEach((grade: StudentGrade) => {
        const key = `${grade.student_id}-${grade.grade_item_id}`;
        gradesMap.set(key, grade);
      });
      setGrades(gradesMap);
    } catch (error) {
      console.error('Error loading gradebook data:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.gradebook.error.load', 'Failed to load gradebook data'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleGradeChange(studentId: string, gradeItemId: string, value: string) {
    const key = `${studentId}-${gradeItemId}`;
    const gradeItem = gradeItems.find(item => item.id === gradeItemId);
    if (!gradeItem) return;

    const pointsEarned = value === '' ? null : parseFloat(value);
    const percentage = pointsEarned !== null ? (pointsEarned / gradeItem.max_points) * 100 : null;

    const existingGrade = grades.get(key);
    const updatedGrade: StudentGrade = {
      ...existingGrade,
      grade_item_id: gradeItemId,
      student_id: studentId,
      points_earned: pointsEarned,
      percentage: percentage,
      status: pointsEarned !== null ? 'graded' : 'not_submitted',
      is_excused: existingGrade?.is_excused || false,
    };

    const newGrades = new Map(grades);
    newGrades.set(key, updatedGrade);
    setGrades(newGrades);

    const newEditedCells = new Set(editedCells);
    newEditedCells.add(key);
    setEditedCells(newEditedCells);
  }

  async function handleSaveGrades() {
    if (editedCells.size === 0) {
      toast({
        title: t('common.info', 'Info'),
        description: t('admin.grading.gradebook.noChanges', 'No changes to save'),
      });
      return;
    }

    try {
      setSaving(true);

      const gradesToSave = Array.from(editedCells).map(key => {
        const grade = grades.get(key);
        return grade;
      }).filter(Boolean);

      const response = await fetch(`/api/admin/lms/courses/${courseId}/grading/grades/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesToSave }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save grades');
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.grading.gradebook.success.saved', 'Grades saved successfully'),
      });

      setEditedCells(new Set());
      loadGradebookData(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error saving grades:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.grading.gradebook.error.save', 'Failed to save grades'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function calculateStudentTotal(studentId: string): { earned: number; possible: number; percentage: number } {
    let totalEarned = 0;
    let totalPossible = 0;

    gradeItems.forEach(item => {
      const key = `${studentId}-${item.id}`;
      const grade = grades.get(key);

      if (grade?.points_earned !== null && grade?.points_earned !== undefined) {
        totalEarned += grade.points_earned;
      }
      totalPossible += item.max_points;
    });

    const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    return { earned: totalEarned, possible: totalPossible, percentage };
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <p>{t('common.loading', 'Loading...')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/lms/courses/${courseId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Calculator className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('admin.grading.gradebook.title', 'Gradebook')}
              </h1>
              <p className="text-muted-foreground">
                {t('admin.grading.gradebook.subtitle', 'Manage student grades for this course')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{t('admin.grading.gradebook.export', 'Export')}</span>
            </Button>
            <Button variant="outline" disabled>
              <Upload className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{t('admin.grading.gradebook.import', 'Import')}</span>
            </Button>
            <Button onClick={handleSaveGrades} disabled={saving || editedCells.size === 0}>
              <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')} {editedCells.size > 0 && `(${editedCells.size})`}</span>
            </Button>
          </div>
        </div>

        {/* Gradebook Table */}
        {students.length === 0 || gradeItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('admin.grading.gradebook.empty.title', 'No Data Available')}
              </h3>
              <p className="text-muted-foreground">
                {students.length === 0
                  ? t('admin.grading.gradebook.empty.noStudents', 'No students enrolled in this course')
                  : t('admin.grading.gradebook.empty.noItems', 'No grade items created for this course')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="sticky left-0 z-20 bg-muted p-3 text-left font-semibold border-r min-w-[200px]">
                        {t('admin.grading.gradebook.student', 'Student')}
                      </th>
                      {gradeItems
                        .sort((a, b) => a.display_order - b.display_order)
                        .map(item => (
                          <th key={item.id} className="p-3 text-center font-semibold border-r min-w-[100px]">
                            <div className="flex flex-col">
                              <span className="text-xs truncate">{item.name}</span>
                              <span className="text-xs text-muted-foreground">/{item.max_points}</span>
                            </div>
                          </th>
                        ))}
                      <th className="sticky right-0 z-20 bg-muted p-3 text-center font-semibold min-w-[120px]">
                        {t('admin.grading.gradebook.total', 'Total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const total = calculateStudentTotal(student.id);
                      return (
                        <tr key={student.id} className="border-t hover:bg-muted/50">
                          <td className="sticky left-0 z-10 bg-background p-3 border-r">
                            <div>
                              <p className="font-medium">{student.full_name}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                          </td>
                          {gradeItems
                            .sort((a, b) => a.display_order - b.display_order)
                            .map(item => {
                              const key = `${student.id}-${item.id}`;
                              const grade = grades.get(key);
                              const isEdited = editedCells.has(key);

                              return (
                                <td key={item.id} className="p-2 border-r">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={item.max_points}
                                    value={grade?.points_earned ?? ''}
                                    onChange={(e) => handleGradeChange(student.id, item.id, e.target.value)}
                                    className={`text-center ${isEdited ? 'border-yellow-500 bg-yellow-50' : ''}`}
                                    placeholder="-"
                                  />
                                  {grade?.percentage !== null && grade?.percentage !== undefined && (
                                    <p className="text-xs text-center text-muted-foreground mt-1">
                                      {grade.percentage.toFixed(1)}%
                                    </p>
                                  )}
                                </td>
                              );
                            })}
                          <td className="sticky right-0 z-10 bg-background p-3 text-center border-l">
                            <div>
                              <p className="font-semibold">
                                {total.earned.toFixed(2)} / {total.possible.toFixed(2)}
                              </p>
                              <Badge variant={total.percentage >= 60 ? 'default' : 'destructive'}>
                                {total.percentage.toFixed(1)}%
                              </Badge>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

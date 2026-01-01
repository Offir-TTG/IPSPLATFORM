'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Award,
  TrendingUp,
  Calculator,
  BookOpen,
} from 'lucide-react';
import { Course } from '@/types/lms';

interface GradeCategory {
  id: string;
  name: string;
  weight_percentage: number;
  color_code: string;
}

interface StudentGrade {
  id: string;
  grade_item_id: string;
  grade_item_name: string;
  points_earned: number | null;
  max_points: number;
  percentage: number | null;
  status: string;
  is_excused: boolean;
  feedback: string | null;
  graded_at: string | null;
  category_name?: string;
  category_color?: string;
}

interface CourseSummary {
  course_name: string;
  course_description: string | null;
  overall_grade: number;
  total_points_earned: number;
  total_points_possible: number;
  letter_grade?: string;
}

export default function StudentGradesPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useUserLanguage();
  const isRtl = language === 'he';

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [summary, setSummary] = useState<CourseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
    loadGrades();
    loadSummary();
    loadCategories();
  }, [courseId]);

  async function loadCourse() {
    try {
      const response = await fetch(`/api/lms/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to load course');
      const result = await response.json();
      setCourse(result.data);
    } catch (error: any) {
      console.error('Error loading course:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    }
  }

  async function loadGrades() {
    try {
      const response = await fetch(`/api/user/courses/${courseId}/grades`);
      if (!response.ok) throw new Error('Failed to load grades');
      const result = await response.json();
      setGrades(result.data || []);
    } catch (error: any) {
      console.error('Error loading grades:', error);
      toast.error(t('common.error', 'Error'), {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    try {
      const response = await fetch(`/api/user/courses/${courseId}/grade-summary`);
      if (!response.ok) throw new Error('Failed to load summary');
      const result = await response.json();
      setSummary(result.data);
    } catch (error: any) {
      console.error('Error loading summary:', error);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch(`/api/user/courses/${courseId}/grade-categories`);
      if (response.ok) {
        const result = await response.json();
        setCategories(result.data || []);
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  }

  function getLetterGradeColor(percentage: number): string {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  function getCategoryGrade(categoryId: string): { earned: number; possible: number; percentage: number } {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return { earned: 0, possible: 0, percentage: 0 };

    const categoryGrades = grades.filter(g => g.category_name === category.name);
    let earned = 0;
    let possible = 0;

    categoryGrades.forEach(grade => {
      if (!grade.is_excused && grade.points_earned !== null) {
        earned += grade.points_earned;
        possible += grade.max_points;
      }
    });

    const percentage = possible > 0 ? (earned / possible) * 100 : 0;
    return { earned, possible, percentage };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/courses/${courseId}`)}
        >
          <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('common.back', 'Back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold" suppressHydrationWarning>
            {t('user.grades.title', 'My Grades')}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {course?.title}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('user.grades.overallGrade', 'Overall Grade')}
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getLetterGradeColor(summary.overall_grade)}`}>
                {summary.letter_grade || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.overall_grade.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('user.grades.pointsEarned', 'Points Earned')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.total_points_earned.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('user.grades.totalPoints', 'Total Points')}
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_points_possible.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('user.grades.assignments', 'Assignments')}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{grades.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories Overview */}
      {categories.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle suppressHydrationWarning>
              {t('user.grades.categories.title', 'Grade Categories')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map(category => {
              const categoryGrade = getCategoryGrade(category.id);
              const percentage = categoryGrade.percentage;

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-12 rounded"
                        style={{ backgroundColor: category.color_code || '#3B82F6' }}
                      />
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                          {t('user.grades.categories.weight', 'Weight')}: {category.weight_percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getLetterGradeColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {categoryGrade.earned.toFixed(0)}/{categoryGrade.possible.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle suppressHydrationWarning>
            {t('user.grades.assignments.title', 'Graded Assignments')}
          </CardTitle>
          <CardDescription suppressHydrationWarning>
            {t('user.grades.empty.description', 'Your grades will appear here once assignments are graded')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {grades.map((grade) => {
              const percentage = grade.percentage || 0;

              return (
                <div
                  key={grade.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {grade.category_color && (
                        <div
                          className="w-1 h-6 rounded"
                          style={{ backgroundColor: grade.category_color }}
                        />
                      )}
                      <p className="font-medium">{grade.grade_item_name}</p>
                    </div>
                    {grade.category_name && (
                      <Badge variant="outline" className="mb-2">
                        {grade.category_name}
                      </Badge>
                    )}
                    {grade.feedback && (
                      <p className="text-sm text-muted-foreground italic mt-2">
                        "{grade.feedback}"
                      </p>
                    )}
                    {grade.graded_at && (
                      <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                        {t('user.grades.gradedOn', 'Graded on')} {new Date(grade.graded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {grade.is_excused ? (
                      <Badge variant="secondary" suppressHydrationWarning>
                        {t('user.grades.excused', 'Excused')}
                      </Badge>
                    ) : grade.points_earned !== null ? (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getLetterGradeColor(percentage)}`}>
                          {grade.points_earned}/{grade.max_points}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={percentage} className="h-2 w-24" />
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" suppressHydrationWarning>
                        {t('user.grades.notGraded', 'Not Yet Graded')}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}

            {grades.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" suppressHydrationWarning>
                {t('user.grades.empty.title', 'No Grades Yet')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Award, TrendingUp, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface GradeCategory {
  id: string;
  name: string;
  weight_percentage: number;
  color_code: string;
}

interface GradeItem {
  id: string;
  name: string;
  max_points: number;
  category_id: string | null;
  category_name?: string;
  category_color?: string;
  due_date: string | null;
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
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { t, direction } = useUserLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [summary, setSummary] = useState<CourseSummary | null>(null);

  useEffect(() => {
    loadGrades();
  }, [courseId]);

  async function loadGrades() {
    try {
      setLoading(true);

      // Load student's grades for this course
      const gradesRes = await fetch(`/api/user/courses/${courseId}/grades`);
      if (!gradesRes.ok) throw new Error('Failed to load grades');
      const gradesData = await gradesRes.json();

      // Load course summary
      const summaryRes = await fetch(`/api/user/courses/${courseId}/grade-summary`);
      if (!summaryRes.ok) throw new Error('Failed to load grade summary');
      const summaryData = await summaryRes.json();

      // Load categories
      const categoriesRes = await fetch(`/api/user/courses/${courseId}/grade-categories`);
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || []);
      }

      setGrades(gradesData.data || []);
      setSummary(summaryData.data);
    } catch (error) {
      console.error('Error loading grades:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('user.grades.error.load', 'Failed to load grades'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function getLetterGrade(percentage: number): { letter: string; color: string } {
    if (percentage >= 90) return { letter: 'A', color: 'hsl(var(--success))' };
    if (percentage >= 80) return { letter: 'B', color: 'hsl(var(--primary))' };
    if (percentage >= 70) return { letter: 'C', color: 'hsl(var(--warning))' };
    if (percentage >= 60) return { letter: 'D', color: 'hsl(var(--destructive) / 0.7)' };
    return { letter: 'F', color: 'hsl(var(--destructive))' };
  }

  function getCategoryGrade(categoryId: string): { earned: number; possible: number; percentage: number } {
    const categoryGrades = grades.filter(g => g.category_name && g.grade_item_id);
    const itemsInCategory = categoryGrades.filter(g => {
      // Find the grade item's category
      return g.category_name === categories.find(c => c.id === categoryId)?.name;
    });

    let earned = 0;
    let possible = 0;

    itemsInCategory.forEach(grade => {
      if (grade.points_earned !== null && !grade.is_excused) {
        earned += grade.points_earned;
        possible += grade.max_points;
      }
    });

    const percentage = possible > 0 ? (earned / possible) * 100 : 0;
    return { earned, possible, percentage };
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  const overallGrade = summary ? getLetterGrade(summary.overall_grade) : { letter: 'N/A', color: 'hsl(var(--muted))' };

  return (
    <div className="min-h-screen pb-12" dir={direction}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/courses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Calculator className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <h1 style={{
          fontSize: 'var(--font-size-3xl)',
          fontFamily: 'var(--font-family-heading)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'hsl(var(--text-heading))',
          marginBottom: '0.5rem'
        }}>{t('user.grades.title', 'My Grades')}</h1>
        {summary && (
          <div>
            <p style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'hsl(var(--text-body))',
              marginBottom: '0.25rem'
            }}>{summary.course_name}</p>
            {summary.course_description && (
              <p style={{
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-primary)'
              }}>
                {summary.course_description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="p-6" style={{ borderLeft: `4px solid ${overallGrade.color}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>{t('user.grades.overallGrade', 'Overall Grade')}</p>
              <div className="flex items-baseline gap-2">
                <p style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: overallGrade.color
                }}>{overallGrade.letter}</p>
                <p style={{
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))'
                }}>{summary?.overall_grade.toFixed(1)}%</p>
              </div>
            </div>
            <Award className="h-8 w-8" style={{ color: overallGrade.color, opacity: 0.5 }} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>{t('user.grades.pointsEarned', 'Points Earned')}</p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{summary?.total_points_earned.toFixed(0)}</p>
            </div>
            <TrendingUp className="h-8 w-8" style={{ color: 'hsl(var(--primary))', opacity: 0.5 }} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>{t('user.grades.totalPoints', 'Total Points')}</p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{summary?.total_points_possible.toFixed(0)}</p>
            </div>
            <Calculator className="h-8 w-8" style={{ color: 'hsl(var(--text-muted))', opacity: 0.5 }} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }}>{t('user.grades.assignments', 'Assignments')}</p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{grades.length}</p>
            </div>
            <BookOpen className="h-8 w-8" style={{ color: 'hsl(var(--text-muted))', opacity: 0.5 }} />
          </div>
        </Card>
      </div>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('user.grades.categories.title', 'Grade Categories')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map(category => {
              const categoryGrade = getCategoryGrade(category.id);
              const categoryLetter = getLetterGrade(categoryGrade.percentage);

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-12 rounded"
                        style={{ backgroundColor: category.color_code || '#3B82F6' }}
                      />
                      <div>
                        <p style={{
                          fontSize: 'var(--font-size-base)',
                          fontFamily: 'var(--font-family-primary)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'hsl(var(--text-heading))'
                        }}>{category.name}</p>
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          fontFamily: 'var(--font-family-primary)',
                          color: 'hsl(var(--text-muted))'
                        }}>{t('user.grades.categories.weight', 'Weight')}: {category.weight_percentage}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" style={{ backgroundColor: categoryLetter.color, color: 'white' }}>
                        {categoryLetter.letter}
                      </Badge>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))',
                        marginTop: '0.25rem'
                      }}>
                        {categoryGrade.earned.toFixed(0)}/{categoryGrade.possible.toFixed(0)} ({categoryGrade.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <Progress value={categoryGrade.percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('user.grades.assignments.title', 'All Assignments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: 'hsl(var(--text-muted))' }} />
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.5rem'
              }}>{t('user.grades.empty.title', 'No Grades Yet')}</h3>
              <p style={{
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-primary)'
              }}>
                {t('user.grades.empty.description', 'Your grades will appear here once they are posted')}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {grades.map(grade => {
                const gradePercentage = grade.percentage || 0;
                const gradeLetter = getLetterGrade(gradePercentage);

                return (
                  <div key={grade.id} className="py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {grade.category_name && (
                            <div
                              className="w-1 h-6 rounded"
                              style={{ backgroundColor: grade.category_color || '#3B82F6' }}
                            />
                          )}
                          <p style={{
                            fontSize: 'var(--font-size-base)',
                            fontFamily: 'var(--font-family-primary)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'hsl(var(--text-heading))'
                          }}>{grade.grade_item_name}</p>
                        </div>
                        {grade.category_name && (
                          <Badge variant="outline" className="mb-2">
                            {grade.category_name}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        {grade.is_excused ? (
                          <Badge variant="secondary">{t('user.grades.excused', 'Excused')}</Badge>
                        ) : grade.points_earned !== null ? (
                          <div>
                            <Badge variant="secondary" style={{ backgroundColor: gradeLetter.color, color: 'white' }}>
                              {gradeLetter.letter}
                            </Badge>
                            <p style={{
                              fontSize: 'var(--font-size-lg)',
                              fontFamily: 'var(--font-family-primary)',
                              fontWeight: 'var(--font-weight-bold)',
                              color: 'hsl(var(--text-heading))',
                              marginTop: '0.25rem'
                            }}>
                              {grade.points_earned}/{grade.max_points}
                            </p>
                            <p style={{
                              fontSize: 'var(--font-size-sm)',
                              fontFamily: 'var(--font-family-primary)',
                              color: 'hsl(var(--text-muted))'
                            }}>
                              {gradePercentage.toFixed(1)}%
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline">{t('user.grades.notGraded', 'Not Graded')}</Badge>
                        )}
                      </div>
                    </div>

                    {grade.points_earned !== null && !grade.is_excused && (
                      <Progress value={gradePercentage} className="h-2 mb-2" />
                    )}

                    {grade.feedback && (
                      <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          fontFamily: 'var(--font-family-primary)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'hsl(var(--text-heading))',
                          marginBottom: '0.25rem'
                        }}>{t('user.grades.feedback', 'Feedback')}</p>
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          fontFamily: 'var(--font-family-primary)',
                          color: 'hsl(var(--text-body))'
                        }}>{grade.feedback}</p>
                      </div>
                    )}

                    {grade.graded_at && (
                      <p style={{
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))',
                        marginTop: '0.5rem'
                      }}>
                        {t('user.grades.gradedOn', 'Graded on')} {new Date(grade.graded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

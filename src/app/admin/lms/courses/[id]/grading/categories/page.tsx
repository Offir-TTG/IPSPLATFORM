'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, Award, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import type { GradeCategory } from '@/types/grading';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GradeCategoriesPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';

  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GradeCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<GradeCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weight: 0,
    drop_lowest: 0,
    display_order: 1,
    color_code: '#3B82F6',
  });

  useEffect(() => {
    loadCategories();
  }, [courseId]);

  async function loadCategories() {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/lms/courses/${courseId}/grading/categories`);
      if (!response.ok) throw new Error('Failed to load categories');

      const data = await response.json();
      setCategories(data.data || []);
      setTotalWeight(data.totalWeight || 0);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.categories.error.load', 'Failed to load grade categories'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateDialog() {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      weight: 0,
      drop_lowest: 0,
      display_order: categories.length + 1,
      color_code: '#3B82F6',
    });
    setCreateDialogOpen(true);
  }

  function handleOpenEditDialog(category: GradeCategory) {
    setFormData({
      name: category.name,
      description: category.description || '',
      weight: category.weight_percentage,
      drop_lowest: category.drop_lowest,
      display_order: category.display_order,
      color_code: category.color_code || '#3B82F6',
    });
    setEditingCategory(category);
    setCreateDialogOpen(true);
  }

  async function handleSaveCategory() {
    if (!formData.name.trim()) {
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.categories.validation.nameRequired', 'Please enter a category name'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.weight < 0 || formData.weight > 100) {
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.categories.validation.weightRange', 'Weight must be between 0 and 100'),
        variant: 'destructive',
      });
      return;
    }

    // Check if total weight would exceed 100%
    const currentCategoryWeight = editingCategory?.weight_percentage || 0;
    const otherCategoriesWeight = totalWeight - currentCategoryWeight;
    const newTotalWeight = otherCategoriesWeight + formData.weight;

    if (newTotalWeight > 100) {
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.categories.validation.exceedsTotal',
          'Total weight would exceed 100%. Other categories: {other}%, New weight: {new}%')
          .replace('{other}', otherCategoriesWeight.toFixed(2))
          .replace('{new}', formData.weight.toString()),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingCategory) {
        // Update existing category
        const response = await fetch(
          `/api/admin/lms/courses/${courseId}/grading/categories/${editingCategory.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update category');
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('admin.grading.categories.success.updated', 'Grade category updated successfully'),
        });
      } else {
        // Create new category
        const response = await fetch(`/api/admin/lms/courses/${courseId}/grading/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, course_id: courseId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create category');
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('admin.grading.categories.success.created', 'Grade category created successfully'),
        });
      }

      setCreateDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.grading.categories.error.save', 'Failed to save grade category'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleOpenDeleteDialog(category: GradeCategory) {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/admin/lms/courses/${courseId}/grading/categories/${categoryToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.grading.categories.success.deleted', 'Grade category deleted successfully'),
      });

      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.grading.categories.error.delete', 'Failed to delete grade category'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
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
            <Award className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('admin.grading.categories.title', 'Grade Categories')}</h1>
              <p className="text-muted-foreground">
                {t('admin.grading.categories.subtitle', 'Manage weighted categories for this course')}
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span>{t('admin.grading.categories.addCategory', 'Add Category')}</span>
          </Button>
        </div>

        {/* Weight Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.grading.categories.totalWeight', 'Total Weight')}</p>
                <p className="text-3xl font-bold">
                  {totalWeight}%
                  {totalWeight < 100 && (
                    <span className="text-lg text-muted-foreground ml-2">/ 100%</span>
                  )}
                </p>
              </div>
              {totalWeight > 100 && (
                <Badge variant="destructive">{t('admin.grading.categories.exceedsLimit', 'Exceeds 100%')}</Badge>
              )}
              {totalWeight === 100 && (
                <Badge variant="default">{t('admin.grading.categories.complete', 'Complete')}</Badge>
              )}
              {totalWeight < 100 && totalWeight > 0 && (
                <Badge variant="secondary">{100 - totalWeight}% {t('admin.grading.categories.remaining', 'remaining')}</Badge>
              )}
            </div>
            {totalWeight > 100 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('admin.grading.categories.weightExceedsWarning', 'Total weight exceeds 100%. Please adjust category weights.')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Categories List */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('admin.grading.categories.empty.title', 'No Grade Categories')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.grading.categories.empty.description', 'Add grade categories to organize assignments and calculate final grades')}
              </p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span>{t('admin.grading.categories.empty.addFirst', 'Add First Category')}</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {categories
              .sort((a, b) => a.display_order - b.display_order)
              .map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className="w-4 h-16 rounded"
                          style={{ backgroundColor: category.color_code || '#3B82F6' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <Badge variant="secondary">{category.weight_percentage}%</Badge>
                            {category.drop_lowest > 0 && (
                              <Badge variant="outline">
                                Drop {category.drop_lowest} lowest
                              </Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">{t('admin.grading.categories.info.title', 'About Grade Categories')}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {t('admin.grading.categories.info.description', 'Grade categories help you organize assignments and calculate weighted final grades.')}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t('admin.grading.categories.info.point1', 'Each category has a weight (percentage) that contributes to the final grade')}</li>
              <li>{t('admin.grading.categories.info.point2', 'Total weight should equal 100% for accurate grading')}</li>
              <li>{t('admin.grading.categories.info.point3', 'Drop lowest allows you to automatically drop the lowest N scores in a category')}</li>
              <li>{t('admin.grading.categories.info.example', 'Example: Homework (20%), Quizzes (15%), Midterm (25%), Final (40%)')}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('admin.grading.categories.dialog.edit', 'Edit Grade Category') : t('admin.grading.categories.dialog.add', 'Add Grade Category')}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? t('admin.grading.categories.dialog.editDescription', 'Update the grade category details')
                : t('admin.grading.categories.dialog.addDescription', 'Create a new weighted category for this course')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('admin.grading.categories.form.name', 'Category Name')} *</Label>
              <Input
                id="name"
                placeholder={t('admin.grading.categories.form.namePlaceholder', 'e.g., Homework, Quizzes, Exams')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.grading.categories.form.description', 'Description (optional)')}</Label>
              <Textarea
                id="description"
                placeholder={t('admin.grading.categories.form.descriptionPlaceholder', 'Optional description for this category')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">{t('admin.grading.categories.form.weight', 'Weight (%)')} *</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.grading.categories.form.weightHelper', 'Current total: {current}% | After adding: {after}%')
                  .replace('{current}', totalWeight.toString())
                  .replace('{after}', (totalWeight - (editingCategory?.weight_percentage || 0) + formData.weight).toString())}
              </p>
            </div>

            {/* Drop Lowest */}
            <div className="space-y-2">
              <Label htmlFor="drop_lowest">{t('admin.grading.categories.form.dropLowest', 'Drop Lowest Scores')}</Label>
              <Input
                id="drop_lowest"
                type="number"
                min="0"
                value={formData.drop_lowest}
                onChange={(e) => setFormData({ ...formData, drop_lowest: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.grading.categories.form.dropLowestHelper', 'Automatically drop the N lowest scores in this category')}
              </p>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">{t('admin.grading.categories.form.displayOrder', 'Display Order')}</Label>
              <Input
                id="display_order"
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color_code">{t('admin.grading.categories.form.color', 'Color')}</Label>
              <div className="flex gap-2">
                <Input
                  id="color_code"
                  type="color"
                  value={formData.color_code}
                  onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color_code}
                  onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving ? t('common.saving', 'Saving...') : editingCategory ? t('common.update', 'Update') : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent dir={direction}>
          <DialogHeader>
            <DialogTitle>
              {t('admin.grading.categories.delete.title', 'Delete Grade Category')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'admin.grading.categories.delete.description',
                'Are you sure you want to delete this grade category? This action cannot be undone.'
              )}
            </DialogDescription>
          </DialogHeader>

          {categoryToDelete && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-12 rounded"
                    style={{ backgroundColor: categoryToDelete.color_code || '#3B82F6' }}
                  />
                  <div>
                    <p className="font-semibold">{categoryToDelete.name}</p>
                    <Badge variant="secondary" className="mt-1">{categoryToDelete.weight_percentage}%</Badge>
                  </div>
                </div>
                {categoryToDelete.description && (
                  <p className="text-sm text-muted-foreground mt-2">{categoryToDelete.description}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={deleting}>
              {deleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

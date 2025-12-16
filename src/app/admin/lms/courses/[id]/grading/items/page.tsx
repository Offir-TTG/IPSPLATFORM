'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, ClipboardList, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import type { GradeItem, GradeCategory } from '@/types/grading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function GradeItemsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';

  const [items, setItems] = useState<GradeItem[]>([]);
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GradeItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    max_points: 100,
    due_date: '',
    available_from: '',
    available_until: '',
    is_published: true,
    is_extra_credit: false,
    allow_late_submission: true,
    display_order: 1,
  });

  useEffect(() => {
    loadCategories();
    loadItems();
  }, [courseId]);

  async function loadCategories() {
    try {
      const response = await fetch(`/api/admin/lms/courses/${courseId}/grading/categories`);
      const data = await response.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadItems() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/lms/courses/${courseId}/grading/items`);

      if (!response.ok) {
        throw new Error('Failed to load grade items');
      }

      const data = await response.json();
      setItems(data.data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.items.error.load', 'Failed to load grade items'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateDialog() {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
      max_points: 100,
      due_date: '',
      available_from: '',
      available_until: '',
      is_published: true,
      is_extra_credit: false,
      allow_late_submission: true,
      display_order: 1,
    });
    setCreateDialogOpen(true);
  }

  function handleOpenEditDialog(item: GradeItem) {
    setFormData({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id || '',
      max_points: item.max_points,
      due_date: item.due_date ? item.due_date.split('T')[0] : '',
      available_from: item.available_from ? item.available_from.split('T')[0] : '',
      available_until: item.available_until ? item.available_until.split('T')[0] : '',
      is_published: item.is_published,
      is_extra_credit: item.is_extra_credit,
      allow_late_submission: item.allow_late_submission,
      display_order: item.display_order,
    });
    setEditingItem(item);
    setCreateDialogOpen(true);
  }

  async function handleSaveItem() {
    if (!formData.name.trim()) {
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.items.validation.nameRequired', 'Please enter an item name'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.max_points <= 0) {
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.items.validation.maxPointsPositive', 'Max points must be greater than 0'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        // Update existing item
        const response = await fetch(
          `/api/admin/lms/courses/${courseId}/grading/items/${editingItem.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              category_id: formData.category_id || null,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update item');
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('admin.grading.items.success.updated', 'Grade item updated successfully'),
        });
      } else {
        // Create new item
        const response = await fetch(`/api/admin/lms/courses/${courseId}/grading/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            course_id: courseId,
            category_id: formData.category_id || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create item');
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('admin.grading.items.success.created', 'Grade item created successfully'),
        });
      }

      setCreateDialogOpen(false);
      loadItems();
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.grading.items.error.save', 'Failed to save grade item'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm(t('admin.grading.items.confirm.delete', 'Are you sure you want to delete this grade item?'))) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/lms/courses/${courseId}/grading/items/${itemId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.grading.items.success.deleted', 'Grade item deleted successfully'),
      });

      loadItems();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.grading.items.error.delete', 'Failed to delete grade item'),
        variant: 'destructive',
      });
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, GradeItem[]>);

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
            <ClipboardList className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('admin.grading.items.title', 'Grade Items')}</h1>
              <p className="text-muted-foreground">
                {t('admin.grading.items.subtitle', 'Manage assignments, quizzes, and exams')}
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span>{t('admin.grading.items.addItem', 'Add Item')}</span>
          </Button>
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('admin.grading.items.empty.title', 'No Grade Items')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.grading.items.empty.description', 'Add grade items like assignments, quizzes, and exams')}
              </p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span>{t('admin.grading.items.empty.addFirst', 'Add First Item')}</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Render items grouped by category */}
            {Object.entries(itemsByCategory).map(([categoryId, categoryItems]) => {
              const category = categories.find(c => c.id === categoryId);
              const categoryName = category?.name || t('admin.grading.items.uncategorized', 'Uncategorized');
              const categoryColor = category?.color_code || '#94A3B8';

              return (
                <div key={categoryId} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-8 rounded"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <h2 className="text-xl font-semibold">{categoryName}</h2>
                    {category && (
                      <Badge variant="secondary">{category.weight_percentage}%</Badge>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {categoryItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{item.name}</h3>
                                <Badge variant="outline">{item.max_points} pts</Badge>
                                {item.is_extra_credit && (
                                  <Badge variant="default">{t('admin.grading.items.extraCredit', 'Extra Credit')}</Badge>
                                )}
                                {!item.is_published && (
                                  <Badge variant="secondary">{t('admin.grading.items.draft', 'Draft')}</Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {item.due_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{t('admin.grading.items.due', 'Due')}: {formatDate(item.due_date)}</span>
                                  </div>
                                )}
                                {!item.allow_late_submission && (
                                  <Badge variant="outline">{t('admin.grading.items.noLateSubmission', 'No late submissions')}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditDialog(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('admin.grading.items.dialog.edit', 'Edit Grade Item') : t('admin.grading.items.dialog.add', 'Add Grade Item')}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? t('admin.grading.items.dialog.editDescription', 'Update the grade item details')
                : t('admin.grading.items.dialog.addDescription', 'Create a new assignment, quiz, or exam')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('admin.grading.items.form.name', 'Item Name')} *</Label>
              <Input
                id="name"
                placeholder={t('admin.grading.items.form.namePlaceholder', 'e.g., Homework 1, Midterm Exam')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.grading.items.form.description', 'Description (optional)')}</Label>
              <Textarea
                id="description"
                placeholder={t('admin.grading.items.form.descriptionPlaceholder', 'Optional description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">{t('admin.grading.items.form.category', 'Category')}</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.grading.items.form.selectCategory', 'Select a category (optional)')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('admin.grading.items.form.noCategory', 'No category')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.weight_percentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Points */}
            <div className="space-y-2">
              <Label htmlFor="max_points">{t('admin.grading.items.form.maxPoints', 'Max Points')} *</Label>
              <Input
                id="max_points"
                type="number"
                min="1"
                step="0.01"
                value={formData.max_points}
                onChange={(e) => setFormData({ ...formData, max_points: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">{t('admin.grading.items.form.dueDate', 'Due Date (optional)')}</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            {/* Available From/Until */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="available_from">{t('admin.grading.items.form.availableFrom', 'Available From')}</Label>
                <Input
                  id="available_from"
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="available_until">{t('admin.grading.items.form.availableUntil', 'Available Until')}</Label>
                <Input
                  id="available_until"
                  type="date"
                  value={formData.available_until}
                  onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: !!checked })}
                />
                <Label htmlFor="is_published" className="font-normal">
                  {t('admin.grading.items.form.isPublished', 'Published (visible to students)')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_extra_credit"
                  checked={formData.is_extra_credit}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_extra_credit: !!checked })}
                />
                <Label htmlFor="is_extra_credit" className="font-normal">
                  {t('admin.grading.items.form.isExtraCredit', 'Extra Credit')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_late_submission"
                  checked={formData.allow_late_submission}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_late_submission: !!checked })}
                />
                <Label htmlFor="allow_late_submission" className="font-normal">
                  {t('admin.grading.items.form.allowLateSubmission', 'Allow late submissions')}
                </Label>
              </div>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">{t('admin.grading.items.form.displayOrder', 'Display Order')}</Label>
              <Input
                id="display_order"
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSaveItem} disabled={saving}>
              {saving ? t('common.saving', 'Saving...') : editingItem ? t('common.update', 'Update') : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

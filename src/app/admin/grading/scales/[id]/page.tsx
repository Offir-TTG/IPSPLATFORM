'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Award, Plus, Edit, Trash2, ArrowLeft, Save, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { GradingScale, GradeRange } from '@/types/grading';
import { validateGradeRanges } from '@/lib/grading/gradeCalculator';

export default function GradeRangesPage() {
  const router = useRouter();
  const params = useParams();
  const scaleId = params.id as string;
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';

  const [scale, setScale] = useState<GradingScale | null>(null);
  const [ranges, setRanges] = useState<GradeRange[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<GradeRange | null>(null);
  const [deletingRange, setDeletingRange] = useState<GradeRange | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    grade_label: '',
    min_percentage: 0,
    max_percentage: 100,
    gpa_value: 4.0,
    display_order: 1,
    color_code: '#4CAF50',
    is_passing: true,
  });

  useEffect(() => {
    loadScaleAndRanges();
  }, [scaleId]);

  // Helper function to translate validation errors
  function translateValidationError(error: string): string {
    // Overlap between X and Y
    if (error.includes('Overlap between')) {
      const match = error.match(/Overlap between (.+) and (.+)/);
      if (match) {
        return t('admin.grading.ranges.validation.overlap', 'Overlap between {grade1} and {grade2}')
          .replace('{grade1}', match[1])
          .replace('{grade2}', match[2]);
      }
    }

    // Gap between X (Y%) and Z (W%)
    if (error.includes('Gap between')) {
      const match = error.match(/Gap between (.+) \((.+)%\) and (.+) \((.+)%\)/);
      if (match) {
        return t('admin.grading.ranges.validation.gap', 'Gap between {grade1} ({percent1}%) and {grade2} ({percent2}%)')
          .replace('{grade1}', match[1])
          .replace('{percent1}', match[2])
          .replace('{grade2}', match[3])
          .replace('{percent2}', match[4]);
      }
    }

    // Grade ranges don't cover 0%
    if (error.includes("don't cover 0%")) {
      const match = error.match(/starts at (.+)%/);
      if (match) {
        return t('admin.grading.ranges.validation.notCoverZero', "Grade ranges don't cover 0%. Lowest range starts at {percent}%")
          .replace('{percent}', match[1]);
      }
    }

    // Grade ranges don't cover 100%
    if (error.includes("don't cover 100%")) {
      const match = error.match(/ends at (.+)%/);
      if (match) {
        return t('admin.grading.ranges.validation.notCoverHundred', "Grade ranges don't cover 100%. Highest range ends at {percent}%")
          .replace('{percent}', match[1]);
      }
    }

    return error;
  }

  async function loadScaleAndRanges() {
    try {
      setLoading(true);

      // Load scale details
      const scaleResponse = await fetch(`/api/admin/grading/scales/${scaleId}`);
      if (!scaleResponse.ok) throw new Error('Failed to load scale');

      const scaleData = await scaleResponse.json();
      setScale(scaleData.data);

      // Load grade ranges
      const rangesResponse = await fetch(`/api/admin/grading/scales/${scaleId}/ranges`);
      if (!rangesResponse.ok) throw new Error('Failed to load ranges');

      const rangesData = await rangesResponse.json();
      const loadedRanges = rangesData.data || [];
      setRanges(loadedRanges);

      // Validate grade ranges
      if (loadedRanges.length > 0) {
        const validation = validateGradeRanges(loadedRanges);
        setValidationErrors(validation.errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.ranges.error.loadData', 'Failed to load data'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateDialog() {
    const nextOrder = ranges.length > 0 ? Math.max(...ranges.map(r => r.display_order)) + 1 : 1;
    setFormData({
      grade_label: '',
      min_percentage: 0,
      max_percentage: 100,
      gpa_value: 4.0,
      display_order: nextOrder,
      color_code: '#4CAF50',
      is_passing: true,
    });
    setEditingRange(null);
    setCreateDialogOpen(true);
  }

  function handleOpenEditDialog(range: GradeRange) {
    setFormData({
      grade_label: range.grade_label,
      min_percentage: range.min_percentage,
      max_percentage: range.max_percentage,
      gpa_value: range.gpa_value || 0,
      display_order: range.display_order,
      color_code: range.color_code || '#4CAF50',
      is_passing: range.is_passing,
    });
    setEditingRange(range);
    setCreateDialogOpen(true);
  }

  async function handleSaveRange() {
    if (!formData.grade_label.trim()) {
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.ranges.validation.labelRequired', 'Please enter a grade label'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.min_percentage > formData.max_percentage) {
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.ranges.validation.invalidRange', 'Minimum percentage cannot be greater than maximum percentage'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingRange) {
        // Update existing range
        const response = await fetch(`/api/admin/grading/scales/${scaleId}/ranges/${editingRange.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update grade range');
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('admin.grading.ranges.success.updated', 'Grade range updated successfully'),
        });
      } else {
        // Create new range
        const response = await fetch(`/api/admin/grading/scales/${scaleId}/ranges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create grade range');
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('admin.grading.ranges.success.created', 'Grade range created successfully'),
        });
      }

      setCreateDialogOpen(false);
      loadScaleAndRanges();
    } catch (error: any) {
      console.error('Error saving grade range:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.grading.ranges.error.save', 'Failed to save grade range'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleOpenDeleteDialog(range: GradeRange) {
    setDeletingRange(range);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deletingRange) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/grading/scales/${scaleId}/ranges/${deletingRange.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete grade range');
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.grading.ranges.success.deleted', 'Grade range deleted successfully'),
      });

      setDeleteDialogOpen(false);
      setDeletingRange(null);
      loadScaleAndRanges();
    } catch (error: any) {
      console.error('Error deleting grade range:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.grading.ranges.error.delete', 'Failed to delete grade range'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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

  if (!scale) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <p suppressHydrationWarning>{t('admin.grading.ranges.notFound.scale', 'Scale not found')}</p>
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
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/grading/scales')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Award className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{scale.name}</h1>
              <p className="text-muted-foreground" suppressHydrationWarning>
                {t('admin.grading.ranges.subtitle', 'Manage grade ranges for this scale')}
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span suppressHydrationWarning>{t('admin.grading.ranges.add', 'Add Grade Range')}</span>
          </Button>
        </div>

        {/* Scale Info */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('admin.grading.ranges.scaleInfo', 'Scale Information')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('admin.grading.ranges.type', 'Type')}</p>
                <Badge variant="secondary" className="mt-1" suppressHydrationWarning>
                  {t(`admin.grading.scales.scaleType.${scale.scale_type}`, scale.scale_type)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('admin.grading.ranges.status', 'Status')}</p>
                <Badge variant={scale.is_active ? "default" : "secondary"} className="mt-1" suppressHydrationWarning>
                  {scale.is_active ? t('admin.grading.scales.active', 'Active') : t('admin.grading.scales.inactive', 'Inactive')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('admin.grading.ranges.default', 'Default')}</p>
                <Badge variant={scale.is_default ? "default" : "outline"} className="mt-1" suppressHydrationWarning>
                  {scale.is_default ? t('admin.grading.ranges.yes', 'Yes') : t('admin.grading.ranges.no', 'No')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('admin.grading.ranges.gradeRanges', 'Grade Ranges')}</p>
                <p className="mt-1 font-semibold">{ranges.length}</p>
              </div>
            </div>
            {scale.description && (
              <p className="mt-4 text-sm text-muted-foreground">{scale.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Validation Warnings */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2" suppressHydrationWarning>
                {t('admin.grading.ranges.validation.title', 'Grade ranges validation issues')}:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{translateValidationError(error)}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Grade Ranges */}
        {ranges.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>
                {t('admin.grading.ranges.empty.title', 'No Grade Ranges')}
              </h3>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning>
                {t('admin.grading.ranges.empty.description', 'Add grade ranges to define how percentages are converted to grades')}
              </p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('admin.grading.ranges.empty.addFirst', 'Add First Grade Range')}</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle suppressHydrationWarning>
                {t('admin.grading.ranges.gradeRanges', 'Grade Ranges')} ({ranges.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {ranges
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((range) => (
                    <div
                      key={range.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      style={{ borderLeftWidth: '4px', borderLeftColor: range.color_code || 'hsl(var(--border))' }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-16 h-16 rounded-lg" style={{ backgroundColor: range.color_code + '20' }}>
                          <span className="text-2xl font-bold" style={{ color: range.color_code }}>{range.grade_label}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{range.grade_label}</span>
                            {!range.is_passing && (
                              <Badge variant="destructive" className="text-xs" suppressHydrationWarning>
                                {t('admin.grading.ranges.failing', 'Failing')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span suppressHydrationWarning>
                              {t('admin.grading.ranges.range', 'Range')}: {range.min_percentage.toFixed(2)}% - {range.max_percentage.toFixed(2)}%
                            </span>
                            {range.gpa_value !== null && (
                              <span suppressHydrationWarning>
                                {t('admin.grading.ranges.gpa', 'GPA')}: {range.gpa_value.toFixed(2)}
                              </span>
                            )}
                            <span suppressHydrationWarning>
                              {t('admin.grading.ranges.order', 'Order')}: {range.display_order}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(range)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDeleteDialog(range)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2" suppressHydrationWarning>
              {t('admin.grading.ranges.info.title', 'About Grade Ranges')}
            </h3>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('admin.grading.ranges.info.description', 'Grade ranges define how percentage scores are converted to letter grades. Each range specifies:')}
            </p>
            <ul className={`text-sm text-muted-foreground mt-2 space-y-1 ${isRtl ? 'list-disc list-inside' : 'list-disc list-inside'}`}>
              <li suppressHydrationWarning>{t('admin.grading.ranges.info.label', 'A grade label (e.g., "A", "B+", "Pass")')}</li>
              <li suppressHydrationWarning>{t('admin.grading.ranges.info.percentage', 'A percentage range (e.g., 90-100 for an A)')}</li>
              <li suppressHydrationWarning>{t('admin.grading.ranges.info.gpaValue', 'An optional GPA value for transcript calculations')}</li>
              <li suppressHydrationWarning>{t('admin.grading.ranges.info.color', 'A color for visual display in the UI')}</li>
              <li suppressHydrationWarning>{t('admin.grading.ranges.info.passing', 'Whether the grade is passing or failing')}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir={direction}>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>
              {editingRange
                ? t('admin.grading.ranges.dialog.edit', 'Edit Grade Range')
                : t('admin.grading.ranges.dialog.add', 'Add Grade Range')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {editingRange
                ? t('admin.grading.ranges.dialog.editDescription', 'Update the grade range details')
                : t('admin.grading.ranges.dialog.addDescription', 'Create a new grade range for this scale')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Grade Label */}
            <div className="space-y-2">
              <Label htmlFor="grade_label" suppressHydrationWarning>
                {t('admin.grading.ranges.form.gradeLabel', 'Grade Label')} *
              </Label>
              <Input
                id="grade_label"
                placeholder={t('admin.grading.ranges.form.gradeLabelPlaceholder', 'e.g., A, B+, Pass')}
                value={formData.grade_label}
                onChange={(e) => setFormData({ ...formData, grade_label: e.target.value })}
              />
            </div>

            {/* Percentage Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_percentage" suppressHydrationWarning>
                  {t('admin.grading.ranges.form.minPercentage', 'Min %')} *
                </Label>
                <Input
                  id="min_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.min_percentage}
                  onChange={(e) => setFormData({ ...formData, min_percentage: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_percentage" suppressHydrationWarning>
                  {t('admin.grading.ranges.form.maxPercentage', 'Max %')} *
                </Label>
                <Input
                  id="max_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.max_percentage}
                  onChange={(e) => setFormData({ ...formData, max_percentage: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* GPA Value */}
            <div className="space-y-2">
              <Label htmlFor="gpa_value" suppressHydrationWarning>
                {t('admin.grading.ranges.form.gpaValue', 'GPA Value (optional)')}
              </Label>
              <Input
                id="gpa_value"
                type="number"
                min="0"
                max="4"
                step="0.1"
                value={formData.gpa_value}
                onChange={(e) => setFormData({ ...formData, gpa_value: parseFloat(e.target.value) })}
              />
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order" suppressHydrationWarning>
                {t('admin.grading.ranges.form.displayOrder', 'Display Order')} *
              </Label>
              <Input
                id="display_order"
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color_code" suppressHydrationWarning>
                {t('admin.grading.ranges.form.color', 'Color')}
              </Label>
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
                  placeholder="#4CAF50"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Is Passing */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_passing" className="cursor-pointer" suppressHydrationWarning>
                {t('admin.grading.ranges.form.passingGrade', 'Passing Grade')}
              </Label>
              <Switch
                id="is_passing"
                checked={formData.is_passing}
                onCheckedChange={(checked) => setFormData({ ...formData, is_passing: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              <X className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button onClick={handleSaveRange} disabled={saving}>
              {saving ? (
                <span suppressHydrationWarning>{t('common.saving', 'Saving...')}</span>
              ) : (
                <>
                  <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span suppressHydrationWarning>
                    {editingRange ? t('common.update', 'Update') : t('common.create', 'Create')}
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent dir={direction}>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>
              {t('admin.grading.ranges.delete.title', 'Delete Grade Range')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {t('admin.grading.ranges.delete.description', 'Are you sure you want to delete this grade range? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          {deletingRange && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {t('admin.grading.ranges.delete.confirmRange', 'Range')}: <strong>{deletingRange.grade_label}</strong> ({deletingRange.min_percentage}% - {deletingRange.max_percentage}%)
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={saving} suppressHydrationWarning>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={saving} suppressHydrationWarning>
              {saving ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

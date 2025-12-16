'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Award, Plus, Edit, Trash2, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { GradingScale, ScaleType } from '@/types/grading';

export default function GradingScalesPage() {
  const router = useRouter();
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<GradingScale | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scaleToDelete, setScaleToDelete] = useState<GradingScale | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scale_type: 'letter' as ScaleType,
    is_default: false,
    is_active: true,
  });

  useEffect(() => {
    loadScales();
  }, []);

  async function loadScales() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/grading/scales');

      if (!response.ok) {
        throw new Error('Failed to load grading scales');
      }

      const data = await response.json();
      setScales(data.data || []);
    } catch (error) {
      console.error('Error loading grading scales:', error);
      toast({
        title: 'Error',
        description: 'Failed to load grading scales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateDialog() {
    setFormData({
      name: '',
      description: '',
      scale_type: 'letter',
      is_default: scales.length === 0, // Make first scale default
      is_active: true,
    });
    setEditingScale(null);
    setCreateDialogOpen(true);
  }

  function handleOpenEditDialog(scale: GradingScale) {
    setFormData({
      name: scale.name,
      description: scale.description || '',
      scale_type: scale.scale_type,
      is_default: scale.is_default,
      is_active: scale.is_active,
    });
    setEditingScale(scale);
    setCreateDialogOpen(true);
  }

  async function handleSaveScale() {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the grading scale',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingScale) {
        // Update existing scale
        const response = await fetch(`/api/admin/grading/scales/${editingScale.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update grading scale');
        }

        toast({
          title: 'Success',
          description: 'Grading scale updated successfully',
        });
      } else {
        // Create new scale
        const response = await fetch('/api/admin/grading/scales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create grading scale');
        }

        toast({
          title: 'Success',
          description: 'Grading scale created successfully',
        });
      }

      setCreateDialogOpen(false);
      loadScales(); // Reload the list
    } catch (error: any) {
      console.error('Error saving grading scale:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingScale ? 'update' : 'create'} grading scale`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleOpenDeleteDialog(scale: GradingScale) {
    setScaleToDelete(scale);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteScale() {
    if (!scaleToDelete) return;

    try {
      setDeleting(true);

      const response = await fetch(`/api/admin/grading/scales/${scaleToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete grading scale');
      }

      toast({
        title: 'Success',
        description: 'Grading scale deleted successfully',
      });

      setDeleteDialogOpen(false);
      setScaleToDelete(null);
      loadScales(); // Reload the list
    } catch (error: any) {
      console.error('Error deleting grading scale:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete grading scale',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
                {t('admin.grading.scales.title', 'Grading Scales')}
              </h1>
              <p className="text-muted-foreground" suppressHydrationWarning>
                {t('admin.grading.scales.subtitle', 'Manage grading scales and grade ranges for courses')}
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            <span suppressHydrationWarning>{t('admin.grading.scales.create', 'Create Scale')}</span>
          </Button>
        </div>

        {/* Scales List */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p suppressHydrationWarning>{t('common.loading', 'Loading...')}</p>
            </CardContent>
          </Card>
        ) : scales.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>
                {t('admin.grading.scales.empty.title', 'No Grading Scales')}
              </h3>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning>
                {t('admin.grading.scales.empty.description', 'Create your first grading scale to get started')}
              </p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>{t('admin.grading.scales.create', 'Create Scale')}</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scales.map((scale) => (
              <Card key={scale.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => router.push(`/admin/grading/scales/${scale.id}`)}
                    >
                      <CardTitle className="text-xl">{scale.name}</CardTitle>
                      <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        {scale.is_default && (
                          <Badge variant="default" suppressHydrationWarning>
                            {t('admin.grading.scales.default', 'Default')}
                          </Badge>
                        )}
                        {scale.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                            <span suppressHydrationWarning>{t('admin.grading.scales.active', 'Active')}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-600">
                            <XCircle className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                            <span suppressHydrationWarning>{t('admin.grading.scales.inactive', 'Inactive')}</span>
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {scale.scale_type}
                        </Badge>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground ${isRtl ? 'rotate-180' : ''}`} />
                    </div>
                    <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDialog(scale);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={scale.is_default}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteDialog(scale);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {scale.description && (
                    <p className={`text-sm text-muted-foreground mt-2 ${isRtl ? 'text-right' : ''}`}>{scale.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {scale.grade_ranges && scale.grade_ranges.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium mb-3" suppressHydrationWarning>
                        {t('admin.grading.scales.ranges', 'Grade Ranges')} ({scale.grade_ranges.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {scale.grade_ranges
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((range) => (
                            <div
                              key={range.id}
                              className="flex flex-col p-3 border rounded-lg"
                              style={{ borderColor: range.color_code || 'hsl(var(--border))' }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-lg">{range.grade_label}</span>
                                {range.gpa_value !== null && (
                                  <span className="text-xs text-muted-foreground">{range.gpa_value.toFixed(2)}</span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {range.min_percentage.toFixed(2)}%-{range.max_percentage.toFixed(2)}%
                              </span>
                              {!range.is_passing && (
                                <Badge variant="destructive" className="mt-1 text-xs" suppressHydrationWarning>
                                  {t('admin.grading.scales.failing', 'Failing')}
                                </Badge>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('admin.grading.scales.noRanges', 'No grade ranges defined')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2" suppressHydrationWarning>
              {t('admin.grading.scales.info.title', 'About Grading Scales')}
            </h3>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t(
                'admin.grading.scales.info.description',
                'Grading scales define how percentages are converted to letter grades. You can create multiple scales for different course types (e.g., Letter Grades A-F, Pass/Fail, Numeric 0-100). Set one scale as default to automatically apply it to new courses.'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Scale Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>
              {editingScale
                ? t('admin.grading.scales.edit', 'Edit Scale')
                : t('admin.grading.scales.create', 'Create Scale')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {editingScale
                ? t('admin.grading.scales.editDescription', 'Update the grading scale details')
                : t('admin.grading.scales.createDescription', 'Create a new grading scale for your courses')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" suppressHydrationWarning>
                {t('admin.grading.scales.form.name', 'Name')} *
              </Label>
              <Input
                id="name"
                placeholder={t('admin.grading.scales.form.namePlaceholder', 'e.g., Standard Letter Grade (A-F)')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" suppressHydrationWarning>
                {t('admin.grading.scales.form.description', 'Description')}
              </Label>
              <Textarea
                id="description"
                placeholder={t('admin.grading.scales.form.descriptionPlaceholder', 'Optional description...')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Scale Type */}
            <div className="space-y-2">
              <Label htmlFor="scale_type" suppressHydrationWarning>
                {t('admin.grading.scales.form.type', 'Scale Type')} *
              </Label>
              <Select
                value={formData.scale_type}
                onValueChange={(value: ScaleType) => setFormData({ ...formData, scale_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="letter">
                    <span suppressHydrationWarning>{t('admin.grading.scales.types.letter', 'Letter Grade (A-F)')}</span>
                  </SelectItem>
                  <SelectItem value="numeric">
                    <span suppressHydrationWarning>{t('admin.grading.scales.types.numeric', 'Numeric (0-100)')}</span>
                  </SelectItem>
                  <SelectItem value="passfail">
                    <span suppressHydrationWarning>{t('admin.grading.scales.types.passfail', 'Pass/Fail')}</span>
                  </SelectItem>
                  <SelectItem value="custom">
                    <span suppressHydrationWarning>{t('admin.grading.scales.types.custom', 'Custom')}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_default" className="cursor-pointer" suppressHydrationWarning>
                {t('admin.grading.scales.form.default', 'Set as Default')}
              </Label>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>

            {/* Active */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active" className="cursor-pointer" suppressHydrationWarning>
                {t('admin.grading.scales.form.active', 'Active')}
              </Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button onClick={handleSaveScale} disabled={saving}>
              {saving ? (
                <span suppressHydrationWarning>{t('common.saving', 'Saving...')}</span>
              ) : (
                <span suppressHydrationWarning>
                  {editingScale ? t('common.update', 'Update') : t('common.create', 'Create')}
                </span>
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
              {t('admin.grading.scales.delete.title', 'Delete Grading Scale')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {t(
                'admin.grading.scales.delete.description',
                'Are you sure you want to delete this grading scale? This action cannot be undone.'
              )}
            </DialogDescription>
          </DialogHeader>

          {scaleToDelete && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">{scaleToDelete.name}</p>
                {scaleToDelete.description && (
                  <p className="text-sm text-muted-foreground mt-1">{scaleToDelete.description}</p>
                )}
                {scaleToDelete.grade_ranges && scaleToDelete.grade_ranges.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2" suppressHydrationWarning>
                    {t('admin.grading.scales.delete.rangesWarning', 'This will also delete {count} grade ranges', {
                      count: scaleToDelete.grade_ranges.length.toString(),
                    }).replace('{count}', scaleToDelete.grade_ranges.length.toString())}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button variant="destructive" onClick={handleDeleteScale} disabled={deleting}>
              {deleting ? (
                <span suppressHydrationWarning>{t('common.deleting', 'Deleting...')}</span>
              ) : (
                <span suppressHydrationWarning>{t('common.delete', 'Delete')}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

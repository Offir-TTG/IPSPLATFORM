'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users, BookOpen, DollarSign, Search, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { CURRENCIES } from '@/lib/utils/currency';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface Program {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  price: number | null;
  currency: string | null;
  duration_weeks: number | null;
  max_students: number | null;
  docusign_template_id: string | null;
  created_at: string;
  updated_at: string;
  course_count?: number;
  student_count?: number;
}

export default function ProgramsPage() {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Helper function to strip HTML tags for search
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    price: '',
    currency: 'USD',
    duration_weeks: '',
    max_students: '',
    docusign_template_id: ''
  });

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      const result = await response.json();

      if (result.success) {
        setPrograms(result.data || []);
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || t('lms.programs.load_error', 'Failed to load programs'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.programs.load_error', 'Failed to load programs'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      price: '',
      currency: 'USD',
      duration_weeks: '',
      max_students: '',
      docusign_template_id: ''
    });
    setShowCreateDialog(true);
  };

  const handleEdit = (program: Program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      description: program.description || '',
      is_active: program.is_active,
      price: program.price?.toString() || '',
      currency: program.currency || 'USD',
      duration_weeks: program.duration_weeks?.toString() || '',
      max_students: program.max_students?.toString() || '',
      docusign_template_id: program.docusign_template_id || ''
    });
    setShowEditDialog(true);
  };

  const handleDelete = (program: Program) => {
    setSelectedProgram(program);
    setShowDeleteDialog(true);
  };

  const handleSaveCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.programs.name_required', 'Program name is required'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          duration_weeks: formData.duration_weeks ? parseInt(formData.duration_weeks) : null,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('lms.programs.created', 'Program created successfully'),
        });
        setShowCreateDialog(false);
        loadPrograms();
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || t('lms.programs.create_error', 'Failed to create program'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create program:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.programs.create_error', 'Failed to create program'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedProgram) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/programs/${selectedProgram.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          duration_weeks: formData.duration_weeks ? parseInt(formData.duration_weeks) : null,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('lms.programs.updated', 'Program updated successfully'),
        });
        setShowEditDialog(false);
        loadPrograms();
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || t('lms.programs.update_error', 'Failed to update program'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update program:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.programs.update_error', 'Failed to update program'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProgram) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/programs/${selectedProgram.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('lms.programs.deleted', 'Program deleted successfully'),
        });
        setShowDeleteDialog(false);
        loadPrograms();
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || t('lms.programs.delete_error', 'Failed to delete program'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete program:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.programs.delete_error', 'Failed to delete program'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (program.description && stripHtml(program.description).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t('lms.programs.title', 'Programs')}
          </h1>
          <p className="text-muted-foreground">
            {t('lms.programs.subtitle', 'Manage your learning programs')}
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`} />
            <Input
              placeholder={t('lms.programs.search_placeholder', 'Search programs...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isRtl ? 'pr-10' : 'pl-10'}
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('lms.programs.create', 'Create Program')}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('lms.programs.loading', 'Loading programs...')}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? t('lms.programs.no_results', 'No programs found matching your search')
                  : t('lms.programs.no_programs', 'No programs created yet')}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreate}>
                  <Plus className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('lms.programs.create_first', 'Create Your First Program')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{program.name}</CardTitle>
                      {program.description && (
                        <CardDescription
                          className="mt-2 prose prose-sm max-w-none line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: program.description }}
                        />
                      )}
                    </div>
                    <Badge variant={program.is_active ? 'default' : 'secondary'}>
                      {program.is_active
                        ? t('lms.programs.active', 'Active')
                        : t('lms.programs.inactive', 'Inactive')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {program.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {program.currency} {program.price}
                        </span>
                      </div>
                    )}

                    {program.duration_weeks && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {program.duration_weeks} {t('lms.programs.weeks', 'weeks')}
                        </span>
                      </div>
                    )}

                    {program.max_students && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {t('lms.programs.max_students_label', 'Max')}: {program.max_students} {t('lms.programs.students', 'students')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {program.course_count || 0} {t('lms.programs.courses', 'courses')}
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {program.student_count || 0} {t('lms.programs.students', 'students')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(program)}
                    >
                      <Edit2 className={`${isRtl ? 'ml-2' : 'mr-2'} h-3 w-3`} />
                      {t('common.edit', 'Edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(program)}
                    >
                      <Trash2 className={`${isRtl ? 'ml-2' : 'mr-2'} h-3 w-3`} />
                      {t('common.delete', 'Delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          // Only allow closing via the cancel/close buttons, not outside click
          if (!open && !saving) {
            // Dialog is trying to close - we'll control this manually
          }
        }}>
          <DialogContent
            className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
            dir={direction}
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.create_dialog_title', 'Create New Program')}
              </DialogTitle>
              <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.create_dialog_description', 'Enter the details for the new program.')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.name', 'Program Name')} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('lms.programs.name_placeholder', 'e.g., Full Stack Development')}
                  dir={direction}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.description', 'Description')}
                </Label>
                <RichTextEditor
                  content={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  placeholder={t('lms.programs.description_placeholder', 'Program description...')}
                  dir={direction}
                  minHeight="120px"
                />
              </div>
              <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price" className={isRtl ? 'text-right' : 'text-left'}>
                    {t('lms.programs.price', 'Price')}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency" className={isRtl ? 'text-right' : 'text-left'}>
                    {t('lms.programs.currency', 'Currency')}
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    dir={direction}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder={t('lms.programs.select_currency', 'Select currency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.filter(c => c.is_active).map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{currency.code}</span>
                            <span className="text-muted-foreground">({currency.symbol})</span>
                            <span className="text-sm text-muted-foreground hidden sm:inline">{currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration" className={isRtl ? 'text-right' : 'text-left'}>
                    {t('lms.programs.duration', 'Duration (weeks)')}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: e.target.value })}
                    placeholder="12"
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_students" className={isRtl ? 'text-right' : 'text-left'}>
                    {t('lms.programs.max_students', 'Max Students')}
                  </Label>
                  <Input
                    id="max_students"
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                    placeholder="30"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="docusign" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.docusign_template', 'DocuSign Template ID')}
                </Label>
                <Input
                  id="docusign"
                  value={formData.docusign_template_id}
                  onChange={(e) => setFormData({ ...formData, docusign_template_id: e.target.value })}
                  placeholder={t('lms.programs.docusign_placeholder', 'Optional')}
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2">
                {isRtl ? (
                  <>
                    <Label
                      htmlFor="active"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {t('lms.programs.activate_immediately', 'Activate immediately')}
                    </Label>
                    <div dir="ltr">
                      <Switch
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div dir="ltr">
                      <Switch
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                    <Label
                      htmlFor="active"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {t('lms.programs.activate_immediately', 'Activate immediately')}
                    </Label>
                  </>
                )}
              </div>
            </div>
            <div className={`flex gap-3 mt-6 pt-6 border-t ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <X className="h-4 w-4" />
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSaveCreate}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.creating', 'Creating...')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {t('common.create', 'Create')}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => {
          // Only allow closing via the cancel/close buttons, not outside click
          if (!open && !saving) {
            // Dialog is trying to close - we'll control this manually
          }
        }}>
          <DialogContent
            className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
            dir={direction}
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.edit_dialog_title', 'Edit Program')}
              </DialogTitle>
              <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.edit_dialog_description', 'Update the program details.')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.name', 'Program Name')} *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  dir={direction}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.description', 'Description')}
                </Label>
                <RichTextEditor
                  content={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  placeholder={t('lms.programs.description_placeholder', 'Program description...')}
                  dir={direction}
                  minHeight="120px"
                />
              </div>
              <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price" className={isRtl ? 'text-right' : 'text-left'}>
                    {t('lms.programs.price', 'Price')}
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-currency" className={isRtl ? 'text-right' : 'text-left'}>
                    {t('lms.programs.currency', 'Currency')}
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    dir={direction}
                  >
                    <SelectTrigger id="edit-currency">
                      <SelectValue placeholder={t('lms.programs.select_currency', 'Select currency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.filter(c => c.is_active).map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{currency.code}</span>
                            <span className="text-muted-foreground">({currency.symbol})</span>
                            <span className="text-sm text-muted-foreground hidden sm:inline">{currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration" className={isRtl ? 'text-right' : 'text-left'}>
                    {t('lms.programs.duration', 'Duration (weeks)')}
                  </Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-max_students" className={isRtl ? 'text-right' : 'text-left'}>
                    {t('lms.programs.max_students', 'Max Students')}
                  </Label>
                  <Input
                    id="edit-max_students"
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-docusign" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.docusign_template', 'DocuSign Template ID')}
                </Label>
                <Input
                  id="edit-docusign"
                  value={formData.docusign_template_id}
                  onChange={(e) => setFormData({ ...formData, docusign_template_id: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2">
                {isRtl ? (
                  <>
                    <Label
                      htmlFor="edit-active"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {t('lms.programs.is_active', 'Active')}
                    </Label>
                    <div dir="ltr">
                      <Switch
                        id="edit-active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div dir="ltr">
                      <Switch
                        id="edit-active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                    <Label
                      htmlFor="edit-active"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {t('lms.programs.is_active', 'Active')}
                    </Label>
                  </>
                )}
              </div>
            </div>
            <div className={`flex gap-3 mt-6 pt-6 border-t ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <X className="h-4 w-4" />
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {t('common.save', 'Save')}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
          // Only allow closing via the cancel/confirm buttons, not outside click
          if (!open && !deleting) {
            // Dialog is trying to close - we'll control this manually
          }
        }}>
          <AlertDialogContent
            dir={direction}
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className="max-w-[90vw] sm:max-w-[500px]">
            <AlertDialogHeader>
              <AlertDialogTitle className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.delete_dialog_title', 'Delete Program')}
              </AlertDialogTitle>
              <AlertDialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                {t(
                  'lms.programs.delete_dialog_description',
                  'Are you sure you want to delete this program? This will also delete all associated courses, modules, lessons, and student data. This action cannot be undone.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className={`flex gap-3 mt-6 pt-6 border-t ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <X className="h-4 w-4" />
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.deleting', 'Deleting...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {t('common.delete', 'Delete')}
                  </>
                )}
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
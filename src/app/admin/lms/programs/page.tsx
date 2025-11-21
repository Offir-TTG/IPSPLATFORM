'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Users, BookOpen, DollarSign, Search, X, XCircle, Check, Loader2, Upload, ImageIcon, Eye, LayoutGrid, List } from 'lucide-react';
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
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { CURRENCIES } from '@/lib/utils/currency';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
// Image upload will be handled through API endpoints for proper authentication

interface Program {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
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
  const router = useRouter();
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Responsive breakpoints
  const isMobile = windowWidth <= 640;

  // Helper function to strip HTML tags for search
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    is_active: true,
    price: '',
    currency: 'USD',
    duration_weeks: '',
    max_students: '',
    docusign_template_id: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Error states for inline display
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [docusignTemplates, setDocusignTemplates] = useState<Array<{ templateId: string; name: string }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadPrograms();
    loadDocuSignTemplates();
  }, [statusFilter]);

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

  const loadDocuSignTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await fetch('/api/admin/docusign/templates');
      const result = await response.json();

      console.log('DocuSign templates response:', result);

      if (result.success) {
        setDocusignTemplates(result.templates || []);
      } else {
        console.warn('DocuSign not configured or failed:', result.message || result.error);
        setDocusignTemplates([]);
      }
    } catch (error) {
      console.error('Failed to load DocuSign templates:', error);
      // Silent fail - DocuSign might not be configured
      setDocusignTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Upload image through server-side API for proper authentication
  const uploadProgramImage = async (file: File, programId?: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (programId) {
        formData.append('programId', programId);
      }

      const response = await fetch('/api/programs/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return result.url;
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Delete image through server-side API
  const deleteProgramImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/programs/upload-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      is_active: true,
      price: '',
      currency: 'USD',
      duration_weeks: '',
      max_students: '',
      docusign_template_id: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setCreateError(null);
    setValidationErrors({});
    setShowCreateDialog(true);
  };

  const handleEdit = (program: Program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      description: program.description || '',
      image_url: program.image_url || '',
      is_active: program.is_active,
      price: program.price?.toString() || '',
      currency: program.currency || 'USD',
      duration_weeks: program.duration_weeks?.toString() || '',
      max_students: program.max_students?.toString() || '',
      docusign_template_id: program.docusign_template_id || ''
    });
    setImagePreview(program.image_url);
    setImageFile(null);
    setEditError(null);
    setValidationErrors({});
    setShowEditDialog(true);
  };

  const handleDelete = (program: Program) => {
    setSelectedProgram(program);
    setShowDeleteDialog(true);
  };

  const handleSaveCreate = async () => {
    console.log('handleSaveCreate called', formData);

    // Reset errors
    setCreateError(null);
    setValidationErrors({});

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errors.name = t('lms.programs.error.name_required', 'Program name is required');
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setCreateError(t('common.required_fields', 'Please fill in all required fields correctly'));
      return;
    }

    setSaving(true);
    try {
      let uploadedImageUrl = null;

      // Upload image if there's a new file
      if (imageFile) {
        try {
          uploadedImageUrl = await uploadProgramImage(imageFile);
          if (!uploadedImageUrl) {
            console.error('Image upload returned null');
            toast({
              title: t('common.error', 'Error'),
              description: t('lms.programs.image_upload_error', 'Failed to upload image'),
              variant: 'destructive',
            });
            // Continue without image
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Failed to upload image';
          toast({
            title: t('common.error', 'Error'),
            description: errorMessage,
            variant: 'destructive',
          });
          // Continue without image - don't block program creation
        }
      }

      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image_url: uploadedImageUrl || formData.image_url || null,
          price: formData.price ? parseFloat(formData.price) : null,
          duration_weeks: formData.duration_weeks ? parseInt(formData.duration_weeks) : null,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
        }),
      });

      const result = await response.json();
      console.log('Create response:', result);

      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('lms.programs.created', 'Program created successfully'),
        });
        setShowCreateDialog(false);
        setCreateError(null);
        setValidationErrors({});
        loadPrograms();
        // Reset form
        setFormData({
          name: '',
          description: '',
          image_url: '',
          is_active: true,
          price: '',
          currency: 'USD',
          duration_weeks: '',
          max_students: '',
          docusign_template_id: ''
        });
        setImageFile(null);
        setImagePreview(null);
      } else {
        console.error('Create failed:', result.error);
        const errorMessage = result.error || t('lms.programs.create_error', 'Failed to create program');
        setCreateError(errorMessage);
        toast({
          title: t('common.error', 'Error'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create program:', error);
      const errorMessage = error instanceof Error ? error.message : t('lms.programs.create_error', 'Failed to create program');
      setCreateError(errorMessage);
      toast({
        title: t('common.error', 'Error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    console.log('handleSaveEdit called', formData);
    if (!selectedProgram) {
      setEditError(t('common.error', 'Program not found'));
      return;
    }

    // Reset errors
    setEditError(null);
    setValidationErrors({});

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errors.name = t('lms.programs.error.name_required', 'Program name is required');
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setEditError(t('common.required_fields', 'Please fill in all required fields correctly'));
      return;
    }

    setSaving(true);
    try {
      let uploadedImageUrl: string | null | undefined = formData.image_url;

      // Upload new image if there's a file
      if (imageFile) {
        try {
          // Delete old image if it exists
          if (selectedProgram.image_url) {
            try {
              await deleteProgramImage(selectedProgram.image_url);
            } catch (deleteError) {
              console.error('Failed to delete old image:', deleteError);
              // Continue anyway - old image might not exist
            }
          }

          uploadedImageUrl = await uploadProgramImage(imageFile, selectedProgram.id);
          if (!uploadedImageUrl) {
            console.error('Image upload returned null');
            toast({
              title: t('common.error', 'Error'),
              description: t('lms.programs.image_upload_error', 'Failed to upload image'),
              variant: 'destructive',
            });
            // Continue with old image URL
            uploadedImageUrl = formData.image_url;
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Failed to upload image';
          toast({
            title: t('common.error', 'Error'),
            description: errorMessage,
            variant: 'destructive',
          });
          // Continue with old image URL
          uploadedImageUrl = formData.image_url;
        }
      }

      const response = await fetch(`/api/programs/${selectedProgram.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image_url: uploadedImageUrl || null,
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
        setEditError(null);
        setValidationErrors({});
        loadPrograms();
      } else {
        const errorMessage = result.error || t('lms.programs.update_error', 'Failed to update program');
        setEditError(errorMessage);
        toast({
          title: t('common.error', 'Error'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update program:', error);
      const errorMessage = error instanceof Error ? error.message : t('lms.programs.update_error', 'Failed to update program');
      setEditError(errorMessage);
      toast({
        title: t('common.error', 'Error'),
        description: errorMessage,
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

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.description && stripHtml(program.description).toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && program.is_active) ||
      (statusFilter === 'inactive' && !program.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t('lms.programs.title', 'Programs')}
          </h1>
          <p className="text-muted-foreground">
            {t('lms.programs.subtitle', 'Manage your learning programs')}
          </p>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`} />
                <Input
                  placeholder={t('lms.programs.search_placeholder', 'Search programs...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={isRtl ? 'pr-10' : 'pl-10'}
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)} dir={direction}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('lms.programs.filter_status', 'Filter by status')} />
                </SelectTrigger>
                <SelectContent dir={direction}>
                  <SelectItem value="all">{t('lms.programs.all_statuses', 'All')}</SelectItem>
                  <SelectItem value="active">{t('lms.programs.active', 'Active')}</SelectItem>
                  <SelectItem value="inactive">{t('lms.programs.inactive', 'Inactive')}</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                gap: 0,
                borderRadius: 'calc(var(--radius) * 1.5)',
                backgroundColor: 'hsl(var(--muted))',
                padding: '0.25rem',
                minWidth: isMobile ? '100%' : 'auto'
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    borderRadius: 'calc(var(--radius) * 1)',
                    backgroundColor: viewMode === 'grid' ? 'hsl(var(--primary))' : 'transparent',
                    color: viewMode === 'grid' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center'
                  }}
                  title={t('lms.programs.view_grid', 'Grid View')}
                >
                  <LayoutGrid className="w-4 h-4" />
                  {isMobile && <span>{t('lms.programs.view_grid', 'Grid')}</span>}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    borderRadius: 'calc(var(--radius) * 1)',
                    backgroundColor: viewMode === 'list' ? 'hsl(var(--primary))' : 'transparent',
                    color: viewMode === 'list' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center'
                  }}
                  title={t('lms.programs.view_list', 'List View')}
                >
                  <List className="w-4 h-4" />
                  {isMobile && <span>{t('lms.programs.view_list', 'List')}</span>}
                </button>
              </div>

              {/* Create Button */}
              <Button onClick={handleCreate} className="w-full sm:w-auto">
                <Plus className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {t('lms.programs.create', 'Create Program')}
              </Button>
            </div>
          </CardContent>
        </Card>

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
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="relative overflow-hidden">
                {program.image_url && (
                  <div className="h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={program.image_url}
                      alt={program.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!program.image_url && (
                  <div className="h-48 w-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{program.name}</CardTitle>
                      {program.description && stripHtml(program.description).trim() !== '' && (
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

                  <div className="space-y-2 mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/admin/lms/programs/${program.id}`)}
                    >
                      <Eye className={`${isRtl ? 'ml-2' : 'mr-2'} h-3 w-3`} />
                      {t('lms.programs.manage', 'Manage Program')}
                    </Button>
                    <div className="flex gap-2">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrograms.map((program) => (
              <Card key={program.id}>
                <CardContent className="p-4 sm:p-6">
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '1rem',
                    alignItems: isMobile ? 'stretch' : 'flex-start'
                  }}>
                    {/* Program Info - Left Side */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        marginBottom: '0.5rem'
                      }}>
                        <h3
                          style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'hsl(var(--text-heading))',
                            cursor: 'pointer',
                            margin: 0
                          }}
                          onClick={() => router.push(`/admin/lms/programs/${program.id}`)}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--primary))'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--text-heading))'}
                        >
                          {program.name}
                        </h3>
                        <Badge variant={program.is_active ? 'default' : 'secondary'}>
                          {program.is_active
                            ? t('lms.programs.active', 'Active')
                            : t('lms.programs.inactive', 'Inactive')
                          }
                        </Badge>
                      </div>

                      {program.description && stripHtml(program.description).trim() !== '' && (
                        <div
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'hsl(var(--muted-foreground))',
                            marginBottom: '0.75rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as any,
                            overflow: 'hidden'
                          }}
                          dangerouslySetInnerHTML={{ __html: program.description }}
                        />
                      )}

                      <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        flexWrap: 'wrap',
                        gap: isMobile ? '0.5rem' : '1.5rem',
                        fontSize: 'var(--font-size-sm)',
                        color: 'hsl(var(--muted-foreground))'
                      }}>
                        {program.price && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <DollarSign className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{program.currency} {program.price}</span>
                          </div>
                        )}

                        {program.duration_weeks && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <BookOpen className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{program.duration_weeks} {t('lms.programs.weeks', 'weeks')}</span>
                          </div>
                        )}

                        {program.max_students && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Users className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{t('lms.programs.max_students_label', 'Max')}: {program.max_students}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{program.course_count || 0} {t('lms.programs.courses', 'courses')}</span>
                          <span>•</span>
                          <span>{program.student_count || 0} {t('lms.programs.students', 'students')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Right Side */}
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'row' : 'column',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: '0.5rem',
                      alignItems: 'stretch',
                      minWidth: isMobile ? '100%' : '200px',
                      flexShrink: 0
                    }}>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/admin/lms/programs/${program.id}`)}
                        style={{
                          width: isMobile ? '100%' : 'auto',
                          flex: isMobile ? '1 1 100%' : '0 0 auto'
                        }}
                      >
                        <Eye className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {t('lms.programs.manage', 'Manage Program')}
                      </Button>

                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        width: isMobile ? '100%' : 'auto'
                      }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(program)}
                          style={{
                            flex: 1,
                            minWidth: isMobile ? 'auto' : '100px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Edit2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          {!isMobile && t('common.edit', 'Edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(program)}
                          style={{
                            flex: 1,
                            minWidth: isMobile ? 'auto' : '100px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Trash2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                          {!isMobile && t('common.delete', 'Delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent
            className="sm:max-w-[650px] max-h-[90vh] flex flex-col"
            dir={direction}>
            <DialogHeader>
              <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.create_dialog_title', 'Create New Program')}
              </DialogTitle>
              <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.create_dialog_description', 'Enter the details for the new program.')}
              </DialogDescription>
            </DialogHeader>

            {/* Error Alert */}
            {createError && (
              <Alert variant="destructive" className={isRtl ? 'text-right' : 'text-left'}>
                <XCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
              <div className="grid gap-2">
                <Label htmlFor="name" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.name', 'Program Name')} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: '' });
                    }
                  }}
                  placeholder={t('lms.programs.name_placeholder', 'e.g., Full Stack Development')}
                  dir={direction}
                  className={validationErrors.name ? 'border-destructive' : ''}
                />
                {validationErrors.name && (
                  <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {validationErrors.name}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.image', 'Program Image')}
                </Label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt={t('lms.programs.image_preview', 'Program preview')}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 p-1 h-6 w-6"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          setFormData({ ...formData, image_url: '' });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-create"
                    />
                    <Label
                      htmlFor="image-upload-create"
                      className="cursor-pointer"
                    >
                      <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {t('lms.programs.upload_image', 'Click to upload image')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t('lms.programs.image_formats', 'PNG, JPG, GIF up to 5MB')}
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.description', 'Description')}
                </Label>
                <RichTextEditor
                  id="description"
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
                  {t('lms.programs.docusign_template', 'DocuSign Template')}
                </Label>
                <Select
                  value={formData.docusign_template_id}
                  onValueChange={(value) => setFormData({ ...formData, docusign_template_id: value })}
                  dir={direction}
                  disabled={loadingTemplates}
                >
                  <SelectTrigger id="docusign">
                    <SelectValue placeholder={loadingTemplates ? t('common.loading', 'Loading...') : t('lms.programs.docusign_placeholder', 'Select template (optional)')} />
                  </SelectTrigger>
                  <SelectContent dir={direction}>
                    <SelectItem value="none">{t('common.none', 'None')}</SelectItem>
                    {docusignTemplates.map((template) => (
                      <SelectItem key={template.templateId} value={template.templateId}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label
                  htmlFor="active"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {t('lms.programs.activate_immediately', 'Activate immediately')}
                </Label>
              </div>
            </div>
            <DialogFooter className={`gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSaveCreate}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                    {t('common.creating', 'Creating...')}
                  </>
                ) : (
                  <>
                    <Check className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {t('common.create', 'Create')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent
            className="sm:max-w-[650px] max-h-[90vh] flex flex-col"
            dir={direction}>
            <DialogHeader>
              <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.edit_dialog_title', 'Edit Program')}
              </DialogTitle>
              <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.edit_dialog_description', 'Update the program details.')}
              </DialogDescription>
            </DialogHeader>

            {/* Error Alert */}
            {editError && (
              <Alert variant="destructive" className={isRtl ? 'text-right' : 'text-left'}>
                <XCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.name', 'Program Name')} *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: '' });
                    }
                  }}
                  dir={direction}
                  className={validationErrors.name ? 'border-destructive' : ''}
                />
                {validationErrors.name && (
                  <p className={`text-sm text-destructive ${isRtl ? 'text-right' : 'text-left'}`}>
                    {validationErrors.name}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.image', 'Program Image')}
                </Label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt={t('lms.programs.image_preview', 'Program preview')}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 p-1 h-6 w-6"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          setFormData({ ...formData, image_url: '' });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <Label
                      htmlFor="image-upload-edit"
                      className="cursor-pointer"
                    >
                      <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {t('lms.programs.upload_image', 'Click to upload image')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t('lms.programs.image_formats', 'PNG, JPG, GIF up to 5MB')}
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description" className={isRtl ? 'text-right' : 'text-left'}>
                  {t('lms.programs.description', 'Description')}
                </Label>
                <RichTextEditor
                  id="description"
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
                  {t('lms.programs.docusign_template', 'DocuSign Template')}
                </Label>
                <Select
                  value={formData.docusign_template_id}
                  onValueChange={(value) => setFormData({ ...formData, docusign_template_id: value })}
                  dir={direction}
                  disabled={loadingTemplates}
                >
                  <SelectTrigger id="edit-docusign">
                    <SelectValue placeholder={loadingTemplates ? t('common.loading', 'Loading...') : t('lms.programs.docusign_placeholder', 'Select template (optional)')} />
                  </SelectTrigger>
                  <SelectContent dir={direction}>
                    <SelectItem value="none">{t('common.none', 'None')}</SelectItem>
                    {docusignTemplates.map((template) => (
                      <SelectItem key={template.templateId} value={template.templateId}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label
                  htmlFor="edit-active"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {t('lms.programs.is_active', 'Active')}
                </Label>
              </div>
            </div>
            <DialogFooter className={`gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                    {t('common.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Check className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {t('common.save', 'Save')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent
            dir={direction}
            className="max-w-[90vw] sm:max-w-[500px]">
            <AlertDialogHeader>
              <AlertDialogTitle className={isRtl ? 'text-right' : 'text-left'}>
                {t('lms.programs.delete_dialog_title', 'Delete Program')}
              </AlertDialogTitle>
              <AlertDialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                {t(
                  'lms.programs.delete_dialog_description',
                  'Are you sure you want to delete "{name}"? This will also delete all associated courses, modules, lessons, and student progress. This action cannot be undone.'
                ).replace('{name}', selectedProgram?.name || '')}
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
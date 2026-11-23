'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  File,
  X,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  Archive,
  ListChecks,
  BookOpen,
  PenLine,
  Bookmark,
  Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineConfirm, SidePanel, panelPrimary, panelSecondary } from '@/components/admin/courses/builder/SidePanel';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { CourseMaterial, MaterialCategory } from '@/types/lms';
import { uploadCourseMaterial, deleteCourseMaterial, formatFileSize, getFileExtension } from '@/lib/supabase/materialStorage';

/** The kinds of material, each with its picture for the choice cards. */
const CATEGORY_CARDS: { value: MaterialCategory; icon: typeof BookOpen; fallback: string }[] = [
  { value: 'syllabus', icon: ListChecks, fallback: 'Syllabus' },
  { value: 'reading', icon: BookOpen, fallback: 'Reading' },
  { value: 'assignment', icon: PenLine, fallback: 'Assignment' },
  { value: 'reference', icon: Bookmark, fallback: 'Reference' },
  { value: 'other', icon: Paperclip, fallback: 'Other' },
];

interface CourseMaterialsProps {
  /** Each time this number changes, the upload panel opens (the button lives on the step's title row). */
  uploadSignal?: number;
  courseId: string;
  courseIsPublished: boolean;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
  direction: 'ltr' | 'rtl';
  onStatusMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export function CourseMaterials({ courseId, courseIsPublished, t, isRtl, direction, onStatusMessage, uploadSignal }: CourseMaterialsProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<CourseMaterial | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    category: 'other' as MaterialCategory,
    is_published: courseIsPublished,
  });

  // Fetch materials
  useEffect(() => {
    fetchMaterials();
  }, [courseId, courseIsPublished]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lms/materials?course_id=${courseId}`);
      const data = await response.json();

      if (data.success) {
        setMaterials(data.data);
      } else {
        onStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      onStatusMessage({ type: 'error', text: t('lms.materials.load_failed', 'The materials could not be loaded. Try again.') });
    } finally {
      setLoading(false);
    }
  };

  const [dragOver, setDragOver] = useState(false);
  const takeFile = (file: File | undefined) => {
    if (file) {
      setUploadForm((f) => ({ ...f, file, title: f.title || file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file,
        title: uploadForm.title || file.name.replace(/\.[^/.]+$/, ''), // Auto-fill title from filename
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      onStatusMessage({ type: 'error', text: t('lms.materials.file_required', 'Choose a file to upload.') });
      return;
    }

    if (!uploadForm.title.trim()) {
      onStatusMessage({ type: 'error', text: t('lms.materials.title_required', 'Write a title for the file.') });
      return;
    }

    try {
      setUploading(true);

      // Upload file to storage
      const fileUrl = await uploadCourseMaterial(uploadForm.file, courseId);

      if (!fileUrl) {
        throw new Error('Failed to upload file');
      }

      // Create material record in database
      const response = await fetch('/api/lms/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          title: uploadForm.title,
          description: uploadForm.description || null,
          file_name: uploadForm.file.name,
          file_url: fileUrl,
          file_type: uploadForm.file.type,
          file_size: uploadForm.file.size,
          category: uploadForm.category,
          is_published: uploadForm.is_published,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onStatusMessage({
          type: 'success',
          text: t('lms.materials.upload_success', 'Material uploaded successfully')
        });
        setShowUploadDialog(false);
        setUploadForm({
          file: null,
          title: '',
          description: '',
          category: 'other',
          is_published: true,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchMaterials();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      onStatusMessage({
        type: 'error',
        text: t('lms.materials.upload_failed', 'Failed to upload material')
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;

    try {
      // Delete from database
      const response = await fetch(`/api/lms/materials/${materialToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Delete from storage
        await deleteCourseMaterial(materialToDelete.file_url);

        onStatusMessage({
          type: 'success',
          text: t('lms.materials.delete_success', 'Material deleted successfully')
        });
        setShowDeleteDialog(false);
        setMaterialToDelete(null);
        fetchMaterials();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      onStatusMessage({
        type: 'error',
        text: t('lms.materials.delete_failed', 'Failed to delete material')
      });
    }
  };

  const togglePublish = async (material: CourseMaterial) => {
    try {
      const response = await fetch(`/api/lms/materials/${material.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_published: !material.is_published,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchMaterials();
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const getCategoryColor = (category: MaterialCategory | null) => {
    switch (category) {
      case 'syllabus': return 'bg-blue-100 text-blue-800';
      case 'reading': return 'bg-green-100 text-green-800';
      case 'assignment': return 'bg-orange-100 text-orange-800';
      case 'reference': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (fileName: string, mimeType: string) => {
    const ext = getFileExtension(fileName).toLowerCase();

    // Images
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return { Icon: FileImage, color: 'text-pink-600', bg: 'bg-pink-50' };
    }

    // Videos
    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
      return { Icon: FileVideo, color: 'text-purple-600', bg: 'bg-purple-50' };
    }

    // Audio
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
      return { Icon: FileAudio, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    }

    // Spreadsheets
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return { Icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' };
    }

    // Presentations
    if (['ppt', 'pptx', 'odp'].includes(ext)) {
      return { Icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' };
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { Icon: Archive, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    }

    // Documents (PDF, Word, etc)
    if (['pdf', 'doc', 'docx', 'odt', 'txt', 'rtf'].includes(ext)) {
      return { Icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
    }

    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'json', 'xml'].includes(ext)) {
      return { Icon: FileCode, color: 'text-slate-600', bg: 'bg-slate-50' };
    }

    // Default
    return { Icon: File, color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const firstSignal = useRef(uploadSignal);
  useEffect(() => {
    if (!uploadSignal || uploadSignal === firstSignal.current) return;
    firstSignal.current = uploadSignal;
          setUploadForm({
            file: null,
            title: '',
            description: '',
            category: 'other',
            is_published: courseIsPublished,
          });
          setShowUploadDialog(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadSignal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}

      {showDeleteDialog && materialToDelete && (
        <InlineConfirm
          text={t('lms.materials.deleteNamed', 'Delete "{title}"? This cannot be undone.').replace('{title}', materialToDelete.title)}
          confirmLabel={t('common.delete', 'Delete')}
          cancelLabel={t('common.cancel', 'Cancel')}
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            setShowDeleteDialog(false);
            setMaterialToDelete(null);
          }}
        />
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-center">
                {t('lms.materials.no_materials', 'No materials uploaded yet. Click "Upload Material" to add course materials for clients.')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {materials.map((material) => {
            const { Icon: FileIcon, color: iconColor, bg: iconBg } = getFileIcon(material.file_name, material.file_type);

            return (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* LTR Layout: Icon + Title + Badges | Actions */}
                    {!isRtl && (
                      <>
                        {/* Left side: Icon and Title together */}
                        <div className="flex items-start gap-3 flex-shrink-0">
                          <div className={`h-14 w-14 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                            <FileIcon className={`h-7 w-7 ${iconColor}`} />
                          </div>
                          <h3 className="font-semibold text-base text-left mt-1">{material.title}</h3>
                        </div>

                        {/* Content in center */}
                        <div className="flex-1 min-w-0">
                          {/* Badges on left side */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {material.category && (
                              <Badge variant="secondary" className={`${getCategoryColor(material.category)} flex-shrink-0`}>
                                {t(`lms.materials.category_${material.category}`, material.category)}
                              </Badge>
                            )}
                            {material.is_published ? (
                              <Badge variant="default" className="flex-shrink-0 bg-green-600">
                                {t('lms.builder.published', 'Published')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex-shrink-0">
                                {t('lms.builder.draft', 'Draft')}
                              </Badge>
                            )}
                          </div>

                          {material.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2 text-left">{material.description}</p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium uppercase">{getFileExtension(material.file_name)}</span>
                            <span>•</span>
                            <span>{formatFileSize(material.file_size)}</span>
                          </div>
                        </div>

                        {/* Actions on right in LTR */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePublish(material)}
                            title={material.is_published ? t('lms.builder.unpublish', 'Unpublish') : t('lms.builder.publish', 'Publish')}
                          >
                            {material.is_published ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(material.file_url, '_blank')}
                            title={t('lms.materials.download', 'Download')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMaterialToDelete(material);
                              setShowDeleteDialog(true);
                            }}
                            title={t('common.delete', 'Delete')}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}

                    {/* RTL Layout: Icon | Title + Badges | Description + File Info | Actions */}
                    {isRtl && (
                      <>
                        {/* Right side: Icon and Title together */}
                        <div className="flex items-start gap-3 flex-shrink-0">
                          <div className={`h-14 w-14 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                            <FileIcon className={`h-7 w-7 ${iconColor}`} />
                          </div>
                          <h3 className="font-semibold text-base text-right mt-1">{material.title}</h3>
                        </div>

                        {/* Content in center */}
                        <div className="flex-1 min-w-0">
                          {/* Badges on left side */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {material.category && (
                              <Badge variant="secondary" className={`${getCategoryColor(material.category)} flex-shrink-0`}>
                                {t(`lms.materials.category_${material.category}`, material.category)}
                              </Badge>
                            )}
                            {material.is_published ? (
                              <Badge variant="default" className="flex-shrink-0 bg-green-600">
                                {t('lms.builder.published', 'Published')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex-shrink-0">
                                {t('lms.builder.draft', 'Draft')}
                              </Badge>
                            )}
                          </div>

                          {material.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2 text-right">{material.description}</p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-row-reverse justify-end">
                            <span className="font-medium uppercase">{getFileExtension(material.file_name)}</span>
                            <span>•</span>
                            <span>{formatFileSize(material.file_size)}</span>
                          </div>
                        </div>

                        {/* Actions on left in RTL */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePublish(material)}
                            title={material.is_published ? t('lms.builder.unpublish', 'Unpublish') : t('lms.builder.publish', 'Publish')}
                          >
                            {material.is_published ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(material.file_url, '_blank')}
                            title={t('lms.materials.download', 'Download')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMaterialToDelete(material);
                              setShowDeleteDialog(true);
                            }}
                            title={t('common.delete', 'Delete')}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload: a side panel */}
      <SidePanel
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        busy={uploading}
        title={t('lms.materials.upload_dialog_title', 'Upload Course Material')}
        description={t('lms.materials.upload_dialog_desc', 'Upload PDFs, documents, videos, or other files for your clients')}
        footer={
          <>
            <button type="button" onClick={handleUpload} disabled={uploading || !uploadForm.file} className={panelPrimary}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {uploading ? t('lms.materials.uploading', 'Uploading...') : t('common.upload', 'Upload')}
            </button>
            <button type="button" onClick={() => setShowUploadDialog(false)} disabled={uploading} className={panelSecondary}>
              {t('common.cancel', 'Cancel')}
            </button>
          </>
        }
      >
          <div className="space-y-5" dir={direction}>
            {/* The file: a drop zone, then the chosen file as a tile */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
              className="hidden"
              id="material-file-input"
            />
            {uploadForm.file ? (
              (() => {
                const { Icon, color, bg } = getFileIcon(uploadForm.file.name, uploadForm.file.type || '');
                return (
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${bg} dark:bg-white/10`} aria-hidden>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold" dir="auto">
                        {uploadForm.file.name}
                      </div>
                      <div className="text-[13px] text-muted-foreground">
                        {getFileExtension(uploadForm.file.name).toUpperCase()} · {formatFileSize(uploadForm.file.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-9 rounded-lg px-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
                    >
                      {t('lms.materials.replace_file', 'Replace')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadForm({ ...uploadForm, file: null });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      aria-label={t('lms.materials.remove_file', 'Remove the file')}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                );
              })()
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  takeFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  dragOver ? 'border-primary bg-primary/10' : 'border-primary/30 bg-primary/[0.03] hover:border-primary/60 hover:bg-primary/[0.06]'
                }`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary" aria-hidden>
                  <Upload className="h-6 w-6" />
                </span>
                <span className="font-semibold">{t('lms.materials.drop_title', 'Choose a file or drag it here')}</span>
                <span className="text-[13px] text-muted-foreground">{t('lms.materials.drop_hint', 'PDF, Word, Excel, PowerPoint, images, video, audio or ZIP')}</span>
              </button>
            )}

            {/* Title */}
            <div className="grid gap-1.5">
              <Label htmlFor="material-title" className="font-semibold">
                {t('lms.materials.title_label', 'Title')} <span className="text-red-600">*</span>
              </Label>
              <Input
                id="material-title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder={t('lms.materials.title_placeholder', 'e.g., Course Syllabus')}
                dir={direction}
                className="h-11"
              />
            </div>

            {/* Category: picture cards */}
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold">{t('lms.materials.category_label', 'Category')}</span>
              <div role="radiogroup" aria-label={t('lms.materials.category_label', 'Category')} className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {CATEGORY_CARDS.map(({ value, icon: Icon, fallback }) => {
                  const on = uploadForm.category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setUploadForm({ ...uploadForm, category: value })}
                      className={`flex min-h-[78px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[13px] font-semibold transition-colors ${
                        on ? 'border-2 border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-lg ${on ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`} aria-hidden>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      {t(`lms.materials.category_${value}`, fallback)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label htmlFor="material-description" className="font-semibold">
                {t('lms.materials.description_label', 'Description (Optional)')}
              </Label>
              <Textarea
                id="material-description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder={t('lms.materials.description_placeholder', 'Brief description of this material...')}
                rows={3}
                dir={direction}
              />
            </div>

            {/* Publish */}
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
              <span>
                <span className="block font-semibold">{t('lms.materials.publish_label', 'Publish immediately')}</span>
                <span className="block text-[13px] text-muted-foreground">{t('lms.materials.publish_hint', 'Off = only admins see it until you publish')}</span>
              </span>
              <Switch checked={uploadForm.is_published} onCheckedChange={(checked) => setUploadForm({ ...uploadForm, is_published: checked })} />
            </label>
          </div>
      </SidePanel>

    </div>
  );
}

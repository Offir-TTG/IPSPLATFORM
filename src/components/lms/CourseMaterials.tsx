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
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CourseMaterial, MaterialCategory } from '@/types/lms';
import { uploadCourseMaterial, deleteCourseMaterial, formatFileSize, getFileExtension } from '@/lib/supabase/materialStorage';

interface CourseMaterialsProps {
  courseId: string;
  courseIsPublished: boolean;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
  direction: 'ltr' | 'rtl';
  onStatusMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export function CourseMaterials({ courseId, courseIsPublished, t, isRtl, direction, onStatusMessage }: CourseMaterialsProps) {
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
      onStatusMessage({ type: 'error', text: 'Failed to load materials' });
    } finally {
      setLoading(false);
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
      onStatusMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    if (!uploadForm.title.trim()) {
      onStatusMessage({ type: 'error', text: 'Please enter a title' });
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
      <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
        <Button onClick={() => {
          setUploadForm({
            file: null,
            title: '',
            description: '',
            category: 'other',
            is_published: courseIsPublished,
          });
          setShowUploadDialog(true);
        }}>
          <Upload className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
          {t('lms.materials.upload_button', 'Upload Material')}
        </Button>
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-center">
                {t('lms.materials.no_materials', 'No materials uploaded yet. Click "Upload Material" to add course materials for students.')}
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

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent dir={direction} className="max-w-md">
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : ''}>
              {t('lms.materials.upload_dialog_title', 'Upload Course Material')}
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : ''}>
              {t('lms.materials.upload_dialog_desc', 'Upload PDFs, documents, videos, or other files for your students')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Input */}
            <div className="space-y-2">
              <Label className={isRtl ? 'text-right block' : ''}>
                {t('lms.materials.file_label', 'File')}
              </Label>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                  className="hidden"
                  id="material-file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                  {uploadForm.file ? uploadForm.file.name : t('lms.materials.choose_file', 'Choose File')}
                </Button>
                {uploadForm.file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadForm({ ...uploadForm, file: null });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadForm.file && (
                <p className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                  {formatFileSize(uploadForm.file.size)}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className={isRtl ? 'text-right block' : ''}>
                {t('lms.materials.title_label', 'Title')}
              </Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder={t('lms.materials.title_placeholder', 'e.g., Course Syllabus')}
                dir={direction}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className={isRtl ? 'text-right block' : ''}>
                {t('lms.materials.description_label', 'Description (Optional)')}
              </Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder={t('lms.materials.description_placeholder', 'Brief description of this material...')}
                rows={3}
                dir={direction}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className={isRtl ? 'text-right block' : ''}>
                {t('lms.materials.category_label', 'Category')}
              </Label>
              <Select value={uploadForm.category} onValueChange={(value: MaterialCategory) => setUploadForm({ ...uploadForm, category: value })}>
                <SelectTrigger dir={direction}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="syllabus">{t('lms.materials.category_syllabus', 'Syllabus')}</SelectItem>
                  <SelectItem value="reading">{t('lms.materials.category_reading', 'Reading')}</SelectItem>
                  <SelectItem value="assignment">{t('lms.materials.category_assignment', 'Assignment')}</SelectItem>
                  <SelectItem value="reference">{t('lms.materials.category_reference', 'Reference')}</SelectItem>
                  <SelectItem value="other">{t('lms.materials.category_other', 'Other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Publish Toggle */}
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Switch
                checked={uploadForm.is_published}
                onCheckedChange={(checked) => setUploadForm({ ...uploadForm, is_published: checked })}
              />
              <Label className={`cursor-pointer ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('lms.materials.publish_label', 'Publish immediately')}
              </Label>
            </div>
          </div>

          <DialogFooter className={`gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadForm.file}>
              {uploading ? (
                <>
                  <Loader2 className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                  {t('lms.materials.uploading', 'Uploading...')}
                </>
              ) : (
                t('common.upload', 'Upload')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent dir={direction}>
          <DialogHeader>
            <DialogTitle className={isRtl ? 'text-right' : ''}>
              {t('lms.materials.delete_title', 'Delete Material')}
            </DialogTitle>
            <DialogDescription className={isRtl ? 'text-right' : ''}>
              {t('lms.materials.delete_confirmation', 'Are you sure you want to delete this material? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={`gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

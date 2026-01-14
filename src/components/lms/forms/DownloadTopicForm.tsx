'use client';

import { useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uploadCourseMaterial } from '@/lib/supabase/materialStorage';

interface DownloadTopicFormProps {
  content: any;
  onChange: (content: any) => void;
  error?: string;
  t: (key: string, fallback: string) => string;
}

export function DownloadTopicForm({ content, onChange, error, t }: DownloadTopicFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(t('lms.topics.file_too_large', 'File must be smaller than 50MB'));
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      // Upload to course-materials bucket
      const fileUrl = await uploadCourseMaterial(file, 'lesson-topics');

      onChange({
        ...content,
        file_url: fileUrl,
        filename: file.name,
        file_type: file.type,
        size: file.size,
      });
    } catch (err) {
      console.error('File upload error:', err);
      setUploadError(t('lms.topics.file_upload_failed', 'Failed to upload file. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange({
      description: content.description, // Keep description
    });
    setUploadError(null);
  };

  const updateDescription = (description: string) => {
    onChange({
      ...content,
      description,
    });
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div className="space-y-2">
        <Label>
          {t('lms.topics.upload_file', 'File')} *
        </Label>

        {content.file_url ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
            <File className="h-8 w-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{content.filename}</p>
              <p className="text-xs text-muted-foreground">
                {(content.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="download-upload"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => document.getElementById('download-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? t('common.uploading', 'Uploading...') : t('lms.topics.select_file', 'Select File')}
            </Button>
          </div>
        )}

        {(error || uploadError) && (
          <p className="text-sm text-destructive">{error || uploadError}</p>
        )}

        <p className="text-xs text-muted-foreground">
          {t('lms.topics.file_max_size', 'Maximum file size: 50MB. All file types supported.')}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="download-description">
          {t('lms.topics.file_description', 'Description')} ({t('common.optional', 'Optional')})
        </Label>
        <Textarea
          id="download-description"
          value={content.description || ''}
          onChange={(e) => updateDescription(e.target.value)}
          placeholder={t('lms.topics.file_description_placeholder', 'Describe what this file contains')}
          rows={3}
        />
      </div>
    </div>
  );
}

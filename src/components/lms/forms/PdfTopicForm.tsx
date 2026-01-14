'use client';

import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadCourseMaterial } from '@/lib/supabase/materialStorage';

interface PdfTopicFormProps {
  content: any;
  onChange: (content: any) => void;
  error?: string;
  t: (key: string, fallback: string) => string;
}

export function PdfTopicForm({ content, onChange, error, t }: PdfTopicFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError(t('lms.topics.invalid_pdf', 'Please select a PDF file'));
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(t('lms.topics.pdf_too_large', 'PDF file must be smaller than 50MB'));
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      // Upload to course-materials bucket
      const fileUrl = await uploadCourseMaterial(file, 'lesson-topics');

      onChange({
        file_url: fileUrl,
        filename: file.name,
        size: file.size,
      });
    } catch (err) {
      console.error('PDF upload error:', err);
      setUploadError(t('lms.topics.pdf_upload_failed', 'Failed to upload PDF. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange({});
    setUploadError(null);
  };

  return (
    <div className="space-y-2">
      <Label>
        {t('lms.topics.upload_pdf', 'PDF Document')} *
      </Label>

      {content.file_url ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
          <FileText className="h-8 w-8 text-red-600" />
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
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={uploading}
            onClick={() => document.getElementById('pdf-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? t('common.uploading', 'Uploading...') : t('lms.topics.select_pdf', 'Select PDF File')}
          </Button>
        </div>
      )}

      {(error || uploadError) && (
        <p className="text-sm text-destructive">{error || uploadError}</p>
      )}

      <p className="text-xs text-muted-foreground">
        {t('lms.topics.pdf_max_size', 'Maximum file size: 50MB')}
      </p>
    </div>
  );
}

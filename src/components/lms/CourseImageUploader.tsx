'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface CourseImageUploaderProps {
  courseId: string;
  currentImageUrl: string | null;
  onImageChange: (newImageUrl: string | null) => void;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
  direction: 'ltr' | 'rtl';
}

export function CourseImageUploader({
  courseId,
  currentImageUrl,
  onImageChange,
  t,
  isRtl,
  direction,
}: CourseImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: t('lms.course.invalid_image_type', 'Please upload a JPG, PNG, WebP, or GIF image'),
      };
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: t('lms.course.image_too_large', 'Image must be smaller than 5MB'),
      };
    }

    return { valid: true };
  };

  const handleUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);

      const response = await fetch('/api/lms/courses/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        onImageChange(data.url);

        // Update course record with new image URL
        await fetch(`/api/lms/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: data.url }),
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert(t('lms.course.image_upload_failed', 'Failed to upload image. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentImageUrl) return;

    const confirmed = confirm(
      t('lms.course.confirm_remove_image', 'Are you sure you want to remove the cover image?')
    );

    if (!confirmed) return;

    setUploading(true);

    try {
      const response = await fetch('/api/lms/courses/upload-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: currentImageUrl }),
      });

      const data = await response.json();

      if (data.success) {
        onImageChange(null);

        // Update course record to remove image URL
        await fetch(`/api/lms/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: null }),
        });
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Image delete error:', error);
      alert(t('lms.course.image_remove_failed', 'Failed to remove image. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, []);

  return (
    <Card dir={direction}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {t('lms.course.cover_image', 'Course Cover Image')}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t('lms.course.recommended_size', 'Recommended: 1200x675px (16:9)')}
            </span>
          </div>

          {/* Image Preview or Upload Area */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Preview Area */}
            <div className="w-full md:w-2/3">
              {currentImageUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={currentImageUrl}
                    alt={t('lms.course.cover_image', 'Course Cover Image')}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                  />
                </div>
              ) : (
                <div
                  className={`
                    relative w-full aspect-video rounded-lg border-2 border-dashed
                    flex items-center justify-center bg-muted/30
                    transition-colors cursor-pointer
                    ${dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center p-6">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {t('lms.course.drag_drop_image', 'Drag and drop an image here, or click to browse')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('lms.course.image_formats', 'JPG, PNG, WebP, GIF up to 5MB')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="w-full md:w-1/3 flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-11 md:h-10"
                variant={currentImageUrl ? 'outline' : 'default'}
              >
                <Upload className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {uploading
                  ? t('lms.course.image_uploading', 'Uploading...')
                  : currentImageUrl
                  ? t('lms.course.change_cover_image', 'Change Cover Image')
                  : t('lms.course.upload_cover_image', 'Upload Cover Image')}
              </Button>

              {currentImageUrl && (
                <Button
                  onClick={handleRemove}
                  disabled={uploading}
                  variant="destructive"
                  className="w-full h-11 md:h-10"
                >
                  <X className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('lms.course.remove_cover_image', 'Remove Cover Image')}
                </Button>
              )}

              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <p>• {t('lms.course.image_size_limit', 'Maximum file size: 5MB')}</p>
                <p>• {t('lms.course.image_aspect_ratio', 'Best aspect ratio: 16:9')}</p>
                <p>• {t('lms.course.image_resolution', 'Recommended: 1200x675px')}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

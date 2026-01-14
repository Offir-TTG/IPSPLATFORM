'use client';

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { LessonTopic, TopicContentType } from '@/types/lms';

// Import content-specific form components (will create these next)
import { VideoTopicForm } from '../forms/VideoTopicForm';
import { TextTopicForm } from '../forms/TextTopicForm';
import { LinkTopicForm } from '../forms/LinkTopicForm';
import { PdfTopicForm } from '../forms/PdfTopicForm';
import { DownloadTopicForm } from '../forms/DownloadTopicForm';
import { EmbedTopicForm } from '../forms/EmbedTopicForm';
import { WhiteboardTopicForm } from '../forms/WhiteboardTopicForm';

interface TopicEditDialogProps {
  topic: LessonTopic | null;
  contentType: TopicContentType | null | undefined;
  onSave: (data: Partial<LessonTopic>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
  direction: 'ltr' | 'rtl';
}

export function TopicEditDialog({
  topic,
  contentType,
  onSave,
  onCancel,
  saving,
  t,
  isRtl,
  direction,
}: TopicEditDialogProps) {
  const [formData, setFormData] = useState<Partial<LessonTopic>>({
    title: topic?.title || '',
    content: topic?.content || undefined,
    duration_minutes: topic?.duration_minutes ?? undefined,
    is_required: topic?.is_required || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeContentType = contentType || topic?.content_type;

  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.title,
        content: topic.content,
        duration_minutes: topic.duration_minutes,
        is_required: topic.is_required,
      });
    }
  }, [topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = t('lms.topics.title_required', 'Title is required');
    }

    // Content type specific validation
    if (activeContentType === 'video') {
      if (!(formData.content as any)?.url) {
        newErrors.url = t('lms.topics.video_url_required', 'Video URL is required');
      }
    } else if (activeContentType === 'link') {
      if (!(formData.content as any)?.url) {
        newErrors.url = t('lms.topics.link_url_required', 'Link URL is required');
      }
    } else if (activeContentType === 'text') {
      if (!(formData.content as any)?.html) {
        newErrors.content = t('lms.topics.content_required', 'Content is required');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave(formData);
  };

  const updateFormData = (field: keyof LessonTopic, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateContent = (content: any) => {
    updateFormData('content', content);
  };

  const renderContentForm = () => {
    switch (activeContentType) {
      case 'video':
        return (
          <VideoTopicForm
            content={formData.content || {}}
            onChange={updateContent}
            error={errors.url}
            t={t}
          />
        );
      case 'text':
        return (
          <TextTopicForm
            content={formData.content || {}}
            onChange={updateContent}
            error={errors.content}
            t={t}
            direction={direction}
          />
        );
      case 'link':
        return (
          <LinkTopicForm
            content={formData.content || {}}
            onChange={updateContent}
            error={errors.url}
            t={t}
          />
        );
      case 'pdf':
        return (
          <PdfTopicForm
            content={formData.content || {}}
            onChange={updateContent}
            error={errors.file}
            t={t}
          />
        );
      case 'download':
        return (
          <DownloadTopicForm
            content={formData.content || {}}
            onChange={updateContent}
            error={errors.file}
            t={t}
          />
        );
      case 'embed':
        return (
          <EmbedTopicForm
            content={formData.content || {}}
            onChange={updateContent}
            error={errors.embed}
            t={t}
          />
        );
      case 'whiteboard':
        return (
          <WhiteboardTopicForm
            content={formData.content || {}}
            onChange={updateContent}
            error={errors.whiteboard}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    if (topic) {
      return t('lms.topics.edit_topic', 'Edit Content Block');
    }

    const typeLabels: Record<TopicContentType, string> = {
      video: t('lms.topics.add_video', 'Add Video'),
      text: t('lms.topics.add_text', 'Add Text'),
      link: t('lms.topics.add_link', 'Add Link'),
      pdf: t('lms.topics.add_pdf', 'Add PDF'),
      download: t('lms.topics.add_download', 'Add Download'),
      embed: t('lms.topics.add_embed', 'Add Embed'),
      whiteboard: t('lms.topics.add_whiteboard', 'Add Whiteboard'),
      quiz: t('lms.topics.add_quiz', 'Add Quiz'),
      assignment: t('lms.topics.add_assignment', 'Add Assignment'),
    };

    return activeContentType ? typeLabels[activeContentType] : t('lms.topics.add_topic', 'Add Content Block');
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {t('lms.topics.title', 'Title')} *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder={t('lms.topics.title_placeholder', 'Enter a title for this content')}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Content-specific form */}
            {renderContentForm()}

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                {t('lms.topics.duration', 'Duration')} ({t('lms.topics.minutes', 'minutes')})
              </Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration_minutes || ''}
                onChange={(e) => updateFormData('duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
                placeholder={t('lms.topics.duration_placeholder', 'Optional: Estimated time to complete')}
              />
            </div>

            {/* Required checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={formData.is_required}
                onCheckedChange={(checked) => updateFormData('is_required', checked)}
              />
              <Label htmlFor="required" className="cursor-pointer">
                {t('lms.topics.mark_required', 'Mark as required for course completion')}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              <X className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

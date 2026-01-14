'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LessonTopic } from '@/types/lms';
import { VideoTopicBlock } from './VideoTopicBlock';
import { TextTopicBlock } from './TextTopicBlock';
import { LinkTopicBlock } from './LinkTopicBlock';
import { PdfTopicBlock } from './PdfTopicBlock';
import { DownloadTopicBlock } from './DownloadTopicBlock';
import { EmbedTopicBlock } from './EmbedTopicBlock';
import { WhiteboardTopicBlock } from './WhiteboardTopicBlock';

interface TopicBlockProps {
  topic: LessonTopic;
  previewMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
  direction: 'ltr' | 'rtl';
}

export function TopicBlock({
  topic,
  previewMode,
  onEdit,
  onDelete,
  t,
  isRtl,
  direction,
}: TopicBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Render content based on type
  const renderContent = () => {
    switch (topic.content_type) {
      case 'video':
        return <VideoTopicBlock topic={topic} t={t} />;
      case 'text':
        return <TextTopicBlock topic={topic} t={t} />;
      case 'link':
        return <LinkTopicBlock topic={topic} t={t} isRtl={isRtl} />;
      case 'pdf':
        return <PdfTopicBlock topic={topic} t={t} isRtl={isRtl} />;
      case 'download':
        return <DownloadTopicBlock topic={topic} t={t} isRtl={isRtl} />;
      case 'embed':
        return <EmbedTopicBlock topic={topic} t={t} />;
      case 'whiteboard':
        return <WhiteboardTopicBlock topic={topic} t={t} isRtl={isRtl} mode="view" />;
      case 'quiz':
        return (
          <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
            <p className="text-sm">{t('lms.topics.quiz_coming_soon', 'Quiz content (Coming Soon)')}</p>
          </div>
        );
      case 'assignment':
        return (
          <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
            <p className="text-sm">{t('lms.topics.assignment_coming_soon', 'Assignment content (Coming Soon)')}</p>
          </div>
        );
      default:
        return (
          <div className="p-4 text-muted-foreground text-sm">
            {t('lms.topics.unknown_type', 'Unknown content type')}
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-card border rounded-lg overflow-hidden
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}
        ${!previewMode ? 'hover:shadow-md transition-shadow' : ''}
      `}
      dir={direction}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b">
        {/* Drag Handle */}
        {!previewMode && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{topic.title}</h4>
          {topic.duration_minutes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              {topic.duration_minutes} {t('lms.topics.minutes', 'minutes')}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {topic.is_required && (
            <Badge variant="secondary" className="text-xs">
              {t('lms.topics.required', 'Required')}
            </Badge>
          )}

          {/* Edit/Delete Buttons */}
          {!previewMode && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onEdit}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  );
}

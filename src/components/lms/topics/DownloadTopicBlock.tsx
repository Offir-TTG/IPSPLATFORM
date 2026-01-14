'use client';

import { Download, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LessonTopic } from '@/types/lms';

interface DownloadTopicBlockProps {
  topic: LessonTopic;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
}

export function DownloadTopicBlock({ topic, t, isRtl }: DownloadTopicBlockProps) {
  const content = topic.content as {
    file_url?: string;
    filename?: string;
    file_type?: string;
    size?: number;
    description?: string;
  };

  if (!content?.file_url) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('lms.topics.no_download_file', 'No file uploaded')}
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
            <File className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-sm truncate">{content.filename || 'file'}</h5>
          {content.size && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(content.size)}
            </p>
          )}
          {content.description && (
            <p className="text-sm text-muted-foreground mt-2">{content.description}</p>
          )}

          <Button
            asChild
            variant="default"
            size="sm"
            className="mt-3"
          >
            <a
              href={content.file_url}
              download={content.filename}
            >
              <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('lms.topics.download_button', 'Download')}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

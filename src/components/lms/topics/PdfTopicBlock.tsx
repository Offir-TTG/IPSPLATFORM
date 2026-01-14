'use client';

import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LessonTopic } from '@/types/lms';

interface PdfTopicBlockProps {
  topic: LessonTopic;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
}

export function PdfTopicBlock({ topic, t, isRtl }: PdfTopicBlockProps) {
  const content = topic.content as {
    file_url?: string;
    filename?: string;
    size?: number;
    page_count?: number;
  };

  if (!content?.file_url) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('lms.topics.no_pdf_file', 'No PDF file uploaded')}
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-sm truncate">{content.filename || 'document.pdf'}</h5>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {content.size && <span>{formatFileSize(content.size)}</span>}
          {content.page_count && <span>• {content.page_count} pages</span>}
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-3"
        >
          <a
            href={content.file_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {t('lms.topics.view_pdf', 'View PDF')}
          </a>
        </Button>
      </div>
    </div>
  );
}

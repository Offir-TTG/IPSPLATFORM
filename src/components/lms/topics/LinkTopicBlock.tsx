'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LessonTopic } from '@/types/lms';

interface LinkTopicBlockProps {
  topic: LessonTopic;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
}

export function LinkTopicBlock({ topic, t, isRtl }: LinkTopicBlockProps) {
  const content = topic.content as {
    url?: string;
    title?: string;
    description?: string;
    open_in_new_tab?: boolean;
  };

  if (!content?.url) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('lms.topics.no_link_url', 'No link URL provided')}
      </div>
    );
  }

  const linkTitle = content.title || content.url;
  const openInNewTab = content.open_in_new_tab !== false; // default true

  return (
    <div className="space-y-2">
      <a
        href={content.url}
        target={openInNewTab ? '_blank' : '_self'}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
      >
        <ExternalLink className="h-4 w-4 flex-shrink-0" />
        <span>{linkTitle}</span>
      </a>

      {content.description && (
        <p className="text-sm text-muted-foreground">{content.description}</p>
      )}

      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-2"
      >
        <a
          href={content.url}
          target={openInNewTab ? '_blank' : '_self'}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
          <ExternalLink className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('lms.topics.open_link', 'Open Link')}
        </a>
      </Button>
    </div>
  );
}

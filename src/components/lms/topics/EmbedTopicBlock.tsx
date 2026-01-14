'use client';

import type { LessonTopic } from '@/types/lms';

interface EmbedTopicBlockProps {
  topic: LessonTopic;
  t: (key: string, fallback: string) => string;
}

export function EmbedTopicBlock({ topic, t }: EmbedTopicBlockProps) {
  const content = topic.content as {
    embed_code?: string;
    provider?: string;
    width?: string;
    height?: string;
  };

  if (!content?.embed_code) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('lms.topics.no_embed_code', 'No embed code provided')}
      </div>
    );
  }

  // Sanitize embed code (check for allowed domains)
  const ALLOWED_DOMAINS = [
    'youtube.com',
    'youtube-nocookie.com',
    'vimeo.com',
    'docs.google.com',
    'drive.google.com',
    'forms.office.com',
    'miro.com',
    'figma.com',
    'canva.com',
  ];

  const srcMatch = content.embed_code.match(/src="([^"]+)"/);
  if (!srcMatch) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
        <p className="text-sm text-destructive">
          {t('lms.topics.invalid_embed', 'Invalid embed code. Could not find src attribute.')}
        </p>
      </div>
    );
  }

  const src = srcMatch[1];
  const isAllowed = ALLOWED_DOMAINS.some(domain => src.includes(domain));

  if (!isAllowed) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
        <p className="text-sm text-destructive">
          {t('lms.topics.unsupported_embed', 'Unsupported embed source. Only trusted domains are allowed.')}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {t('lms.topics.allowed_domains', 'Allowed: YouTube, Vimeo, Google Docs, Microsoft Forms, Miro, Figma, Canva')}
        </p>
      </div>
    );
  }

  const width = content.width || '100%';
  const height = content.height || '600px';

  return (
    <div className="w-full" style={{ height }}>
      <div
        dangerouslySetInnerHTML={{ __html: content.embed_code }}
        className="w-full h-full"
        style={{
          width,
          maxWidth: '100%',
        }}
      />
    </div>
  );
}

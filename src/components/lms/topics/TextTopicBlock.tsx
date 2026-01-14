'use client';

import type { LessonTopic } from '@/types/lms';

interface TextTopicBlockProps {
  topic: LessonTopic;
  t: (key: string, fallback: string) => string;
}

export function TextTopicBlock({ topic, t }: TextTopicBlockProps) {
  const content = topic.content as { html?: string };

  if (!content?.html) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('lms.topics.no_text_content', 'No content provided')}
      </div>
    );
  }

  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: content.html }}
    />
  );
}

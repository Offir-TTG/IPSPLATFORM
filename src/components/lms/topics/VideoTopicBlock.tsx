'use client';

import type { LessonTopic } from '@/types/lms';

interface VideoTopicBlockProps {
  topic: LessonTopic;
  t: (key: string, fallback: string) => string;
}

export function VideoTopicBlock({ topic, t }: VideoTopicBlockProps) {
  const content = topic.content as { url?: string; provider?: string; thumbnail?: string };

  if (!content?.url) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('lms.topics.no_video_url', 'No video URL provided')}
      </div>
    );
  }

  // Parse video URL to get embed code
  const getEmbedUrl = () => {
    const url = content.url!;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
  };

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
        <p className="text-sm text-destructive">
          {t('lms.topics.invalid_video_url', 'Invalid video URL. Please use YouTube or Vimeo links.')}
        </p>
        <p className="text-xs text-muted-foreground mt-2">URL: {content.url}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

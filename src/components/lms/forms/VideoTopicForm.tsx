'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VideoTopicFormProps {
  content: any;
  onChange: (content: any) => void;
  error?: string;
  t: (key: string, fallback: string) => string;
}

export function VideoTopicForm({ content, onChange, error, t }: VideoTopicFormProps) {
  const handleUrlChange = (url: string) => {
    // Parse provider from URL
    let provider: 'youtube' | 'vimeo' | null = null;

    if (url.match(/(?:youtube\.com|youtu\.be)/)) {
      provider = 'youtube';
    } else if (url.match(/vimeo\.com/)) {
      provider = 'vimeo';
    }

    onChange({
      url,
      provider,
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="video-url">
        {t('lms.topics.video_url', 'Video URL')} *
      </Label>
      <Input
        id="video-url"
        type="url"
        value={content.url || ''}
        onChange={(e) => handleUrlChange(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {t('lms.topics.youtube_vimeo', 'Supports YouTube and Vimeo URLs')}
      </p>
    </div>
  );
}

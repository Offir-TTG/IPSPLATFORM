'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface EmbedTopicFormProps {
  content: any;
  onChange: (content: any) => void;
  error?: string;
  t: (key: string, fallback: string) => string;
}

export function EmbedTopicForm({ content, onChange, error, t }: EmbedTopicFormProps) {
  const updateField = (field: string, value: any) => {
    onChange({
      ...content,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Embed Code */}
      <div className="space-y-2">
        <Label htmlFor="embed-code">
          {t('lms.topics.embed_code', 'Embed Code')} *
        </Label>
        <Textarea
          id="embed-code"
          value={content.embed_code || ''}
          onChange={(e) => updateField('embed_code', e.target.value)}
          placeholder='<iframe src="https://..." width="100%" height="600"></iframe>'
          rows={6}
          className={`font-mono text-xs ${error ? 'border-destructive' : ''}`}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {t('lms.topics.paste_iframe', 'Paste the iframe embed code from YouTube, Vimeo, Google Docs, etc.')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('lms.topics.allowed_domains', 'Allowed: YouTube, Vimeo, Google Docs, Microsoft Forms, Miro, Figma, Canva')}
        </p>
      </div>

      {/* Width (optional) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="embed-width">
            {t('lms.topics.embed_width', 'Width')} ({t('common.optional', 'Optional')})
          </Label>
          <Input
            id="embed-width"
            value={content.width || ''}
            onChange={(e) => updateField('width', e.target.value)}
            placeholder="100%"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="embed-height">
            {t('lms.topics.embed_height', 'Height')} ({t('common.optional', 'Optional')})
          </Label>
          <Input
            id="embed-height"
            value={content.height || ''}
            onChange={(e) => updateField('height', e.target.value)}
            placeholder="600px"
          />
        </div>
      </div>
    </div>
  );
}

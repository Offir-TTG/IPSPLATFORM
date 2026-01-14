'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface LinkTopicFormProps {
  content: any;
  onChange: (content: any) => void;
  error?: string;
  t: (key: string, fallback: string) => string;
}

export function LinkTopicForm({ content, onChange, error, t }: LinkTopicFormProps) {
  const updateField = (field: string, value: any) => {
    onChange({
      ...content,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="link-url">
          {t('lms.topics.link_url', 'URL')} *
        </Label>
        <Input
          id="link-url"
          type="url"
          value={content.url || ''}
          onChange={(e) => updateField('url', e.target.value)}
          placeholder="https://example.com"
          className={error ? 'border-destructive' : ''}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Link Title (optional) */}
      <div className="space-y-2">
        <Label htmlFor="link-title">
          {t('lms.topics.link_title', 'Link Title')} ({t('common.optional', 'Optional')})
        </Label>
        <Input
          id="link-title"
          value={content.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder={t('lms.topics.link_title_placeholder', 'Custom display text for the link')}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="link-description">
          {t('lms.topics.link_description', 'Description')} ({t('common.optional', 'Optional')})
        </Label>
        <Textarea
          id="link-description"
          value={content.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={t('lms.topics.link_description_placeholder', 'Brief description of the link')}
          rows={3}
        />
      </div>

      {/* Open in new tab */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="open-new-tab"
          checked={content.open_in_new_tab !== false} // default true
          onCheckedChange={(checked) => updateField('open_in_new_tab', checked)}
        />
        <Label htmlFor="open-new-tab" className="cursor-pointer">
          {t('lms.topics.open_in_new_tab', 'Open in new tab')}
        </Label>
      </div>
    </div>
  );
}

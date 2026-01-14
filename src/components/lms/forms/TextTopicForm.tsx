'use client';

import dynamic from 'next/dynamic';
import { Label } from '@/components/ui/label';

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor').then((mod) => mod.RichTextEditor),
  { ssr: false }
);

interface TextTopicFormProps {
  content: any;
  onChange: (content: any) => void;
  error?: string;
  t: (key: string, fallback: string) => string;
  direction: 'ltr' | 'rtl';
}

export function TextTopicForm({ content, onChange, error, t, direction }: TextTopicFormProps) {
  const handleChange = (html: string) => {
    onChange({
      html,
      plaintext: html.replace(/<[^>]*>/g, ''), // Strip HTML for search
    });
  };

  return (
    <div className="space-y-2">
      <Label>
        {t('lms.topics.rich_text', 'Content')} *
      </Label>
      <div className={`border rounded-md ${error ? 'border-destructive' : ''}`}>
        <RichTextEditor
          value={content.html || ''}
          onChange={handleChange}
          placeholder={t('lms.topics.text_placeholder', 'Start typing your content...')}
          dir={direction}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

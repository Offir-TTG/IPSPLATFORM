'use client';

import { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdminLanguage } from '@/context/AppContext';

interface PlainTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  variables?: Array<{ name: string; description: string }>;
  rows?: number;
}

export function PlainTextEditor({
  value,
  onChange,
  label,
  description,
  placeholder,
  dir = 'ltr',
  variables = [],
  rows = 12,
}: PlainTextEditorProps) {
  const { t } = useAdminLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert variable at cursor position
  const insertVariable = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const variable = `{{${variableName}}}`;

    const newText = before + variable + after;
    onChange(newText);

    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variable.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <div>
            <Label>{label}</Label>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      )}

      {/* Variables Quick Insert */}
      {variables.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md border">
          <span className="text-xs font-medium text-muted-foreground self-center">
            Quick insert:
          </span>
          {variables.map((variable) => (
            <Button
              key={variable.name}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => insertVariable(variable.name)}
              title={variable.description}
            >
              {`{{${variable.name}}}`}
            </Button>
          ))}
        </div>
      )}

      {/* Plain Text Editor */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Enter plain text content...'}
        rows={rows}
        className="font-mono text-sm resize-y min-h-[200px]"
        dir={dir}
      />

      {/* Character/Line Count */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('emails.editor.text_fallback', 'Plain text will be used as fallback')}</span>
        <div className="flex gap-3">
          <span>{value.split('\n').length} {t('emails.editor.text_lines', 'lines')}</span>
          <span>{value.length} {t('emails.editor.html_characters', 'characters')}</span>
        </div>
      </div>
    </div>
  );
}

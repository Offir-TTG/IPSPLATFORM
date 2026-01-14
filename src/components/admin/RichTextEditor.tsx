'use client';

import { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAdminLanguage } from '@/context/AppContext';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  height?: number;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  variables?: Array<{ name: string; description: string }>;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  description,
  height = 400,
  placeholder,
  dir = 'ltr',
  variables = [],
}: RichTextEditorProps) {
  const { t } = useAdminLanguage();
  const editorRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Insert variable at cursor position
  const insertVariable = (variableName: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(`{{${variableName}}}`);
      editorRef.current.focus();
    }
  };

  if (!mounted) {
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
        <div className="border rounded-md p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

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

      {/* TinyMCE Editor */}
      <div className="border rounded-md overflow-hidden" dir={dir}>
        <Editor
          onInit={(_evt, editor) => (editorRef.current = editor)}
          value={value}
          onEditorChange={onChange}
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          init={{
            height,
            menubar: true,
            promotion: false,
            plugins: [
              'advlist',
              'autolink',
              'lists',
              'link',
              'image',
              'charmap',
              'preview',
              'anchor',
              'searchreplace',
              'visualblocks',
              'code',
              'fullscreen',
              'insertdatetime',
              'media',
              'table',
              'help',
              'wordcount',
              'directionality',
            ],
            toolbar:
              'undo redo | blocks | bold italic underline strikethrough | ' +
              'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
              'bullist numlist outdent indent | link image media table | ' +
              'ltr rtl | code fullscreen | removeformat help',
            content_style: `
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                direction: ${dir};
                text-align: ${dir === 'rtl' ? 'right' : 'left'};
              }
              * {
                direction: ${dir};
              }
            `,
            directionality: dir,
            placeholder: placeholder || 'Start typing...',
            branding: false,
            resize: true,
            min_height: 300,
            max_height: 800,
            // Allow all HTML elements and attributes for email templates
            extended_valid_elements: '*[*]',
            valid_children: '+body[style]',
            verify_html: false,
            // Email-specific settings
            body_class: 'email-body',
            content_css: false,
            // Paste settings
            paste_as_text: false,
            paste_webkit_styles: 'all',
            paste_merge_formats: true,
            // Link settings
            link_default_target: '_blank',
            link_title: false,
            // Image settings
            image_advtab: true,
            image_caption: true,
            // Table settings
            table_default_attributes: {
              border: '0',
            },
            table_default_styles: {
              width: '100%',
            },
            // Custom formats for email
            style_formats: [
              { title: 'Headings', items: [
                { title: 'Heading 1', format: 'h1' },
                { title: 'Heading 2', format: 'h2' },
                { title: 'Heading 3', format: 'h3' },
                { title: 'Heading 4', format: 'h4' },
              ]},
              { title: 'Inline', items: [
                { title: 'Bold', format: 'bold' },
                { title: 'Italic', format: 'italic' },
                { title: 'Underline', format: 'underline' },
                { title: 'Strikethrough', format: 'strikethrough' },
              ]},
              { title: 'Blocks', items: [
                { title: 'Paragraph', format: 'p' },
                { title: 'Blockquote', format: 'blockquote' },
                { title: 'Div', format: 'div' },
                { title: 'Pre', format: 'pre' },
              ]},
            ],
          }}
        />
      </div>

      {/* Character/Word Count */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('emails.editor.html_saved', 'HTML content will be saved')}</span>
        <span>{value.length} {t('emails.editor.html_characters', 'characters')}</span>
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value?: string;
  content?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dir?: 'ltr' | 'rtl';
  id?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  content,
  onChange,
  placeholder,
  className = '',
  dir = 'ltr',
  id,
  minHeight = '200px',
}) => {
  // Use content if provided, otherwise use value
  const editorValue = content ?? value ?? '';
  // Dynamically import ReactQuill to avoid SSR issues
  const ReactQuill = useMemo(
    () => dynamic(() => import('react-quill'), { ssr: false }),
    []
  );

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'align',
    'link',
  ];

  return (
    <div className={`rich-text-editor ${className}`} dir={dir} id={id} style={{ minHeight }}>
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background"
      />
      <style jsx global>{`
        .rich-text-editor .quill {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
        }

        .rich-text-editor .ql-toolbar {
          background: hsl(var(--muted));
          border: none;
          border-bottom: 1px solid hsl(var(--border));
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }

        .rich-text-editor .ql-container {
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
        }

        .rich-text-editor .ql-editor {
          min-height: 150px;
          max-height: 300px;
          overflow-y: auto;
          color: hsl(var(--foreground));
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }

        .rich-text-editor .ql-stroke {
          stroke: hsl(var(--foreground));
        }

        .rich-text-editor .ql-fill {
          fill: hsl(var(--foreground));
        }

        .rich-text-editor .ql-picker-label {
          color: hsl(var(--foreground));
        }

        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button:focus,
        .rich-text-editor .ql-toolbar button.ql-active {
          color: hsl(var(--primary));
        }

        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }

        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button:focus .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary));
        }

        /* RTL support */
        .rich-text-editor[dir='rtl'] .ql-editor {
          direction: rtl;
          text-align: right;
        }

        .rich-text-editor[dir='rtl'] .ql-editor.ql-blank::before {
          text-align: right;
          right: 15px;
          left: auto;
        }

        .rich-text-editor[dir='rtl'] .ql-toolbar {
          direction: rtl;
        }

        .rich-text-editor[dir='rtl'] .ql-editor ul,
        .rich-text-editor[dir='rtl'] .ql-editor ol {
          padding-right: 1.5em;
          padding-left: 0;
        }

        .rich-text-editor[dir='rtl'] .ql-editor p,
        .rich-text-editor[dir='rtl'] .ql-editor h1,
        .rich-text-editor[dir='rtl'] .ql-editor h2,
        .rich-text-editor[dir='rtl'] .ql-editor h3 {
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export { RichTextEditor };
export default RichTextEditor;

'use client';

/**
 * The message editor of a reminder step: bold, italic and lists, and a row
 * of "+ detail" chips that put a detail ({שם}, {סכום}) where the cursor is.
 * The client gets the detail filled in.
 */

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

export function MessageEditor({
  value,
  onChange,
  details,
  invalid,
  id,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Label shown on the chip, and the text it inserts. */
  details: { label: string; insert: string }[];
  invalid?: boolean;
  id?: string;
}) {
  const { t } = useAdminLanguage();
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, codeBlock: false, code: false, blockquote: false, horizontalRule: false, strike: false })],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[160px] px-3 py-2.5 text-[15px] leading-relaxed focus:outline-none dark:prose-invert',
        dir: 'rtl',
        ...(id ? { id } : {}),
        'aria-label': t('admin.reminders.step.message', 'Message'),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '', false);
  }, [value, editor]);

  const tool = (on: boolean) =>
    `grid h-9 w-9 place-items-center rounded-md ${on ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-muted'}`;

  return (
    <div className="grid gap-2">
      <div className={`overflow-hidden rounded-lg border bg-card ${invalid ? 'border-red-500' : 'border-border focus-within:border-primary'}`}>
        <div className="flex gap-1 border-b border-border bg-muted/40 p-1.5" role="toolbar" aria-label={t('admin.reminders.step.format', 'Format')}>
          <button type="button" className={tool(!!editor?.isActive('bold'))} onClick={() => editor?.chain().focus().toggleBold().run()} aria-label={t('admin.reminders.step.bold', 'Bold')}>
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" className={tool(!!editor?.isActive('italic'))} onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label={t('admin.reminders.step.italic', 'Italic')}>
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" className={tool(!!editor?.isActive('bulletList'))} onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label={t('admin.reminders.step.list', 'List')}>
            <List className="h-4 w-4" />
          </button>
          <button type="button" className={tool(!!editor?.isActive('orderedList'))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label={t('admin.reminders.step.numbered', 'Numbered list')}>
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
      {details.length > 0 && (
        <div>
          <p className="mb-1.5 text-[13px] text-muted-foreground">{t('admin.reminders.step.addDetail', 'Add a detail where the cursor is')}</p>
          <div className="flex flex-wrap gap-1.5">
            {details.map((d) => (
              <button
                key={d.insert}
                type="button"
                onClick={() => editor?.chain().focus().insertContent(d.insert).run()}
                className="inline-flex min-h-9 items-center rounded-full border border-primary/30 bg-primary/5 px-3 text-[13px] font-semibold text-primary hover:bg-primary/10"
              >
                + {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ImageIcon, Loader2, Pencil, X } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAdminLanguage } from '@/context/AppContext';

/**
 * The admin drawer template, the same one the Products drawer uses:
 * a pinned top (status line, picture or icon, name, three numbers), a
 * scrolling middle of sections, and the item's actions pinned at the
 * bottom. Opens from the end side (left in Hebrew).
 */

export const drawerButton =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-card px-3 text-sm font-semibold text-primary transition-colors hover:bg-muted disabled:opacity-60';
export const drawerPrimary =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90';

export function DrawerShell({
  open,
  onClose,
  status,
  statusDot,
  lead,
  title,
  subtitle,
  description,
  stats,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  /** The small line above the name, e.g. "Program · Active". */
  status: ReactNode;
  /** Tailwind colour class for the dot before the status line. */
  statusDot: string;
  /** Picture or icon tile beside the name. */
  lead: ReactNode;
  title: string;
  /** An optional line under the name (e.g. who the item belongs to). */
  subtitle?: ReactNode;
  /** Read by screen readers only. */
  description: string;
  stats: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  /** A wider drawer (560px instead of 480px) for content that needs the room. */
  wide?: boolean;
}) {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest?.('[role="region"], li[role="status"], [data-radix-toast-viewport]')) e.preventDefault();
        }}
        className={`flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] ${wide ? 'sm:max-w-[560px]' : 'sm:max-w-[480px]'} [&>[data-default-close]]:hidden`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        {open && (
          <>
            <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
              <p className="inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${statusDot}`} aria-hidden />
                {status}
              </p>
              <div className="mt-1.5 flex items-center gap-3 pe-10">
                {lead}
                <SheetTitle className="min-w-0 text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]">
                  <bdi>{title}</bdi>
                </SheetTitle>
              </div>
              {subtitle && <p className="mt-1 pe-10 text-[13.5px] text-muted-foreground [overflow-wrap:anywhere]">{subtitle}</p>}
              <SheetDescription className="sr-only">{description}</SheetDescription>
              <div className="mt-4 grid grid-cols-3 gap-2">{stats}</div>
            </header>
            <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">{children}</div>
            <footer className="grid shrink-0 gap-2 border-t border-border bg-card px-6 py-4">{footer}</footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Picture of the item, or an icon when it has none. */
export function DrawerLead({ imageUrl, icon }: { imageUrl?: string | null; icon: ReactNode }) {
  return (
    <span className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-primary" aria-hidden>
      {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : icon}
    </span>
  );
}

export function DrawerStat({ label, value, small, className = '' }: { label: string; value: string; small?: boolean; className?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="truncate text-[12.5px] text-muted-foreground">{label}</div>
      <div className={`truncate font-extrabold tabular-nums ${small ? 'text-base' : 'text-xl'} ${className}`} title={value}>
        {value}
      </div>
    </div>
  );
}

export function DrawerSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-border">
      <div className="flex items-center justify-between gap-2 bg-primary/[0.06] px-3.5 py-1.5">
        <h3 className="py-1 text-sm font-bold text-primary [font-family:inherit]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DrawerDetails({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="m-0 divide-y divide-border px-3.5 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="m-0 min-w-0 font-medium [overflow-wrap:anywhere]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A rich-text description. Long text is shown up to a set height with
 * "Show more" (cutting HTML to a number of lines made paragraphs overlap).
 * The HTML is the admin's own saved text.
 */
export function DrawerDescription({ html }: { html: string }) {
  const { t } = useAdminLanguage();
  const box = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    setOpen(false);
    const el = box.current;
    setLong(!!el && el.scrollHeight > 200);
  }, [html]);
  return (
    <div className="p-3.5">
      <div className="relative">
        <div
          ref={box}
          className={`prose prose-sm max-w-none text-sm text-foreground/85 dark:prose-invert [overflow-wrap:anywhere] ${long && !open ? 'max-h-[180px] overflow-hidden' : ''}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {long && !open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" aria-hidden />}
      </div>
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1.5 min-h-9 text-sm font-semibold text-primary hover:underline">
          {open ? t('common.show_less', 'Show less') : t('common.show_more', 'Show more')}
        </button>
      )}
    </div>
  );
}

const isEmptyHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export interface DrawerEditValues {
  name: string;
  description: string;
  /** A new picture to upload, or null to keep the current one. */
  imageFile: File | null;
  /** True when the picture was removed. */
  removeImage: boolean;
}

/**
 * The item's name, picture and description, editable in place from the
 * drawer. The section shows the description; Edit opens a name field, the
 * picture (replace or remove, checked before upload) and the rich text
 * editor, with Save and Cancel. A missing name stops Save with the reason
 * in red. `onSave` returns whether it worked; the editor stays open if not.
 */
export function DrawerQuickEdit({
  title,
  nameLabel,
  name,
  imageUrl,
  html,
  maxImageBytes,
  onSave,
}: {
  title: string;
  nameLabel: string;
  name: string;
  imageUrl: string | null | undefined;
  html: string;
  maxImageBytes: number;
  onSave: (values: DrawerEditValues) => Promise<boolean>;
}) {
  const { t, direction } = useAdminLanguage();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draft, setDraft] = useState(html);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; image?: string }>({});
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const empty = isEmptyHtml(html);

  const start = () => {
    setDraftName(name);
    setDraft(html);
    setImageFile(null);
    setPreview(imageUrl ?? null);
    setRemoveImage(false);
    setErrors({});
    setEditing(true);
  };

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setErrors((x) => ({ ...x, image: t('admin.programs.form.imageType', 'Choose a PNG, JPG, GIF or WEBP picture.') }));
      return;
    }
    if (file.size > maxImageBytes) {
      setErrors((x) => ({
        ...x,
        image: t('admin.drawer.imageTooBig', 'This picture is larger than {mb}MB. Choose a smaller one.').replace(
          '{mb}',
          String(Math.round(maxImageBytes / 1024 / 1024)),
        ),
      }));
      return;
    }
    setErrors((x) => ({ ...x, image: undefined }));
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!draftName.trim()) {
      setErrors((x) => ({ ...x, name: t('admin.drawer.nameRequired', 'Write a name.') }));
      return;
    }
    setSaving(true);
    let ok = false;
    try {
      ok = await onSave({ name: draftName.trim(), description: isEmptyHtml(draft) ? '' : draft.trim(), imageFile, removeImage });
    } catch {
      ok = false;
    } finally {
      setSaving(false);
    }
    if (ok) setEditing(false);
  };

  const errorText = (msg?: string) =>
    msg ? (
      <p role="alert" className="text-[13px] font-semibold text-red-700 dark:text-red-400">
        {msg}
      </p>
    ) : null;

  return (
    <DrawerSection
      title={editing ? t('admin.drawer.editTitle', 'Name, picture and description') : title}
      action={
        !editing && (
          <button type="button" onClick={start} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-primary hover:bg-primary/10">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t('admin.drawer.editDescription', 'Edit')}
          </button>
        )
      }
    >
      {editing ? (
        <div className="space-y-4 p-3.5">
          <div className="grid gap-1.5 text-sm">
            <label htmlFor="drawer-edit-name" className="font-semibold">
              {nameLabel}
              <span className="text-red-600"> *</span>
            </label>
            <input
              id="drawer-edit-name"
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
              }}
              dir={direction}
              aria-invalid={!!errors.name}
              className={`h-11 w-full rounded-lg border bg-card px-3 text-foreground outline-none focus:border-primary ${
                errors.name ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20' : 'border-border'
              }`}
            />
            {errorText(errors.name)}
          </div>

          <div className="grid gap-1.5 text-sm">
            <span className="font-semibold">{t('admin.drawer.picture', 'Picture')}</span>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-2.5">
              <span className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5" aria-hidden />}
              </span>
              <div className="flex flex-wrap items-center gap-x-3">
                <button type="button" onClick={() => fileInput.current?.click()} className="min-h-[40px] text-sm font-semibold text-primary hover:underline">
                  {preview ? t('admin.programs.form.replaceImage', 'Replace picture') : t('admin.programs.form.addImage', 'Add a picture')}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setPreview(null);
                      setRemoveImage(true);
                    }}
                    className="min-h-[40px] text-sm font-semibold text-red-600 hover:underline"
                  >
                    {t('admin.programs.form.removeImage', 'Remove')}
                  </button>
                )}
              </div>
              <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} onChange={pick} className="hidden" />
            </div>
            {errorText(errors.image)}
          </div>

          <div className="grid gap-1.5 text-sm">
            <span className="font-semibold">{title}</span>
            <RichTextEditor value={draft} onChange={setDraft} dir={direction} />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t('common.save', 'Save')}
            </button>
          </div>
        </div>
      ) : empty ? (
        <p className="p-3.5 text-sm text-muted-foreground">{t('admin.drawer.noDescription', 'No description yet.')}</p>
      ) : (
        <DrawerDescription html={html} />
      )}
    </DrawerSection>
  );
}

/** A request that gives up after `ms` instead of waiting forever. */
async function fetchWithLimit(url: string, init: RequestInit, ms: number, step: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    throw new Error(ctrl.signal.aborted ? `${step}: timed out` : `${step}: ${err instanceof Error ? err.message : 'network error'}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Saves a drawer quick edit: uploads a new picture first (nothing is saved
 * if that fails), saves the item, then deletes the picture it no longer
 * uses. Returns the saved fields, or throws with a message to show.
 */
export async function saveDrawerEdit({
  values,
  currentImageUrl,
  uploadUrl,
  uploadIdField,
  itemId,
  patchUrl,
  nameField,
}: {
  values: DrawerEditValues;
  currentImageUrl: string | null | undefined;
  uploadUrl: string;
  uploadIdField: string;
  itemId: string;
  patchUrl: string;
  nameField: string;
}): Promise<{ name: string; description: string | null; image_url: string | null }> {
  let imageUrl: string | null = values.removeImage ? null : currentImageUrl ?? null;
  if (values.imageFile) {
    const fd = new FormData();
    fd.append('file', values.imageFile);
    fd.append(uploadIdField, itemId);
    const up = await fetchWithLimit(uploadUrl, { method: 'POST', body: fd }, 60000, 'picture upload');
    const upResult = await up.json().catch(() => ({}));
    if (!up.ok || !upResult.success || !upResult.url) throw new Error(`picture upload: ${upResult.error || up.status}`);
    imageUrl = upResult.url;
  }
  const res = await fetchWithLimit(
    patchUrl,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [nameField]: values.name, description: values.description || null, image_url: imageUrl }),
    },
    30000,
    'saving',
  );
  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.success) throw new Error(`saving: ${typeof result.error === 'string' ? result.error : res.status}`);
  if (currentImageUrl && currentImageUrl !== imageUrl) {
    void fetch(uploadUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: currentImageUrl }),
    }).catch(() => undefined);
  }
  return { name: values.name, description: values.description || null, image_url: imageUrl };
}

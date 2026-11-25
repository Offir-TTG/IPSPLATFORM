'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/**
 * The product's picture, shown on its card in the client portal (the portal
 * takes it from the product only, not from the course or program inside).
 * Same look as the course picture. The file is uploaded when chosen; the product keeps its address in
 * metadata.image_url, saved with the rest of the product.
 */
export function ProductImageField({ value, onChange, productId, t }: {
  value: string | null;
  onChange: (url: string | null) => void;
  productId?: string;
  t: (key: string, fallback: string) => string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError(t('admin.courses.form.imageType', 'Choose a PNG, JPG, GIF or WEBP picture.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t('admin.courses.form.imageSize', 'This picture is larger than 20MB. Choose a smaller one.'));
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('courseId', `product-${productId ?? 'new'}`);
      const res = await fetch('/api/lms/courses/upload-image', { method: 'POST', body: fd });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success || !result.url) throw new Error();
      onChange(result.url);
    } catch {
      setError(t('admin.courses.form.imageUploadError', 'The picture was not uploaded'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label suppressHydrationWarning>{t('products.cardImage', 'Product picture')}</Label>
      <div className="mt-1.5 flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-3">
        <span className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10 text-primary">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          ) : value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-7 w-7" aria-hidden />
          )}
        </span>
        <div className="flex flex-wrap items-center gap-x-4">
          <button type="button" disabled={uploading} onClick={() => input.current?.click()} className="min-h-[44px] text-sm font-semibold text-primary hover:underline disabled:opacity-50">
            {value ? t('admin.programs.form.replaceImage', 'Replace picture') : t('admin.programs.form.addImage', 'Add a picture')}
          </button>
          {value && !uploading && (
            <button type="button" onClick={() => onChange(null)} className="min-h-[44px] text-sm font-semibold text-red-600 hover:underline">
              {t('admin.programs.form.removeImage', 'Remove')}
            </button>
          )}
        </div>
        <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} onChange={pick} className="hidden" />
      </div>
      {error ? (
        <p className="text-sm text-destructive mt-1">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
          {t('products.cardImageHint', "Shown on this product's card in the client portal. PNG, JPG, GIF or WEBP, up to 20MB.")}
        </p>
      )}
    </div>
  );
}

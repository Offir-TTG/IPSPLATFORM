'use client';

import { useEffect, useState } from 'react';
import { useAdminLanguage } from '@/context/AppContext';

type TagInfo = { he: string | null; en: string | null; color: string | null };

// One load per page view, shared by every component that shows tags.
let cache: Promise<Map<string, TagInfo>> | null = null;
function loadTags(): Promise<Map<string, TagInfo>> {
  if (!cache) {
    cache = fetch('/api/admin/crm/tags')
      .then((r) => r.json())
      .then((j) =>
        j?.success
          ? new Map<string, TagInfo>((j.tags ?? []).map((x: any) => [x.slug, { he: x.label_he ?? null, en: x.label_en ?? null, color: x.category?.color ?? null }]))
          : new Map<string, TagInfo>(),
      )
      .catch(() => {
        cache = null; // try again next time
        return new Map<string, TagInfo>();
      });
  }
  return cache;
}

/**
 * CRM tag names (from the marketing site's CRM, via /api/admin/crm/tags) in
 * the admin's language. `label(slug)` falls back to the slug when the CRM
 * can't be reached or doesn't know the tag; `color(slug)` is its group's colour.
 */
export function useCrmTagNames() {
  const { language } = useAdminLanguage();
  const [tags, setTags] = useState<Map<string, TagInfo>>(new Map());
  useEffect(() => {
    let alive = true;
    void loadTags().then((m) => alive && setTags(m));
    return () => {
      alive = false;
    };
  }, []);
  const label = (slug: string) => {
    const t = tags.get(slug);
    const name = language === 'he' ? t?.he || t?.en : t?.en || t?.he;
    return name?.trim() || slug;
  };
  const color = (slug: string) => tags.get(slug)?.color ?? null;
  return { label, color };
}

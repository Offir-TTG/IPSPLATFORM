'use client';

import * as React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Search,
  FileText,
  X,
  Clock,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  CornerUpLeft,
} from 'lucide-react';
import { useHelpContext } from '@/context/HelpContext';
import { useAdminLanguage } from '@/context/AppContext';
import { MiniMarkdown } from './MiniMarkdown';

/**
 * Modern help drawer with:
 *  • Debounced smart search (Postgres FTS + trigram, no AI) — typing a
 *    question fetches ranked articles with <mark>-highlighted snippets.
 *  • Prerequisites and Next steps cards — rendered above and below
 *    the article body so the admin always sees what to do before and
 *    what comes after.
 *  • Browse-all index view with category groupings (when search is empty).
 *
 * All content stays within this drawer; no separate pages.
 */

interface ArticleListItem {
  slug: string;
  title: string;
  category: string | null;
  display_order?: number;
  page_slugs?: string[];
  updated_at: string;
}

interface SearchResult extends ArticleListItem {
  snippet: string;
  match_score: number;
}

interface ArticleDetail {
  slug: string;
  title: string;
  body_markdown: string;
  category: string | null;
  updated_at: string;
  locale: string;
  requested_locale: string;
}

interface RefRow {
  slug: string;
  title: string;
  category: string | null;
}

interface ArticlePayload {
  article: ArticleDetail;
  related: RefRow[];
  prerequisites: RefRow[];
  next_steps: RefRow[];
}

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

export function HelpDrawer() {
  const { isOpen, closeDrawer, activeSlug, setActiveSlug } = useHelpContext();
  const { t, direction, language } = useAdminLanguage();
  const isRtl = direction === 'rtl';

  const [articleCache, setArticleCache] = React.useState<Record<string, ArticlePayload>>({});
  const [listCache, setListCache] = React.useState<ArticleListItem[] | null>(null);

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[] | null>(null);
  const [searching, setSearching] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Debounce the search input
  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  // Article fetch — populates prerequisites + next_steps too
  React.useEffect(() => {
    if (!isOpen || !activeSlug) return;
    const cacheKey = `${activeSlug}::${language}`;
    if (articleCache[cacheKey]) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `/api/admin/help/articles/${encodeURIComponent(activeSlug)}?locale=${language}`,
      { cache: 'no-store' }
    )
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setError(res.error || 'Failed to load');
          return;
        }
        setArticleCache((prev) => ({
          ...prev,
          [cacheKey]: {
            article: res.data.article,
            related: res.data.related ?? [],
            prerequisites: res.data.prerequisites ?? [],
            next_steps: res.data.next_steps ?? [],
          },
        }));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeSlug, language, articleCache]);

  // Browse index fetch
  React.useEffect(() => {
    if (!isOpen || activeSlug !== null) return;
    if (listCache) return;
    if (debouncedSearch.length >= MIN_SEARCH_LENGTH) return; // search takes over

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/help/articles?locale=${language}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setError(res.error || 'Failed to load');
          return;
        }
        setListCache(res.data.articles);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeSlug, language, listCache, debouncedSearch]);

  // Search fetch — fires whenever debounced query crosses the threshold
  React.useEffect(() => {
    if (!isOpen || activeSlug !== null) return;
    if (debouncedSearch.length < MIN_SEARCH_LENGTH) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    fetch(
      `/api/admin/help/articles?locale=${language}&search=${encodeURIComponent(debouncedSearch)}`,
      { cache: 'no-store' }
    )
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setError(res.error || 'Search failed');
          return;
        }
        setSearchResults(res.data.articles);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeSlug, language, debouncedSearch]);

  // Reset locale-dependent caches when language changes
  React.useEffect(() => {
    setListCache(null);
    setSearchResults(null);
  }, [language]);

  // Clear search when navigating into an article
  React.useEffect(() => {
    if (activeSlug) {
      setSearch('');
      setDebouncedSearch('');
    }
  }, [activeSlug]);

  const cacheKey = activeSlug ? `${activeSlug}::${language}` : null;
  const currentArticle = cacheKey ? articleCache[cacheKey] : null;

  const grouped = React.useMemo(() => {
    if (!listCache) return null;
    const groups: { category: string; items: ArticleListItem[] }[] = [];
    const seen = new Map<string, ArticleListItem[]>();
    for (const item of listCache) {
      const cat = item.category || (isRtl ? 'כללי' : 'General');
      let bucket = seen.get(cat);
      if (!bucket) {
        bucket = [];
        seen.set(cat, bucket);
        groups.push({ category: cat, items: bucket });
      }
      bucket.push(item);
    }
    return groups;
  }, [listCache, isRtl]);

  const BackChevron = isRtl ? ChevronRight : ChevronLeft;
  const ForwardChevron = isRtl ? ChevronLeft : ChevronRight;

  const isSearchMode = !activeSlug && debouncedSearch.length >= MIN_SEARCH_LENGTH;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side={isRtl ? 'left' : 'right'}
        className="w-full sm:max-w-md md:max-w-lg flex flex-col gap-0 p-0 [&>button]:hidden"
      >
        {/* HERO HEADER */}
        <div className="relative shrink-0 overflow-hidden border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-primary/70">
                    {t('admin.help.helpCenter', 'Help Center')}
                  </p>
                  <h2 className="text-base font-semibold leading-tight text-foreground">
                    {activeSlug && currentArticle
                      ? currentArticle.article.title
                      : t('admin.help.title', 'Help & Documentation')}
                  </h2>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDrawer}
                className="h-8 w-8 shrink-0 rounded-lg hover:bg-foreground/5"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {activeSlug && (
              <button
                onClick={() => setActiveSlug(null)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-background hover:text-foreground"
              >
                <BackChevron className="h-3.5 w-3.5" />
                {t('admin.help.browseAll', 'Browse all topics')}
              </button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading && <LoadingSkeleton mode={activeSlug ? 'article' : 'index'} />}

          {error && !loading && (
            <div className="m-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ARTICLE VIEW */}
          {!loading && !error && activeSlug && currentArticle && (
            <article className="px-5 py-5">
              {currentArticle.article.category && (
                <Badge variant="secondary" className="mb-3 font-medium">
                  {currentArticle.article.category}
                </Badge>
              )}

              {/* Prerequisites cards — what to do FIRST */}
              {currentArticle.prerequisites.length > 0 && (
                <DependencyCards
                  title={t('admin.help.prerequisites', 'Before you start')}
                  subtitle={t(
                    'admin.help.prerequisitesHint',
                    'Complete these articles first.'
                  )}
                  icon={CornerUpLeft}
                  variant="prereq"
                  items={currentArticle.prerequisites}
                  onSelect={setActiveSlug}
                  isRtl={isRtl}
                />
              )}

              <MiniMarkdown source={currentArticle.article.body_markdown} />

              {/* Next steps cards — what to do AFTER */}
              {currentArticle.next_steps.length > 0 && (
                <DependencyCards
                  title={t('admin.help.nextSteps', "What's next")}
                  subtitle={t(
                    'admin.help.nextStepsHint',
                    'Continue with these articles to keep going.'
                  )}
                  icon={CornerDownRight}
                  variant="next"
                  items={currentArticle.next_steps}
                  onSelect={setActiveSlug}
                  isRtl={isRtl}
                />
              )}

              {/* Related cards — lateral references */}
              {currentArticle.related.length > 0 && (
                <div className="mt-8 border-t pt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('admin.help.relatedArticles', 'Related articles')}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {currentArticle.related.map((r) => (
                      <button
                        key={r.slug}
                        onClick={() => setActiveSlug(r.slug)}
                        className="group flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-start transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-foreground/50 group-hover:text-primary transition-colors" />
                          <span className="truncate text-sm font-medium text-foreground/90 group-hover:text-foreground">
                            {r.title}
                          </span>
                        </span>
                        <ForwardChevron className="h-4 w-4 shrink-0 text-foreground/30 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center gap-1.5 text-[11px] text-foreground/50">
                <Clock className="h-3 w-3" />
                <span>
                  {t('admin.help.lastUpdated', 'Last updated')}:{' '}
                  {new Date(currentArticle.article.updated_at).toLocaleDateString(
                    isRtl ? 'he-IL' : 'en-US',
                    { year: 'numeric', month: 'short', day: 'numeric' }
                  )}
                </span>
              </div>
            </article>
          )}

          {/* INDEX / SEARCH VIEW (no active article) */}
          {!loading && !error && !activeSlug && (
            <div className="px-5 py-5 space-y-6">
              {/* Search input — always visible at the top of index */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-foreground/40" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(
                    'admin.help.askQuestion',
                    'Ask a question or search topics...'
                  )}
                  className="ps-9 pe-9 h-10 rounded-lg border-foreground/15 bg-card focus-visible:ring-primary/30"
                />
                {searching && (
                  <Loader2 className="absolute top-2.5 end-3 h-4 w-4 animate-spin text-foreground/40" />
                )}
                {!searching && search.length > 0 && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute top-2.5 end-3 text-foreground/40 hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* SEARCH RESULTS view (when query is active) */}
              {isSearchMode && searchResults !== null && searchResults.length === 0 && !searching && (
                <div className="rounded-lg border border-dashed py-10 text-center">
                  <Search className="mx-auto mb-2 h-6 w-6 text-foreground/30" />
                  <p className="text-sm text-foreground/70">
                    {t('admin.help.noResults', 'No articles match your search.')}
                  </p>
                  <p className="mt-1 text-xs text-foreground/50">
                    {t(
                      'admin.help.searchHint',
                      'Try different keywords or browse all topics below.'
                    )}
                  </p>
                </div>
              )}

              {isSearchMode && searchResults !== null && searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                    {t('admin.help.searchResults', 'Search results')}{' '}
                    <span className="text-foreground/40 font-normal normal-case tracking-normal">
                      · {searchResults.length}
                    </span>
                  </p>
                  {searchResults.map((r) => (
                    <SearchResultCard
                      key={r.slug}
                      result={r}
                      onSelect={() => setActiveSlug(r.slug)}
                      ForwardChevron={ForwardChevron}
                    />
                  ))}
                </div>
              )}

              {/* BROWSE-ALL view (when no search) */}
              {!isSearchMode && grouped && (
                <>
                  {grouped.map(({ category, items }) => (
                    <section key={category}>
                      <div className="mb-2.5 flex items-center gap-2 px-1">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                          {category}
                        </h3>
                        <span className="text-[11px] text-foreground/30">·</span>
                        <span className="text-[11px] text-foreground/40">{items.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <button
                            key={item.slug}
                            onClick={() => setActiveSlug(item.slug)}
                            className="group flex w-full items-center justify-between gap-3 rounded-lg border border-transparent bg-card/40 px-3.5 py-2.5 text-start transition-all hover:border-foreground/10 hover:bg-card hover:shadow-sm"
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <FileText className="h-3.5 w-3.5" />
                              </span>
                              <span className="truncate text-sm font-medium text-foreground/85 group-hover:text-foreground">
                                {item.title}
                              </span>
                            </span>
                            <ForwardChevron className="h-4 w-4 shrink-0 text-foreground/30 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// DependencyCards — used for Prerequisites + Next steps blocks
// ============================================================
function DependencyCards({
  title,
  subtitle,
  icon: Icon,
  variant,
  items,
  onSelect,
  isRtl,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'prereq' | 'next';
  items: RefRow[];
  onSelect: (slug: string) => void;
  isRtl: boolean;
}) {
  const ForwardChevron = isRtl ? ChevronLeft : ChevronRight;
  const isPrereq = variant === 'prereq';
  const wrapperCls = isPrereq
    ? 'mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5'
    : 'mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5';
  const iconCls = isPrereq ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500';
  const numberBgCls = isPrereq
    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';

  return (
    <div className={`${wrapperCls} p-3.5`}>
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconCls}`} />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-[11px] text-foreground/60">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <button
            key={item.slug}
            onClick={() => onSelect(item.slug)}
            className="group flex w-full items-center justify-between gap-3 rounded-lg border border-transparent bg-background/60 px-3 py-2 text-start transition-all hover:border-foreground/10 hover:bg-background hover:shadow-sm"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${numberBgCls}`}
              >
                {idx + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground/90 group-hover:text-foreground">
                  {item.title}
                </span>
                {item.category && (
                  <span className="block truncate text-[11px] text-foreground/50">
                    {item.category}
                  </span>
                )}
              </span>
            </span>
            <ForwardChevron className="h-4 w-4 shrink-0 text-foreground/30 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SearchResultCard — title + category badge + highlighted snippet
// ============================================================
function SearchResultCard({
  result,
  onSelect,
  ForwardChevron,
}: {
  result: SearchResult;
  onSelect: () => void;
  ForwardChevron: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onSelect}
      className="group flex w-full items-start gap-3 rounded-lg border bg-card px-3.5 py-3 text-start transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground mt-0.5">
        <FileText className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 mb-1">
          <span className="truncate text-sm font-semibold text-foreground/90 group-hover:text-foreground">
            {result.title}
          </span>
          {result.category && (
            <Badge variant="secondary" className="text-[10px] font-medium shrink-0">
              {result.category}
            </Badge>
          )}
        </span>
        {result.snippet && (
          <span
            className="block text-xs leading-snug text-foreground/70 [&_mark]:rounded [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:text-foreground dark:[&_mark]:bg-yellow-500/30 line-clamp-3"
            // Snippet HTML is server-trusted: produced by Postgres ts_headline
            // from admin-curated help articles. Only <mark> tags appear.
            dangerouslySetInnerHTML={{ __html: result.snippet }}
          />
        )}
      </span>
      <ForwardChevron className="h-4 w-4 shrink-0 mt-1 text-foreground/30 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
    </button>
  );
}

// ============================================================
// LoadingSkeleton — better than a bare spinner
// ============================================================
function LoadingSkeleton({ mode }: { mode: 'article' | 'index' }) {
  if (mode === 'article') {
    return (
      <div className="px-5 py-5 space-y-3 animate-pulse">
        <div className="h-5 w-20 rounded-full bg-muted/60" />
        <div className="h-3 w-full rounded bg-muted/60" />
        <div className="h-3 w-11/12 rounded bg-muted/60" />
        <div className="h-3 w-10/12 rounded bg-muted/60" />
        <div className="h-3 w-9/12 rounded bg-muted/60" />
        <div className="h-4 w-1/3 rounded bg-muted/60 mt-4" />
        <div className="h-3 w-full rounded bg-muted/60" />
        <div className="h-3 w-10/12 rounded bg-muted/60" />
      </div>
    );
  }
  return (
    <div className="px-5 py-5 space-y-5 animate-pulse">
      <div className="h-10 w-full rounded-lg bg-muted/60" />
      <div>
        <div className="mb-2 h-3 w-24 rounded bg-muted/60" />
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 h-3 w-32 rounded bg-muted/60" />
        <div className="space-y-1.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  );
}

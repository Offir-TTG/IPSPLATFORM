'use client';

import { Button } from '@/components/ui/button';
import { useAdminLanguage } from '@/context/AppContext';

/**
 * Pagination row reused by every user-activity tab that lists rows.
 *
 * Matches the platform convention (same look as /admin/emails/queue,
 * /admin/crons, etc.): "Page X of Y" on the start side, Previous /
 * Next buttons on the end side, stacked vertically with full-width
 * buttons on mobile. Renders nothing if `totalPages <= 1` so callers
 * can drop it in unconditionally.
 */
export function TabPagination({
  page,
  total,
  pageSize,
  onChange,
  loading,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  loading?: boolean;
}) {
  const { t } = useAdminLanguage();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4">
      <div className="text-sm text-muted-foreground">
        {t('common.page', 'Page')} {page} {t('common.of', 'of')} {totalPages}
      </div>
      <div className="flex gap-2 sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-initial"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1 || !!loading}
        >
          {t('common.previous', 'Previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-initial"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || !!loading}
        >
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
}

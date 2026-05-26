'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { TabPagination } from './TabPagination';

interface ConversationRow {
  conversation_id: string;
  name: string;
  unread_count: number;
  last_message_snippet: string | null;
  last_message_at: string | null;
}

const PAGE_SIZE = 20;

export function UserMessagesTab({ userId }: { userId: string }) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const dateLocale = isRtl ? 'he-IL' : undefined;
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
    fetch(`/api/admin/users/${userId}/messages?${qs}`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (cancelled) return;
        setConversations(d.conversations ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, page]);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          {t('admin.users.activity.error', 'Failed to load. Try refreshing the page.')}
        </CardContent>
      </Card>
    );
  }
  if (total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.messages.empty', 'No conversations.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir={direction}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>{t('admin.users.activity.messages.title', 'Conversations')}</span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.messages.count', '{{count}} conversations').replace('{{count}}', String(total))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <ResponsiveTable>
            <ResponsiveTable.Desktop>
              <div className="overflow-x-auto" dir={direction}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.messages.col.name', 'Conversation')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.messages.col.lastMessage', 'Last message')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.messages.col.when', 'When')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-left' : 'text-right'}>
                        {t('admin.users.activity.messages.col.unread', 'Unread')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((c) => (
                      <TableRow key={c.conversation_id} className={c.unread_count > 0 ? 'bg-primary/5' : ''}>
                        <TableCell className="max-w-xs">
                          <p className="font-medium truncate" dir="auto" title={c.name || '—'}>
                            {c.name || '—'}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm text-muted-foreground truncate" dir="auto" title={c.last_message_snippet ?? ''}>
                            {c.last_message_snippet || '—'}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {c.last_message_at
                            ? new Date(c.last_message_at).toLocaleDateString(dateLocale)
                            : '—'}
                        </TableCell>
                        <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                          {c.unread_count > 0 ? (
                            <Badge variant="default" className="tabular-nums" dir="ltr">{c.unread_count}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable.Desktop>

            <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
              {conversations.map((c) => (
                <div key={c.conversation_id} className={`rounded-lg border p-3 space-y-2 ${c.unread_count > 0 ? 'border-primary/40 bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium break-words flex-1" dir="auto">
                      {c.name || '—'}
                    </p>
                    {c.unread_count > 0 && (
                      <Badge variant="default" className="tabular-nums shrink-0" dir="ltr">
                        {c.unread_count}
                      </Badge>
                    )}
                  </div>
                  {c.last_message_snippet && (
                    <p className="text-sm text-muted-foreground break-words line-clamp-2" dir="auto">
                      {c.last_message_snippet}
                    </p>
                  )}
                  {c.last_message_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.last_message_at).toLocaleString(dateLocale)}
                    </p>
                  )}
                </div>
              ))}
            </ResponsiveTable.Mobile>
          </ResponsiveTable>
        </CardContent>
      </Card>

      <TabPagination
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={setPage}
        loading={loading}
      />
    </div>
  );
}

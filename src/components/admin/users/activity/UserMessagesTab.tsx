'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

interface ConversationRow {
  conversation_id: string;
  name: string;
  unread_count: number;
  last_message_snippet: string | null;
  last_message_at: string | null;
}

export function UserMessagesTab({ userId }: { userId: string }) {
  const { t } = useAdminLanguage();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/messages`)
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => { if (!cancelled) setConversations(d.conversations ?? []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
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

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.messages.empty', 'No conversations.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((c) => (
        <Card key={c.conversation_id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium break-words">{c.name}</p>
                </div>
                {c.last_message_snippet && (
                  <p className="text-sm text-muted-foreground mt-1 break-words line-clamp-2">
                    {c.last_message_snippet}
                  </p>
                )}
                {c.last_message_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(c.last_message_at).toLocaleString()}
                  </p>
                )}
              </div>
              {c.unread_count > 0 && (
                <Badge variant="default">
                  {c.unread_count} {t('admin.users.activity.messages.unread', 'Unread').toLowerCase()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

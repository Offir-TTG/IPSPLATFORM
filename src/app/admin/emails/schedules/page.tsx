'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Calendar, Users, Repeat, Mail, Send, ArrowLeft, Pause, Play, Square } from 'lucide-react';
import Link from 'next/link';
import { ScheduleDialog } from '@/components/admin/emails/ScheduleDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ScheduleRow {
  id: string;
  schedule_name: string;
  description: string | null;
  template_id: string;
  recipient_filter: any;
  recipient_ids: string[] | null;
  recipient_count: number;
  scheduled_for: string;
  timezone: string;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'cancelled' | 'failed';
  emails_queued: number;
  emails_sent: number;
  emails_failed: number;
  // Server-computed counts pulled from `email_queue`.
  //   sent_count   → for the "X of Y sent" badge
  //   active_count → anything not 'cancelled' (pending / processing /
  //                  sent / failed / expired). Used to gate Delete:
  //                  any activity blocks hard-delete; the admin must
  //                  Stop the campaign instead.
  sent_count: number;
  active_count: number;
  template: { id: string; template_key: string; template_name: string } | null;
  created_at: string;
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'completed') return 'secondary';
  if (s === 'pending' || s === 'processing') return 'default';
  if (s === 'paused') return 'outline';
  if (s === 'failed' || s === 'cancelled') return 'destructive';
  return 'outline';
}

export default function EmailSchedulesPage() {
  const { t, direction } = useAdminLanguage();
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleRow | null>(null);
  const [deleting, setDeleting] = useState<ScheduleRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  // Generic "this row is busy with a state transition" lock — shared
  // by pause/resume/stop so the button shows a spinner.
  const [actionId, setActionId] = useState<string | null>(null);
  const [stopping, setStopping] = useState<ScheduleRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/emails/schedules');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch {
      toast.error(t('emails.schedules.loadFailed', 'Failed to load schedules'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSendNow = async (id: string) => {
    setSendingId(id);
    try {
      const res = await fetch(`/api/admin/emails/schedules/${id}/send-now`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t('emails.schedules.sendNowFailed', 'Failed to enqueue sends'));
        return;
      }
      toast.success(
        t('emails.schedules.sendNowOk', '{{count}} emails enqueued').replace(
          '{{count}}',
          String(data.enqueued),
        ),
      );
      load();
    } catch {
      toast.error(t('emails.schedules.sendNowFailed', 'Failed to enqueue sends'));
    } finally {
      setSendingId(null);
    }
  };

  const handlePause = async (s: ScheduleRow) => {
    setActionId(s.id);
    try {
      const res = await fetch(`/api/admin/emails/schedules/${s.id}/pause`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || t('emails.schedules.pauseFailed', 'Failed to pause'));
        return;
      }
      toast.success(t('emails.schedules.paused', 'Schedule paused'));
      load();
    } catch {
      toast.error(t('emails.schedules.pauseFailed', 'Failed to pause'));
    } finally {
      setActionId(null);
    }
  };

  const handleResume = async (s: ScheduleRow) => {
    setActionId(s.id);
    try {
      const res = await fetch(`/api/admin/emails/schedules/${s.id}/resume`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || t('emails.schedules.resumeFailed', 'Failed to resume'));
        return;
      }
      toast.success(t('emails.schedules.resumed', 'Schedule resumed'));
      load();
    } catch {
      toast.error(t('emails.schedules.resumeFailed', 'Failed to resume'));
    } finally {
      setActionId(null);
    }
  };

  const handleStop = async () => {
    if (!stopping) return;
    setActionId(stopping.id);
    try {
      const res = await fetch(`/api/admin/emails/schedules/${stopping.id}/stop`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || t('emails.schedules.stopFailed', 'Failed to stop'));
        return;
      }
      toast.success(
        t('emails.schedules.stopped', 'Schedule stopped. {{count}} pending emails cancelled.')
          .replace('{{count}}', String(data?.cancelledQueueRows ?? 0)),
      );
      setStopping(null);
      load();
    } catch {
      toast.error(t('emails.schedules.stopFailed', 'Failed to stop'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/schedules/${deleting.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Server returns 409 + SENT_EMAILS_EXIST when the campaign
        // already sent something — surface its message verbatim.
        toast.error(data?.error || t('emails.schedules.deleteFailed', 'Failed to delete schedule'));
        return;
      }
      toast.success(t('emails.schedules.deleted', 'Schedule deleted'));
      setDeleting(null);
      load();
    } catch {
      toast.error(t('emails.schedules.deleteFailed', 'Failed to delete schedule'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <Link href="/admin/emails">
              <Button variant="ghost" size="sm">
                <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('common.back', 'Back')}</span>
              </Button>
            </Link>
            <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold">
              {t('emails.schedules.title', 'Email Schedules')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('emails.schedules.subtitle', 'Schedule one-off and recurring email campaigns.')}
            </p>
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('emails.schedules.create', 'Create Schedule')}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : schedules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t('emails.schedules.empty', 'No schedules yet. Create one to send a campaign at a future date.')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <span className="break-words">{s.schedule_name}</span>
                        <Badge variant={statusVariant(s.status)}>
                          {t(`emails.schedules.status.${s.status}`, s.status)}
                        </Badge>
                        {s.recurrence_rule && (
                          <Badge variant="outline" className="gap-1">
                            <Repeat className="h-3 w-3" />
                            {t('emails.schedules.recurring', 'Recurring')}
                          </Badge>
                        )}
                      </CardTitle>
                      {s.description && (
                        <p className="text-sm text-muted-foreground mt-1 break-words">{s.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Send Now — only when actively pending */}
                      {s.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendNow(s.id)}
                          disabled={sendingId === s.id || actionId === s.id}
                          title={t('emails.schedules.sendNow', 'Send now')}
                        >
                          {sendingId === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="ml-2 rtl:mr-2 rtl:ml-0 hidden sm:inline">
                            {t('emails.schedules.sendNow', 'Send now')}
                          </span>
                        </Button>
                      )}

                      {/* Pause — only when pending */}
                      {s.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePause(s)}
                          disabled={actionId === s.id}
                          title={t('emails.schedules.pause', 'Pause')}
                        >
                          {actionId === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pause className="h-4 w-4" />
                          )}
                          <span className="ml-2 rtl:mr-2 rtl:ml-0 hidden sm:inline">
                            {t('emails.schedules.pause', 'Pause')}
                          </span>
                        </Button>
                      )}

                      {/* Resume — only when paused */}
                      {s.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResume(s)}
                          disabled={actionId === s.id}
                          title={t('emails.schedules.resume', 'Resume')}
                        >
                          {actionId === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          <span className="ml-2 rtl:mr-2 rtl:ml-0 hidden sm:inline">
                            {t('emails.schedules.resume', 'Resume')}
                          </span>
                        </Button>
                      )}

                      {/* Stop — any non-terminal state */}
                      {(s.status === 'pending' || s.status === 'processing' || s.status === 'paused') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStopping(s)}
                          disabled={actionId === s.id}
                          title={t('emails.schedules.stop', 'Stop')}
                        >
                          <Square className="h-4 w-4" />
                          <span className="ml-2 rtl:mr-2 rtl:ml-0 hidden sm:inline">
                            {t('emails.schedules.stop', 'Stop')}
                          </span>
                        </Button>
                      )}

                      {/* Edit — pending, paused, or failed (retry path) */}
                      {(s.status === 'pending' || s.status === 'paused' || s.status === 'failed') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditing(s); setDialogOpen(true); }}
                          title={t('common.edit', 'Edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Delete — the rule is dead simple: only
                          allowed once the schedule is `cancelled`
                          (admin clicked Stop). Any other status
                          (pending / processing / paused / completed /
                          failed) means there's either active work
                          or a real audit trail to preserve. */}
                      {s.status === 'cancelled' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(s)}
                          title={t('common.delete', 'Delete')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          title={t('emails.schedules.deleteBlockedStatus', 'Cannot delete — Stop the campaign first.')}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground opacity-50" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">{t('emails.schedules.template', 'Template')}</p>
                      <p className="font-medium mt-1 truncate">
                        {s.template
                          ? t(
                              `email_template.${s.template.template_key.replace(/\./g, '_')}.name`,
                              s.template.template_name,
                            )
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t('emails.schedules.next_run', 'Next Run')}
                      </p>
                      <p className="font-medium mt-1">
                        {s.status === 'completed' ? '—' : new Date(s.scheduled_for).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t('emails.schedules.recipients', 'Recipients')}
                      </p>
                      <p className="font-medium mt-1">
                        {s.recipient_count ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('emails.schedules.emails_sent', 'Sent')}</p>
                      <p className="font-medium mt-1">
                        {s.sent_count ?? 0} / {s.emails_queued}
                        {s.emails_failed > 0 && (
                          <span className="text-destructive ml-2">
                            ({s.emails_failed} {t('emails.schedules.failed', 'failed')})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        schedule={editing}
        onSaved={() => { setDialogOpen(false); setEditing(null); load(); }}
      />

      <AlertDialog open={!!stopping} onOpenChange={(open) => !open && setStopping(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('emails.schedules.stop', 'Stop Schedule')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'emails.schedules.stopConfirm',
                'This will cancel all pending emails for this schedule and mark it as cancelled. Already-sent emails are unaffected. Stopped schedules cannot be resumed.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleStop} disabled={actionId === stopping?.id} className="bg-destructive hover:bg-destructive/90">
              {actionId === stopping?.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('emails.schedules.stop', 'Stop')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('emails.schedules.delete', 'Delete Schedule')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('emails.schedules.deleteConfirm', 'This will permanently delete the stopped campaign. Already-sent / cancelled emails in the queue stay as history.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive hover:bg-destructive/90">
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

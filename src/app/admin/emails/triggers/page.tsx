'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Power, PowerOff, Pencil, Trash2, TestTube, X, Check } from 'lucide-react';
import { EmailTrigger } from '@/types/email';
import { CreateTriggerDialog } from '@/components/email/CreateTriggerDialog';
import { TestTriggerDialog } from '@/components/email/TestTriggerDialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function TriggersPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const [triggers, setTriggers] = useState<EmailTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<EmailTrigger | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingTrigger, setTestingTrigger] = useState<EmailTrigger | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTrigger, setDeletingTrigger] = useState<EmailTrigger | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadTriggers();
    loadAdminEmail();
  }, []);

  const loadAdminEmail = async () => {
    try {
      // Get current user from Supabase client
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        setAdminEmail(user.email);
      }
    } catch (error) {
      console.error('Error loading admin email:', error);
    }
  };

  const loadTriggers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/emails/triggers');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setTriggers(data.triggers || []);
    } catch (error: any) {
      console.error('Error loading triggers:', error);
      toast.error(t('emails.triggers.loadFailed', 'Failed to load triggers'));
    } finally {
      setLoading(false);
    }
  };

  const toggleTrigger = async (trigger: EmailTrigger) => {
    try {
      const response = await fetch(`/api/admin/emails/triggers/${trigger.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !trigger.is_active }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(trigger.is_active ? t('emails.triggers.deactivated', 'Trigger deactivated') : t('emails.triggers.activated', 'Trigger activated'));
      await loadTriggers();
    } catch (error: any) {
      console.error('Error toggling trigger:', error);
      toast.error(t('emails.triggers.toggleFailed', 'Failed to toggle trigger'));
    }
  };

  const handleDeleteTrigger = async () => {
    if (!deletingTrigger) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/emails/triggers/${deletingTrigger.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(t('emails.triggers.deleted', 'Trigger deleted successfully'));
      setShowDeleteDialog(false);
      setDeletingTrigger(null);
      await loadTriggers();
    } catch (error: any) {
      console.error('Error deleting trigger:', error);
      toast.error(t('emails.triggers.deleteFailed', 'Failed to delete trigger'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const testTrigger = async (trigger: EmailTrigger) => {
    setTestingTrigger(trigger);
    setTestDialogOpen(true);
  };

  const handleTestTriggerWithEmail = async (testEmail: string) => {
    if (!testingTrigger) return;

    try {
      const sampleData = getSampleEventData(testingTrigger.trigger_event);

      console.log('🔵 Client: Sending test request with email:', testEmail);

      const response = await fetch(`/api/admin/emails/triggers/${testingTrigger.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventData: sampleData,
          testEmail: testEmail, // Pass the email from dialog
        }),
      });

      const data = await response.json();
      console.log('🔵 Client: Received response:', data);

      if (!response.ok) throw new Error(data.error);

      if (data.results.emailSent) {
        // Email was actually sent - show where it was sent
        const sentTo = data.results.emailSentTo || testEmail;
        const wouldSendTo = data.results.recipient?.email;
        toast.success(
          `${t('emails.triggers.testEmailSent', 'Test email sent to')} ${sentTo}. ` +
          `${t('emails.triggers.productionRecipient', 'In production would be sent to:')} ${wouldSendTo}`
        );
      } else if (data.results.wouldSend) {
        // Email would send but wasn't actually sent (dry run)
        toast.success(t('emails.triggers.testSuccess', 'Trigger test successful! Email would be sent to: ') + data.results.recipient?.email);
      } else {
        toast.warning(t('emails.triggers.testNoSend', 'Test completed but email would not be sent. Check conditions.'));
      }
    } catch (error: any) {
      console.error('Error testing trigger:', error);
      toast.error(t('emails.triggers.testFailed', 'Failed to test trigger'));
      throw error; // Re-throw so dialog can handle it
    }
  };

  const getSampleEventData = (eventType: string): Record<string, any> => {
    const baseData = {
      userId: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
      userName: 'Test User',
      languageCode: 'en',
    };

    switch (eventType) {
      case 'enrollment.created':
      case 'enrollment.completed':
        return {
          ...baseData,
          enrollmentId: '00000000-0000-0000-0000-000000000000',
          productId: '00000000-0000-0000-0000-000000000000',
          productName: 'Sample Course',
          productType: 'course',
          totalAmount: 1000,
          currency: 'USD',
          paymentStatus: 'pending',
        };
      case 'payment.completed':
        return {
          ...baseData,
          paymentId: 'pi_test123',
          enrollmentId: '00000000-0000-0000-0000-000000000000',
          productName: 'Sample Course',
          amount: 500,
          currency: 'USD',
          paymentType: 'deposit',
        };
      case 'payment.failed':
        return {
          ...baseData,
          paymentId: 'pi_test123',
          enrollmentId: '00000000-0000-0000-0000-000000000000',
          productName: 'Sample Course',
          amount: 500,
          currency: 'USD',
          failureReason: 'Insufficient funds',
        };
      case 'recording.ready':
        return {
          ...baseData,
          lessonId: '00000000-0000-0000-0000-000000000000',
          lessonTitle: 'Sample Lesson',
          courseName: 'Sample Course',
          recordingUrl: 'https://example.com/recording',
        };
      default:
        return baseData;
    }
  };

  const getEventTypeLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      'enrollment.created': t('emails.triggers.events.enrollmentCreated', 'Enrollment Created'),
      'enrollment.completed': t('emails.triggers.events.enrollmentCompleted', 'Enrollment Completed'),
      'payment.completed': t('emails.triggers.events.paymentCompleted', 'Payment Completed'),
      'payment.failed': t('emails.triggers.events.paymentFailed', 'Payment Failed'),
      'recording.ready': t('emails.triggers.events.recordingReady', 'Recording Ready'),
      'lesson.reminder': t('emails.triggers.events.lessonReminder', 'Lesson Reminder'),
    };
    return labels[eventType] || eventType;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      urgent: 'destructive',
      high: 'default',
      normal: 'secondary',
      low: 'outline',
    };

    const labels: Record<string, string> = {
      urgent: t('emails.triggers.priority.urgent', 'Urgent'),
      high: t('emails.triggers.priority.high', 'High'),
      normal: t('emails.triggers.priority.normal', 'Normal'),
      low: t('emails.triggers.priority.low', 'Low'),
    };

    return <Badge variant={variants[priority] || 'secondary'}>{labels[priority] || priority}</Badge>;
  };

  const getTimingDescription = (trigger: EmailTrigger): string => {
    if (trigger.send_time) {
      return `${t('emails.triggers.timing.at', 'At')} ${trigger.send_time}`;
    }
    if (trigger.send_days_before) {
      return `${trigger.send_days_before} ${t('emails.triggers.timing.daysBefore', 'days before')}`;
    }
    if (trigger.delay_minutes && trigger.delay_minutes !== 0) {
      const absMinutes = Math.abs(trigger.delay_minutes);
      const hours = Math.floor(absMinutes / 60);
      const minutes = absMinutes % 60;

      // Negative delay means "before event", positive means "after event"
      const isBeforeEvent = trigger.delay_minutes < 0;
      const timeDirection = isBeforeEvent
        ? t('emails.triggers.timing.beforeEvent', 'before event')
        : t('emails.triggers.timing.afterEvent', 'after event');

      if (hours > 0) {
        return `${hours} ${t('emails.triggers.timing.hoursMinutes', 'h')} ${minutes} ${t('emails.triggers.timing.minutes', 'm')} ${timeDirection}`;
      }
      return `${minutes} ${t('emails.triggers.timing.minutes', 'm')} ${timeDirection}`;
    }
    return t('emails.triggers.timing.immediately', 'Immediately');
  };

  const getTranslatedTemplateName = (trigger: any): string => {
    const templateKey = trigger.template_key;
    if (!templateKey) return trigger.template_name || t('common.unknown', 'Unknown');

    // Convert template_key to translation key format
    // e.g., "lesson.reminder" -> "email_template.lesson_reminder.name"
    const translationKey = `email_template.${templateKey.replace('.', '_')}.name`;

    // Try to get translation, fallback to template_name
    return t(translationKey, trigger.template_name || templateKey);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between'}`}>
          <div>
            <h1 suppressHydrationWarning style={{
              fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              {t('emails.triggers.title', 'Email Triggers')}
            </h1>
            <p suppressHydrationWarning style={{
              marginTop: '0.5rem',
              color: 'hsl(var(--muted-foreground))'
            }}>
              {t('emails.triggers.description', 'Automatically send emails when events occur')}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {t('emails.triggers.createTrigger', 'Create Trigger')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-center justify-between space-y-0 pb-2`}>
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('emails.triggers.stats.total', 'Total Triggers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{triggers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-center justify-between space-y-0 pb-2`}>
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('emails.triggers.stats.active', 'Active Triggers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {triggers.filter(t => t.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-center justify-between space-y-0 pb-2`}>
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('emails.triggers.stats.inactive', 'Inactive Triggers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">
                {triggers.filter(t => !t.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Triggers List */}
        <div className="space-y-4">
          {triggers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4" suppressHydrationWarning>
                  {t('emails.triggers.noTriggers', 'No triggers configured yet')}
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('emails.triggers.createFirst', 'Create Your First Trigger')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            triggers.map((trigger) => (
              <Card key={trigger.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <CardTitle className="text-xl">{trigger.trigger_name}</CardTitle>
                        {getPriorityBadge(trigger.priority)}
                        <Badge variant={trigger.is_active ? 'default' : 'secondary'} suppressHydrationWarning>
                          {trigger.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          • {getTranslatedTemplateName(trigger)}
                        </span>
                      </div>
                      <CardDescription>
                        {getEventTypeLabel(trigger.trigger_event)} • {getTimingDescription(trigger)}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testTrigger(trigger)}
                        title="Test Trigger"
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleTrigger(trigger)}
                        title={trigger.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {trigger.is_active ? (
                          <PowerOff className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Power className="h-4 w-4 text-green-500" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTrigger(trigger);
                          setCreateDialogOpen(true);
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingTrigger(trigger);
                          setShowDeleteDialog(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {(trigger.recipient_field || (trigger.conditions && Object.keys(trigger.conditions).length > 0)) && (
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {trigger.recipient_field && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" suppressHydrationWarning>
                            {t('emails.triggers.recipientField', 'Recipient Field')}:
                          </span>
                          <span className="text-sm text-muted-foreground font-mono">
                            {trigger.recipient_field}
                          </span>
                        </div>
                      )}

                      {trigger.conditions && Object.keys(trigger.conditions).length > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium mb-1" suppressHydrationWarning>
                            {t('emails.triggers.conditions', 'Conditions')}
                          </p>
                          <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                            {JSON.stringify(trigger.conditions, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <CreateTriggerDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setEditingTrigger(null);
          }}
          trigger={editingTrigger}
          onSuccess={() => {
            setCreateDialogOpen(false);
            setEditingTrigger(null);
            loadTriggers();
          }}
        />

        {/* Test Trigger Dialog */}
        <TestTriggerDialog
          open={testDialogOpen}
          onClose={() => {
            setTestDialogOpen(false);
            setTestingTrigger(null);
          }}
          onTest={handleTestTriggerWithEmail}
          defaultEmail={adminEmail}
          recipientEmail={testingTrigger?.recipient_field || undefined}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setShowDeleteDialog(false);
            setDeletingTrigger(null);
          }
        }}>
          <AlertDialogContent
            className="max-w-[90vw] sm:max-w-[500px]"
            style={{ direction }}>
            <AlertDialogHeader>
              <AlertDialogTitle className={isRtl ? 'text-right' : 'text-left'}>
                <span suppressHydrationWarning>{t('emails.triggers.deleteDialog.title', 'Delete Trigger')}</span>
              </AlertDialogTitle>
              <AlertDialogDescription className={isRtl ? 'text-right' : 'text-left'}>
                <span suppressHydrationWarning>
                  {t(
                    'emails.triggers.deleteDialog.description',
                    'Are you sure you want to delete "{name}"? This action cannot be undone.'
                  ).replace('{name}', deletingTrigger?.trigger_name || '')}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className={`flex gap-3 mt-6 pt-6 border-t ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingTrigger(null);
                }}
                disabled={deleteLoading}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <X className="h-4 w-4" />
                <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTrigger}
                disabled={deleteLoading}
                className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                {deleteLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span suppressHydrationWarning>{t('emails.triggers.deleting', 'Deleting...')}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span suppressHydrationWarning>{t('emails.triggers.delete', 'Delete')}</span>
                  </>
                )}
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

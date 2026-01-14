'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, Info } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { EmailTrigger, TriggerEvent, EmailTemplate } from '@/types/email';
import { toast } from 'sonner';

interface CreateTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: EmailTrigger | null;
  onSuccess: () => void;
}

export function CreateTriggerDialog({
  open,
  onOpenChange,
  trigger,
  onSuccess,
}: CreateTriggerDialogProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Form state
  const [triggerName, setTriggerName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState<string>('');
  const [templateId, setTemplateId] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal' | 'low'>('normal');

  // Timing
  const [timingType, setTimingType] = useState<'immediate' | 'delayed' | 'scheduled' | 'before_event' | 'days_before'>('immediate');
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [sendTime, setSendTime] = useState('09:00');
  const [beforeEventMinutes, setBeforeEventMinutes] = useState(60); // Minutes before event (for reminders)
  const [daysBefore, setDaysBefore] = useState(1);

  // Recipient
  const [recipientType, setRecipientType] = useState<'auto' | 'field' | 'role' | 'fixed'>('auto');
  const [recipientField, setRecipientField] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Conditions
  const [useConditions, setUseConditions] = useState(false);
  const [conditionsJson, setConditionsJson] = useState('{}');

  useEffect(() => {
    if (open) {
      loadTemplates();
      if (trigger) {
        populateForm(trigger);
      } else {
        resetForm();
      }
    }
  }, [open, trigger]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/emails/templates');
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // Get translated template name
  const getTemplateName = (template: EmailTemplate) => {
    const key = template.template_key.replace(/\./g, '_');
    return t(`email_template.${key}.name`, template.template_name);
  };

  const populateForm = (t: EmailTrigger) => {
    setTriggerName(t.trigger_name);
    setTriggerEvent(t.trigger_event);
    setTemplateId(t.template_id);
    setPriority(t.priority);

    // Timing
    if (t.send_time) {
      setTimingType('scheduled');
      setSendTime(t.send_time);
    } else if (t.send_days_before) {
      setTimingType('days_before');
      setDaysBefore(t.send_days_before);
    } else if (t.delay_minutes && t.delay_minutes < 0) {
      // Negative delay_minutes means "before event"
      setTimingType('before_event');
      setBeforeEventMinutes(Math.abs(t.delay_minutes));
    } else if (t.delay_minutes && t.delay_minutes > 0) {
      setTimingType('delayed');
      setDelayMinutes(t.delay_minutes);
    } else {
      setTimingType('immediate');
    }

    // Recipient
    if (t.recipient_field) {
      // Check if it's an email address (fixed) or a field path
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.recipient_field);
      if (isEmail) {
        setRecipientType('fixed');
        setRecipientEmail(t.recipient_field);
      } else {
        setRecipientType('field');
        setRecipientField(t.recipient_field);
      }
    } else if (t.recipient_role) {
      setRecipientType('role');
      setRecipientRole(t.recipient_role);
    } else {
      setRecipientType('auto');
    }

    // Conditions
    if (t.conditions) {
      setUseConditions(true);
      setConditionsJson(JSON.stringify(t.conditions, null, 2));
    }
  };

  const resetForm = () => {
    setTriggerName('');
    setTriggerEvent('');
    setTemplateId('');
    setPriority('normal');
    setTimingType('immediate');
    setDelayMinutes(0);
    setSendTime('09:00');
    setBeforeEventMinutes(60);
    setDaysBefore(1);
    setRecipientType('auto');
    setRecipientField('');
    setRecipientRole('');
    setRecipientEmail('');
    setUseConditions(false);
    setConditionsJson('{}');
  };

  const handleSubmit = async () => {
    // Validation
    if (!triggerName.trim()) {
      toast.error(t('triggers.validation.name_required', 'Trigger name is required'));
      return;
    }

    if (!triggerEvent) {
      toast.error(t('triggers.validation.event_required', 'Event type is required'));
      return;
    }

    if (!templateId) {
      toast.error(t('triggers.validation.template_required', 'Email template is required'));
      return;
    }

    // Validate conditions JSON if enabled
    let parsedConditions = null;
    if (useConditions && conditionsJson.trim() !== '{}') {
      try {
        parsedConditions = JSON.parse(conditionsJson);
      } catch (error) {
        toast.error(t('triggers.validation.invalid_json', 'Invalid conditions JSON'));
        return;
      }
    }

    // Build request payload
    const payload: any = {
      trigger_name: triggerName,
      trigger_event: triggerEvent,
      template_id: templateId,
      priority,
      conditions: parsedConditions,
    };

    // Timing
    switch (timingType) {
      case 'delayed':
        payload.delay_minutes = delayMinutes;
        break;
      case 'before_event':
        // Store as negative delay_minutes to indicate "before event"
        payload.delay_minutes = -beforeEventMinutes;
        break;
      case 'scheduled':
        payload.send_time = sendTime;
        break;
      case 'days_before':
        payload.send_days_before = daysBefore;
        break;
      default:
        payload.delay_minutes = 0;
    }

    // Recipient
    if (recipientType === 'field') {
      payload.recipient_field = recipientField;
    } else if (recipientType === 'role') {
      payload.recipient_role = recipientRole;
    } else if (recipientType === 'fixed') {
      payload.recipient_field = recipientEmail; // Store fixed email in recipient_field
    }

    try {
      setLoading(true);

      const url = trigger
        ? `/api/admin/emails/triggers/${trigger.id}`
        : '/api/admin/emails/triggers';

      const method = trigger ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save trigger');
      }

      toast.success(
        trigger
          ? t('triggers.updated', 'Trigger updated successfully')
          : t('triggers.created', 'Trigger created successfully')
      );

      onSuccess();
    } catch (error: any) {
      console.error('Error saving trigger:', error);
      toast.error(error.message || t('triggers.save_error', 'Failed to save trigger'));
    } finally {
      setLoading(false);
    }
  };

  const eventOptions: { value: TriggerEvent | string; label: string; description: string }[] = [
    {
      value: 'enrollment.created',
      label: t('triggers.event.enrollment_created', 'Enrollment Created'),
      description: t('triggers.event.enrollment_created_desc', 'When a new enrollment is created'),
    },
    {
      value: 'enrollment.completed',
      label: t('triggers.event.enrollment_completed', 'Enrollment Completed'),
      description: t('triggers.event.enrollment_completed_desc', 'When user completes enrollment wizard'),
    },
    {
      value: 'payment.completed',
      label: t('triggers.event.payment_completed', 'Payment Completed'),
      description: t('triggers.event.payment_completed_desc', 'When payment succeeds'),
    },
    {
      value: 'payment.failed',
      label: t('triggers.event.payment_failed', 'Payment Failed'),
      description: t('triggers.event.payment_failed_desc', 'When payment fails'),
    },
    {
      value: 'recording.ready',
      label: t('triggers.event.recording_ready', 'Recording Ready'),
      description: t('triggers.event.recording_ready_desc', 'When Zoom recording is processed'),
    },
    {
      value: 'lesson.reminder',
      label: t('triggers.event.lesson_reminder', 'Lesson Reminder'),
      description: t('triggers.event.lesson_reminder_desc', 'Send reminders before lessons'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader className={isRtl ? '[&>button]:left-4 [&>button]:right-auto' : ''}>
          <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
            {trigger
              ? t('triggers.edit_title', 'Edit Trigger')
              : t('triggers.create_title', 'Create New Trigger')}
          </DialogTitle>
          <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
            {t('triggers.dialog_description', 'Configure automated email sending based on platform events')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">{t('triggers.tab.basic', 'Basic')}</TabsTrigger>
            <TabsTrigger value="timing">{t('triggers.tab.timing', 'Timing')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('triggers.tab.advanced', 'Advanced')}</TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trigger-name">
                {t('triggers.field.name', 'Trigger Name')} *
              </Label>
              <Input
                id="trigger-name"
                value={triggerName}
                onChange={(e) => setTriggerName(e.target.value)}
                placeholder={t('triggers.field.name_placeholder', 'e.g., Send Welcome Email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger-event">
                {t('triggers.field.event', 'Event Type')} *
              </Label>
              <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                <SelectTrigger>
                  <SelectValue placeholder={t('triggers.field.event_placeholder', 'Select event type')} />
                </SelectTrigger>
                <SelectContent>
                  {eventOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">
                {t('triggers.field.template', 'Email Template')} *
              </Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('triggers.field.template_placeholder', 'Select template')} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {getTemplateName(template)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">
                {t('triggers.field.priority', 'Priority')}
              </Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">{t('triggers.priority.urgent', 'Urgent')}</SelectItem>
                  <SelectItem value="high">{t('triggers.priority.high', 'High')}</SelectItem>
                  <SelectItem value="normal">{t('triggers.priority.normal', 'Normal')}</SelectItem>
                  <SelectItem value="low">{t('triggers.priority.low', 'Low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('triggers.field.timing', 'When to send')}</Label>
              <Select value={timingType} onValueChange={(v: any) => setTimingType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">
                    {t('triggers.timing.immediate', 'Immediately after event')}
                  </SelectItem>
                  <SelectItem value="delayed">
                    {t('triggers.timing.delayed', 'Delayed (minutes/hours after)')}
                  </SelectItem>
                  <SelectItem value="before_event">
                    {t('triggers.timing.before_event', 'Before event (hours/minutes)')}
                  </SelectItem>
                  <SelectItem value="scheduled">
                    {t('triggers.timing.scheduled', 'At specific time of day')}
                  </SelectItem>
                  <SelectItem value="days_before">
                    {t('triggers.timing.days_before', 'Days before event (reminders)')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timingType === 'delayed' && (
              <div className="space-y-2">
                <Label htmlFor="delay-minutes">
                  {t('triggers.field.delay_minutes', 'Delay (minutes)')}
                </Label>
                <Input
                  id="delay-minutes"
                  type="number"
                  min="0"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
                  placeholder="60"
                />
                <p className="text-xs text-muted-foreground">
                  {t('triggers.field.delay_hint', 'Tip: 60 = 1 hour, 1440 = 1 day')}
                </p>
              </div>
            )}

            {timingType === 'before_event' && (
              <div className="space-y-2">
                <Label htmlFor="before-event-minutes">
                  {t('triggers.field.before_event_minutes', 'Minutes before event')}
                </Label>
                <Input
                  id="before-event-minutes"
                  type="number"
                  min="1"
                  value={beforeEventMinutes}
                  onChange={(e) => setBeforeEventMinutes(parseInt(e.target.value) || 60)}
                  placeholder="60"
                />
                <p className="text-xs text-muted-foreground">
                  {t('triggers.field.before_event_hint', 'E.g., 60 = 1 hour before, 1440 = 1 day before')}
                </p>
              </div>
            )}

            {timingType === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="send-time">
                  {t('triggers.field.send_time', 'Send at time')}
                </Label>
                <Input
                  id="send-time"
                  type="time"
                  value={sendTime}
                  onChange={(e) => setSendTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('triggers.field.send_time_hint', 'If time passed today, will send tomorrow')}
                </p>
              </div>
            )}

            {timingType === 'days_before' && (
              <div className="space-y-2">
                <Label htmlFor="days-before">
                  {t('triggers.field.days_before', 'Days before event')}
                </Label>
                <Input
                  id="days-before"
                  type="number"
                  min="1"
                  value={daysBefore}
                  onChange={(e) => setDaysBefore(parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">
                  {t('triggers.field.days_before_hint', 'For lesson reminders and upcoming events')}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('triggers.field.recipient', 'Recipient Strategy')}</Label>
              <Select value={recipientType} onValueChange={(v: any) => setRecipientType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    {t('triggers.recipient.auto', 'Auto-detect from event data')}
                  </SelectItem>
                  <SelectItem value="field">
                    {t('triggers.recipient.field', 'Extract from specific field')}
                  </SelectItem>
                  <SelectItem value="role">
                    {t('triggers.recipient.role', 'Lookup by user role')}
                  </SelectItem>
                  <SelectItem value="fixed">
                    {t('triggers.recipient.fixed', 'Fixed email address')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType === 'field' && (
              <div className="space-y-2">
                <Label htmlFor="recipient-field">
                  {t('triggers.field.recipient_field', 'Field Path')}
                </Label>
                <Input
                  id="recipient-field"
                  value={recipientField}
                  onChange={(e) => setRecipientField(e.target.value)}
                  placeholder="email"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {t('triggers.field.recipient_field_hint', 'e.g., "email", "user.email", "userEmail"')}
                </p>
              </div>
            )}

            {recipientType === 'role' && (
              <div className="space-y-2">
                <Label htmlFor="recipient-role">
                  {t('triggers.field.recipient_role', 'User Role')}
                </Label>
                <Select value={recipientRole} onValueChange={setRecipientRole}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('triggers.field.recipient_role_placeholder', 'Select role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">{t('triggers.role.student', 'Student')}</SelectItem>
                    <SelectItem value="instructor">{t('triggers.role.instructor', 'Instructor')}</SelectItem>
                    <SelectItem value="admin">{t('triggers.role.admin', 'Admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {recipientType === 'fixed' && (
              <div className="space-y-2">
                <Label htmlFor="recipient-email">
                  {t('triggers.field.recipient_email', 'Email Address')}
                </Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder={t('triggers.field.recipient_email_placeholder', 'e.g., support@tenafly-tg.com')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('triggers.field.recipient_email_hint', 'Fixed email address to always send to')}
                </p>
              </div>
            )}

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('triggers.field.conditions', 'Conditions')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('triggers.field.conditions_desc', 'Only send if conditions match')}
                  </p>
                </div>
                <Switch checked={useConditions} onCheckedChange={setUseConditions} />
              </div>

              {useConditions && (
                <div className="space-y-2">
                  <Label htmlFor="conditions-json">
                    {t('triggers.field.conditions_json', 'Conditions (JSON)')}
                  </Label>
                  <textarea
                    id="conditions-json"
                    value={conditionsJson}
                    onChange={(e) => setConditionsJson(e.target.value)}
                    className="w-full h-32 p-2 border rounded font-mono text-sm"
                    placeholder='{"payment_status": "paid"}'
                  />
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-xs space-y-1">
                    <p className="font-medium flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {t('triggers.field.conditions_examples', 'Examples')}:
                    </p>
                    <p className="font-mono">{'{"payment_status": "paid"}'}</p>
                    <p className="font-mono">{'{"amount": {"$gte": 100}}'}</p>
                    <p className="font-mono">{'{"$and": [{"status": "active"}, {"role": "student"}]}'}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />}
            {trigger
              ? t('triggers.update', 'Update Trigger')
              : t('triggers.create', 'Create Trigger')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

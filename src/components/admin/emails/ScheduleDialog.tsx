'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAdminLanguage } from '@/context/AppContext';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: any | null;
  onSaved: () => void;
}

const RECURRENCE_NONE = 'none';
const RECURRENCE_CUSTOM = 'custom';
const RECURRENCE_PRESETS = [
  { value: RECURRENCE_NONE,    label: 'noRecurrence' as const },
  { value: 'FREQ=DAILY',       label: 'daily' as const },
  { value: 'FREQ=WEEKLY',      label: 'weekly' as const },
  { value: 'FREQ=MONTHLY',     label: 'monthly' as const },
  { value: RECURRENCE_CUSTOM,  label: 'custom' as const },
];

const PRIORITIES = ['normal', 'high', 'urgent'] as const;
const LANGUAGES = ['en', 'he'] as const;

export function ScheduleDialog({ open, onOpenChange, schedule, onSaved }: ScheduleDialogProps) {
  const { t, direction } = useAdminLanguage();
  const dir: 'ltr' | 'rtl' = direction === 'rtl' ? 'rtl' : 'ltr';
  const isEditing = !!schedule;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Compose fields → mapped to notification.generic template variables
  // on save. The template itself is fixed server-side so admins don't
  // have to wrestle with per-template variable lists.
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('normal');
  // Pins every recipient's render to this language. Defaults to the
  // admin UI language so the preview in the queue page matches what
  // the admin just composed.
  const [languageCode, setLanguageCode] = useState<(typeof LANGUAGES)[number]>(direction === 'rtl' ? 'he' : 'en');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');

  const [scheduledFor, setScheduledFor] = useState('');
  const [recurrencePreset, setRecurrencePreset] = useState<string>(RECURRENCE_NONE);
  const [customRRule, setCustomRRule] = useState('');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  type RecipientMode = 'all' | 'filter' | 'users' | 'product';
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('filter');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pickedUsers, setPickedUsers] = useState<Array<{ id: string; email: string; first_name?: string; last_name?: string }>>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<Array<{ id: string; email: string; first_name?: string; last_name?: string }>>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; title: string; type: string }>>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [pickedProductId, setPickedProductId] = useState('');

  const [recipientPreview, setRecipientPreview] = useState<{ count: number; sample: string[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset / hydrate when opening.
  useEffect(() => {
    if (!open) return;
    if (schedule) {
      setName(schedule.schedule_name || '');
      setDescription(schedule.description || '');
      const vars = (schedule.template_variables && typeof schedule.template_variables === 'object')
        ? schedule.template_variables
        : {};
      setNotificationTitle(vars.notificationTitle || schedule.schedule_name || '');
      setNotificationMessage(vars.notificationMessage || '');
      setPriority((PRIORITIES as readonly string[]).includes(vars.priority) ? vars.priority : 'normal');
      const lc = schedule.language_code;
      setLanguageCode((LANGUAGES as readonly string[]).includes(lc) ? lc : (direction === 'rtl' ? 'he' : 'en'));
      setActionUrl(vars.actionUrl || '');
      setActionLabel(vars.actionLabel || '');
      setScheduledFor(schedule.scheduled_for ? toLocalInput(schedule.scheduled_for) : '');
      setRecurrenceEndDate(schedule.recurrence_end_date ? toLocalInput(schedule.recurrence_end_date) : '');

      const r = schedule.recurrence_rule || '';
      const known = RECURRENCE_PRESETS.find((p) => p.value === r);
      if (known) {
        setRecurrencePreset(r);
        setCustomRRule('');
      } else if (r) {
        setRecurrencePreset(RECURRENCE_CUSTOM);
        setCustomRRule(r);
      } else {
        setRecurrencePreset(RECURRENCE_NONE);
        setCustomRRule('');
      }

      const f = schedule.recipient_filter || {};
      setFilterRole(f.role || 'all');
      setFilterStatus(f.status || 'all');
      const ids = Array.isArray(schedule.recipient_ids) ? schedule.recipient_ids : [];
      if (ids.length > 0) {
        setRecipientMode('users');
        setPickedUsers(ids.map((id: string) => ({ id, email: id })));
      } else if (f.product_id) {
        setRecipientMode('product');
        setPickedProductId(f.product_id);
      } else if (Object.keys(f).length === 0) {
        setRecipientMode('all');
      } else {
        setRecipientMode('filter');
      }
    } else {
      setName('');
      setDescription('');
      setNotificationTitle('');
      setNotificationMessage('');
      setPriority('normal');
      setLanguageCode(direction === 'rtl' ? 'he' : 'en');
      setActionUrl('');
      setActionLabel('');
      setScheduledFor('');
      setRecurrencePreset(RECURRENCE_NONE);
      setCustomRRule('');
      setRecurrenceEndDate('');
      setFilterRole('all');
      setFilterStatus('all');
      setRecipientMode('filter');
      setPickedUsers([]);
      setPickedProductId('');
    }
    setRecipientPreview(null);
    setUserSearch('');
    setUserResults([]);
  }, [open, schedule]);

  // Load products list when product mode is active.
  useEffect(() => {
    if (recipientMode !== 'product' || products.length > 0) return;
    setProductsLoading(true);
    fetch('/api/admin/products?status=active')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setProducts(d.products || d.data || []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [recipientMode, products.length]);

  // Debounced user-email search.
  useEffect(() => {
    if (recipientMode !== 'users' || userSearch.trim().length < 3) {
      setUserResults([]);
      return;
    }
    setUserSearchLoading(true);
    const handle = setTimeout(() => {
      fetch(`/api/admin/users/search?email=${encodeURIComponent(userSearch.trim())}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => setUserResults(d.users || []))
        .catch(() => setUserResults([]))
        .finally(() => setUserSearchLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [recipientMode, userSearch]);

  const buildFilter = () => {
    const filter: Record<string, any> = {};
    if (recipientMode === 'filter') {
      if (filterRole && filterRole !== 'all') filter.role = filterRole;
      if (filterStatus && filterStatus !== 'all') filter.status = filterStatus;
    } else if (recipientMode === 'product') {
      if (pickedProductId) filter.product_id = pickedProductId;
    }
    return Object.keys(filter).length > 0 ? filter : null;
  };

  const buildRecipientIds = (): string[] | null => {
    if (recipientMode !== 'users') return null;
    const ids = pickedUsers.map((u) => u.id).filter(Boolean);
    return ids.length > 0 ? ids : null;
  };

  const buildRRule = (): string | null => {
    if (recurrencePreset === RECURRENCE_NONE) return null;
    if (recurrencePreset === RECURRENCE_CUSTOM) return customRRule.trim() || null;
    return recurrencePreset;
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/emails/schedules/preview-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_filter: buildFilter(),
          recipient_ids: buildRecipientIds(),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecipientPreview({ count: data.count, sample: data.sample || [] });
    } catch {
      toast.error(t('emails.schedules.previewFailed', 'Failed to preview recipients'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !scheduledFor) {
      toast.error(t('emails.schedules.missingFields', 'Name and date are required'));
      return;
    }
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error(t('emails.schedules.missingCompose', 'Subject and message are required'));
      return;
    }
    setSaving(true);
    try {
      // Map the compose form to the generic-notification template
      // variables. userName + organizationName are injected server-side
      // so we don't leak them into the JSONB here.
      const templateVariables: Record<string, string> = {
        notificationTitle: notificationTitle.trim(),
        notificationMessage: notificationMessage.trim(),
        priority,
        category: 'announcement',
      };
      if (actionUrl.trim()) templateVariables.actionUrl = actionUrl.trim();
      if (actionLabel.trim()) templateVariables.actionLabel = actionLabel.trim();

      const payload = {
        schedule_name: name,
        description: description || null,
        // Server resolves the fixed `notification.generic` template; we
        // intentionally don't send template_id from the client.
        recipient_filter: buildFilter(),
        recipient_ids: buildRecipientIds(),
        scheduled_for: new Date(scheduledFor).toISOString(),
        recurrence_rule: buildRRule(),
        recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
        template_variables: templateVariables,
        language_code: languageCode,
      };

      const url = isEditing
        ? `/api/admin/emails/schedules/${schedule.id}`
        : '/api/admin/emails/schedules';
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        throw new Error(e?.error || 'failed');
      }
      toast.success(isEditing
        ? t('emails.schedules.updated', 'Schedule updated')
        : t('emails.schedules.created', 'Schedule created'));
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || t('emails.schedules.saveFailed', 'Failed to save schedule'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('emails.schedules.edit', 'Edit Schedule')
              : t('emails.schedules.create', 'Create Schedule')}
          </DialogTitle>
          <DialogDescription>
            {t('emails.schedules.dialogDescription', 'Compose a notification email and schedule it to a group of users.')}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('emails.schedules.name', 'Schedule Name')} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('emails.schedules.description', 'Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {/* Compose section — what the recipient will see. */}
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('emails.schedules.compose', 'Compose email')}
            </h3>

            <div className="space-y-2">
              <Label>{t('emails.schedules.subject', 'Subject')} *</Label>
              <Input
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder={t('emails.schedules.subjectPlaceholder', 'e.g. New course available')}
                dir="auto"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('emails.schedules.message', 'Message')} *</Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={6}
                placeholder={t('emails.schedules.messagePlaceholder', 'Body of the email…')}
                dir="auto"
              />
              <p className="text-[10px] text-muted-foreground">
                {t('emails.schedules.messageHint', 'Recipient name and your organization name are filled in automatically.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{t('emails.schedules.priority', 'Priority')}</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)} dir={dir}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(`emails.schedules.priority.${p}`, p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('emails.schedules.language', 'Language')}</Label>
                <Select value={languageCode} onValueChange={(v) => setLanguageCode(v as any)} dir={dir}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lc) => (
                      <SelectItem key={lc} value={lc}>
                        {t(`emails.schedules.language.${lc}`, lc === 'he' ? 'Hebrew' : 'English')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('emails.schedules.actionUrl', 'Action link (optional)')}</Label>
                <Input
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="https://…"
                  dir="ltr"
                />
              </div>
            </div>

            {actionUrl.trim() && (
              <div className="space-y-2">
                <Label>{t('emails.schedules.actionLabel', 'Button label')}</Label>
                <Input
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder={t('emails.schedules.actionLabelPlaceholder', 'View details')}
                  dir="auto"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('emails.schedules.scheduled_for', 'Scheduled For')} *</Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('emails.schedules.recurrence', 'Recurrence')}</Label>
              <Select value={recurrencePreset} onValueChange={setRecurrencePreset} dir={dir}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_PRESETS.map((p) => (
                    <SelectItem key={p.label} value={p.value}>
                      {t(`emails.schedules.recurrence.${p.label}`, p.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {recurrencePreset === RECURRENCE_CUSTOM && (
            <div className="space-y-2">
              <Label>{t('emails.schedules.customRRule', 'Custom RRULE')}</Label>
              <Input
                value={customRRule}
                onChange={(e) => setCustomRRule(e.target.value)}
                placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
              />
              <p className="text-xs text-muted-foreground">
                {t('emails.schedules.customRRuleHint', 'RFC 5545 RRULE string (no leading "RRULE:" needed).')}
              </p>
            </div>
          )}

          {recurrencePreset !== RECURRENCE_NONE && (
            <div className="space-y-2">
              <Label>{t('emails.schedules.recurrence_end_date', 'Recurrence end (optional)')}</Label>
              <Input
                type="datetime-local"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
              />
            </div>
          )}

          {/* Recipient filter */}
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('emails.schedules.recipients', 'Recipients')}
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={previewLoading}>
                {previewLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('emails.schedules.preview', 'Preview count')}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t('emails.schedules.recipientMode', 'Send to')}</Label>
              <Select value={recipientMode} onValueChange={(v) => setRecipientMode(v as RecipientMode)} dir={dir}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('emails.schedules.recipientMode.all', 'All users in tenant')}</SelectItem>
                  <SelectItem value="filter">{t('emails.schedules.recipientMode.filter', 'By role / status filter')}</SelectItem>
                  <SelectItem value="users">{t('emails.schedules.recipientMode.users', 'Specific users')}</SelectItem>
                  <SelectItem value="product">{t('emails.schedules.recipientMode.product', 'Enrolled in a program / course')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientMode === 'filter' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">{t('emails.schedules.filter.role', 'Role')}</Label>
                  <Select value={filterRole} onValueChange={setFilterRole} dir={dir}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                      <SelectItem value="student">{t('admin.users.roles.student', 'Student')}</SelectItem>
                      <SelectItem value="instructor">{t('admin.users.roles.instructor', 'Instructor')}</SelectItem>
                      <SelectItem value="staff">{t('admin.users.roles.staff', 'Staff')}</SelectItem>
                      <SelectItem value="admin">{t('admin.users.roles.admin', 'Admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('emails.schedules.filter.status', 'Status')}</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus} dir={dir}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                      <SelectItem value="active">{t('admin.users.status.active', 'Active')}</SelectItem>
                      <SelectItem value="invited">{t('admin.users.status.invited', 'Invited')}</SelectItem>
                      <SelectItem value="suspended">{t('admin.users.status.suspended', 'Suspended')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {recipientMode === 'users' && (
              <div className="space-y-2">
                <Label className="text-xs">{t('emails.schedules.pickUsers', 'Pick users')}</Label>
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('emails.schedules.searchUsers', 'Type to search by email or name…')}
                />
                {userSearchLoading && <p className="text-xs text-muted-foreground">{t('common.loading', 'Loading…')}</p>}
                {userResults.length > 0 && (
                  <div className="rounded-md border max-h-48 overflow-y-auto">
                    {userResults
                      .filter((u) => !pickedUsers.some((p) => p.id === u.id))
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setPickedUsers((prev) => [...prev, u]);
                            setUserSearch('');
                            setUserResults([]);
                          }}
                          className="w-full text-start px-3 py-2 text-sm hover:bg-muted transition"
                        >
                          <span className="font-medium">
                            {u.first_name || u.last_name ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : u.email}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2 rtl:mr-2 rtl:ml-0" dir="ltr">{u.email}</span>
                        </button>
                      ))}
                  </div>
                )}
                {pickedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {pickedUsers.map((u) => (
                      <Badge key={u.id} variant="secondary" className="gap-1">
                        {u.email}
                        <button
                          type="button"
                          onClick={() => setPickedUsers((prev) => prev.filter((p) => p.id !== u.id))}
                          className="ms-1 hover:text-destructive"
                          aria-label="remove"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {recipientMode === 'product' && (
              <div className="space-y-2">
                <Label className="text-xs">{t('emails.schedules.pickProduct', 'Pick a program or course')}</Label>
                <Select value={pickedProductId} onValueChange={setPickedProductId} disabled={productsLoading} dir={dir}>
                  <SelectTrigger>
                    <SelectValue placeholder={productsLoading ? t('common.loading', 'Loading…') : ''} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}{' '}
                        <span className="text-muted-foreground">
                          ({t(`admin.users.activity.values.productType.${p.type}`, p.type)})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {recipientPreview && (
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                <p className="font-medium">
                  {t('emails.schedules.previewResult', '{{count}} eligible recipients').replace('{{count}}', String(recipientPreview.count))}
                </p>
                {recipientPreview.sample.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 break-all" dir="ltr">
                    {recipientPreview.sample.slice(0, 5).join(', ')}
                    {recipientPreview.count > 5 && ', …'}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditing ? t('common.save', 'Save') : t('emails.schedules.create', 'Create Schedule')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

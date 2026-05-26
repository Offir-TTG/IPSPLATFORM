'use client';

import { Fragment, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Shield, XCircle } from 'lucide-react';
import type { AuditEvent } from '@/lib/audit/types';
import { useAdminLanguage } from '@/context/AppContext';

interface UserAuditTableProps {
  events: AuditEvent[];
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const stripUuids = (s: string | null | undefined): string => {
  if (!s) return '';
  return s.replace(UUID_RE, '').replace(/\s{2,}/g, ' ').trim();
};

const SKIP_FIELDS = new Set([
  'id', 'tenant_id', 'user_id', 'created_at', 'updated_at',
  'deleted_at', 'created_by', 'updated_by',
]);

function eventTypeBadgeVariant(t: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (t === 'DELETE') return 'destructive';
  if (t === 'CREATE' || t === 'LOGIN') return 'default';
  if (t === 'UPDATE') return 'secondary';
  return 'outline';
}

function riskBadgeVariant(r: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (r === 'critical' || r === 'high') return 'destructive';
  if (r === 'medium') return 'outline';
  return 'secondary';
}

export function UserAuditTable({ events }: UserAuditTableProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const dateLocale = isRtl ? 'he-IL' : undefined;
  const headerCell = isRtl ? 'text-right' : 'text-left';
  const [expanded, setExpanded] = useState<string | null>(null);

  const formatActionName = (action: string, ev: AuditEvent): string => {
    if (action?.startsWith('audit.')) return t(action, action);
    if (action?.includes('.')) {
      const [, actionPart] = action.split('.');
      return t(`audit.action.${actionPart}`, actionPart.charAt(0).toUpperCase() + actionPart.slice(1));
    }
    if (ev.event_type) {
      return t(
        `audit.eventType.${ev.event_type}`,
        ev.event_type.charAt(0) + ev.event_type.slice(1).toLowerCase(),
      );
    }
    return (action || '')
      .replace(/_/g, ' ')
      .split(' ')
      .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
      .join(' ');
  };

  const formatResource = (resourceType: string): string => {
    const tr = t(`audit.resource.${resourceType}`, '');
    if (tr) return tr;
    return resourceType
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const formatField = (field: string): string => {
    const tr = t(`audit.field.${field}`, '');
    if (tr) return tr;
    return field.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return t('common.empty', '(empty)');
    if (typeof val === 'boolean') return val ? t('common.yes', 'Yes') : t('common.no', 'No');
    if (typeof val === 'object') {
      if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : t('common.empty', '(empty)');
      const entries = Object.entries(val);
      if (entries.length === 0) return t('common.empty', '(empty)');
      if (entries.length <= 3) return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
      return `${entries.length} ${t('common.items', 'items')}`;
    }
    return String(val);
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return {
      dateStr: d.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' }),
      timeStr: d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
  };

  const renderExpanded = (ev: AuditEvent) => {
    if (ev.event_type === 'CREATE' || ev.event_type === 'DELETE') {
      const source: any = ev.event_type === 'CREATE'
        ? (ev.new_values ?? ev.metadata?.changes)
        : (ev.old_values ?? ev.metadata?.changes);
      if (!source || typeof source !== 'object') return null;
      const entries = Object.entries(source).filter(
        ([k, v]) => !SKIP_FIELDS.has(k) && v !== null && v !== undefined && !(typeof v === 'string' && v === ''),
      );
      if (entries.length === 0) return null;
      return (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {ev.event_type === 'CREATE'
              ? t('admin.audit.details.created', 'What was created')
              : t('admin.audit.details.deleted', 'What was deleted')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-muted-foreground mb-0.5">{formatField(k)}</div>
                <div className="text-sm break-words">{stripUuids(formatValue(v))}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (ev.event_type === 'UPDATE') {
      const hasCols = ev.changed_fields && ev.changed_fields.length > 0 && ev.old_values && ev.new_values;
      const hasMeta = ev.metadata?.fields && ev.metadata?.changes;
      if (!hasCols && !hasMeta) return null;
      const fields: string[] = hasCols
        ? (ev.changed_fields as string[])
        : (ev.metadata?.fields as string[]) || [];
      const relevant = fields.filter((f) => f !== 'updated_at' && f !== 'created_at');
      const rows = relevant.map((f) => {
        const oldVal = hasCols ? ev.old_values?.[f] : ev.metadata?.changes?.[f]?.before;
        const newVal = hasCols ? ev.new_values?.[f] : ev.metadata?.changes?.[f]?.after;
        return { f, oldVal, newVal };
      }).filter(({ oldVal, newVal }) => {
        const bothEmpty = (oldVal === null || oldVal === undefined || oldVal === '')
          && (newVal === null || newVal === undefined || newVal === '');
        return !bothEmpty && oldVal !== newVal;
      });
      if (rows.length === 0) return null;
      return (
        <div className="space-y-3">
          {rows.map(({ f, oldVal, newVal }) => (
            <div key={f}>
              <div className="text-sm font-semibold mb-1">{formatField(f)}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="rounded border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-sm line-through text-muted-foreground break-words">
                  {stripUuids(formatValue(oldVal)) || t('common.empty', '(empty)')}
                </div>
                <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-sm break-words">
                  {stripUuids(formatValue(newVal)) || t('common.empty', '(empty)')}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveTable>
      <ResponsiveTable.Desktop>
        <div className="overflow-x-auto" dir={direction}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={headerCell}>{t('admin.audit.table.time', 'Time')}</TableHead>
                <TableHead className={headerCell}>{t('admin.audit.table.user', 'User')}</TableHead>
                <TableHead className={headerCell}>{t('admin.audit.table.action', 'Action')}</TableHead>
                <TableHead className={headerCell}>{t('admin.audit.table.resource', 'Resource')}</TableHead>
                <TableHead className={headerCell}>{t('admin.audit.table.type', 'Type')}</TableHead>
                <TableHead className={headerCell}>{t('admin.audit.table.risk', 'Risk')}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => {
                const { dateStr, timeStr } = formatDate(ev.event_timestamp);
                const isOpen = expanded === ev.id;
                const cleanedResource = stripUuids(ev.resource_name || '');
                return (
                  <Fragment key={ev.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : ev.id)}
                    >
                      <TableCell className="text-xs whitespace-nowrap tabular-nums">
                        <div className="font-medium">{timeStr}</div>
                        <div className="text-muted-foreground">{dateStr}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium truncate max-w-[200px]" dir="ltr">
                          {ev.user_email || t('admin.audit.table.system', 'System')}
                        </div>
                        {ev.user_role && (
                          <div className="text-xs text-muted-foreground">{ev.user_role}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium" dir="auto">
                        {formatActionName(ev.action, ev)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="whitespace-nowrap">{formatResource(ev.resource_type)}</div>
                        {cleanedResource && (
                          <div className="text-muted-foreground truncate max-w-[150px]" dir="auto">
                            {cleanedResource}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={eventTypeBadgeVariant(ev.event_type)} className="text-[10px]">
                          {t(`audit.eventType.${ev.event_type}`, ev.event_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(ev.risk_level === 'critical' || ev.risk_level === 'high') ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {ev.status === 'success' ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          ) : ev.status === 'failure' ? (
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(isOpen ? null : ev.id);
                          }}
                        >
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          {renderExpanded(ev) ?? (
                            <div className="text-sm text-muted-foreground">
                              {t('admin.users.activity.activity.noDetails', 'No additional details available.')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ResponsiveTable.Desktop>

      <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
        {events.map((ev) => {
          const { dateStr, timeStr } = formatDate(ev.event_timestamp);
          const isOpen = expanded === ev.id;
          return (
            <div key={ev.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm break-words" dir="auto">
                    {formatActionName(ev.action, ev)}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="auto">
                    {formatResource(ev.resource_type)}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    <Badge variant={eventTypeBadgeVariant(ev.event_type)} className="text-[10px]">
                      {t(`audit.eventType.${ev.event_type}`, ev.event_type)}
                    </Badge>
                    <Badge variant={riskBadgeVariant(ev.risk_level)} className="text-[10px]">
                      {ev.risk_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                    {dateStr} · {timeStr}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 w-7 p-0"
                  onClick={() => setExpanded(isOpen ? null : ev.id)}
                >
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              {isOpen && (
                <div className="border-t pt-2">
                  {renderExpanded(ev) ?? (
                    <div className="text-xs text-muted-foreground">
                      {t('admin.users.activity.activity.noDetails', 'No additional details available.')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </ResponsiveTable.Mobile>
    </ResponsiveTable>
  );
}

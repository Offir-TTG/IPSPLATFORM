'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ShieldCheck, AlertTriangle, XCircle, Tag } from 'lucide-react';
import { UserAuditTable } from './UserAuditTable';
import type { AuditEvent } from '@/lib/audit/types';
import { useAdminLanguage } from '@/context/AppContext';

type EnrichedTag = { value: string; from_products: string[] };

export interface UserSummary {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: string;
    status?: string;
    is_active: boolean;
    created_at: string;
    last_login_at?: string;
    avatar_url?: string;
    tenant_id: string;
  };
  enrollments_total: number;
  enrollments_active: number;
  enrollments_overdue: number;
  lifetime_spend: number;
  outstanding: number;
  overdue_count: number;
  overdue_amount: number;
  failed_payment_count: number;
  next_payment_due_at: string | null;
  next_payment_amount: number | null;
  attendance_total: number;
  attendance_present: number;
  attendance_rate: number | null;
  recent_failure_count: number;
  last_activity_at: string | null;
}

interface UserOverviewTabProps {
  userId: string;
  summary: UserSummary;
  onSwitchToActivity: () => void;
  /** Navigate to another tab from inside a health-alert link. */
  onSwitchToTab?: (tab: 'payments' | 'attendance' | 'enrollments' | 'activity') => void;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type Severity = 'error' | 'warn' | 'info';

interface HealthIssue {
  severity: Severity;
  text: string;
  /** Optional tab to jump to when the issue chip is clicked. */
  jumpTo?: 'payments' | 'attendance' | 'enrollments' | 'activity';
}

function buildIssues(
  s: UserSummary,
  t: (key: string, fallbackOrParams?: any) => string
): HealthIssue[] {
  const issues: HealthIssue[] = [];

  if (s.user.status === 'suspended') {
    issues.push({
      severity: 'error',
      text: t('admin.users.activity.health.suspended', 'Account is suspended.'),
    });
  } else if (!s.user.is_active) {
    issues.push({
      severity: 'warn',
      text: t('admin.users.activity.health.inactive', 'Account is not active.'),
    });
  }

  if (s.overdue_count > 0) {
    issues.push({
      severity: 'error',
      text: t('admin.users.activity.health.overdue', {
        count: s.overdue_count,
        amount: formatMoney(Number(s.overdue_amount || 0)),
      }),
      jumpTo: 'payments',
    });
  }

  if (s.enrollments_overdue > 0) {
    issues.push({
      severity: 'error',
      text: t('admin.users.activity.health.enrollmentsOverdue', { count: s.enrollments_overdue }),
      jumpTo: 'enrollments',
    });
  }

  if (s.failed_payment_count > 0) {
    issues.push({
      severity: 'warn',
      text: t('admin.users.activity.health.failedPayments', { count: s.failed_payment_count }),
      jumpTo: 'payments',
    });
  }

  if (s.attendance_total > 0 && s.attendance_rate !== null && s.attendance_rate < 80) {
    issues.push({
      severity: 'warn',
      text: t('admin.users.activity.health.lowAttendance', { rate: s.attendance_rate }),
      jumpTo: 'attendance',
    });
  }

  if (s.recent_failure_count > 0) {
    issues.push({
      severity: 'warn',
      text: t('admin.users.activity.health.recentFailures', { count: s.recent_failure_count }),
      jumpTo: 'activity',
    });
  }

  return issues;
}

function severityStyles(sev: Severity) {
  switch (sev) {
    case 'error':
      return { Icon: XCircle, ring: 'border-destructive/40 bg-destructive/5', icon: 'text-destructive' };
    case 'warn':
      return { Icon: AlertTriangle, ring: 'border-amber-500/40 bg-amber-500/5', icon: 'text-amber-600' };
    case 'info':
    default:
      return { Icon: AlertCircle, ring: 'border-primary/30 bg-primary/5', icon: 'text-primary' };
  }
}

export function UserOverviewTab({ userId, summary, onSwitchToActivity, onSwitchToTab }: UserOverviewTabProps) {
  const { t } = useAdminLanguage();
  const [recent, setRecent] = useState<AuditEvent[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [keapTags, setKeapTags] = useState<EnrichedTag[]>([]);
  const [crmTagSlugs, setCrmTagSlugs] = useState<EnrichedTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/activity?limit=5`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setRecent(data.events || []);
      } catch {
        if (!cancelled) setRecent([]);
      } finally {
        if (!cancelled) setLoadingRecent(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Enrollment tags — Keap + CRM tag slugs aggregated across every
  // product this user is enrolled in. Read-only here (assignment is on
  // the product, not the user).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/tags`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) {
          setKeapTags(data.keap_tags || []);
          setCrmTagSlugs(data.crm_tag_slugs || []);
        }
      } catch {
        if (!cancelled) {
          setKeapTags([]);
          setCrmTagSlugs([]);
        }
      } finally {
        if (!cancelled) setLoadingTags(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const issues = buildIssues(summary, t);
  const nextPaymentLine =
    summary.next_payment_due_at && summary.next_payment_amount !== null
      ? t('admin.users.activity.health.nextPayment', {
          amount: formatMoney(Number(summary.next_payment_amount)),
          date: new Date(summary.next_payment_due_at).toLocaleDateString(),
        })
      : null;

  return (
    <div className="space-y-6">
      {/* Health / alerts banner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {issues.length === 0
              ? <ShieldCheck className="h-5 w-5 text-green-600" />
              : <AlertTriangle className="h-5 w-5 text-amber-600" />}
            {t('admin.users.activity.health.title', 'Account health')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('admin.users.activity.health.allGood', 'No issues detected.')}
            </p>
          ) : (
            issues.map((iss, idx) => {
              const { Icon, ring, icon } = severityStyles(iss.severity);
              const Wrapper: any = iss.jumpTo && onSwitchToTab ? 'button' : 'div';
              return (
                <Wrapper
                  key={idx}
                  onClick={iss.jumpTo && onSwitchToTab ? () => onSwitchToTab(iss.jumpTo!) : undefined}
                  className={`flex items-start gap-2 p-3 border rounded-md w-full text-start ${ring} ${iss.jumpTo && onSwitchToTab ? 'hover:opacity-90 cursor-pointer' : ''}`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${icon}`} />
                  <span className="text-sm break-words flex-1">{iss.text}</span>
                </Wrapper>
              );
            })
          )}
          {nextPaymentLine && (
            <p className="text-xs text-muted-foreground pt-1">{nextPaymentLine}</p>
          )}
        </CardContent>
      </Card>

      {/* Dashboard grid: Recent activity (main) + Tags (sidebar).
          On lg+, activity spans 2 cols so the table breathes; tags
          live in a narrow sidebar so they're glanceable without
          dominating. Stacks to 1 col on phones/tablets. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity — main column */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t('admin.users.activity.overview.recentActivity', 'Recent activity')}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onSwitchToActivity}>
              {t('admin.users.activity.overview.viewAll', 'View all')}
            </Button>
          </CardHeader>
          <CardContent>
            {loadingRecent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('admin.users.activity.activity.empty', 'No activity recorded for this user yet.')}
              </p>
            ) : (
              <UserAuditTable events={recent} />
            )}
          </CardContent>
        </Card>

        {/* Enrollment tags — sidebar. Compact: one section with two
            sub-groups (Keap, CRM) separated by a divider, each
            sub-group's heading inline next to a count. Badges carry
            a title attr listing the contributing product(s) so the
            admin can trace "why does this user have tag X?". */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {t('admin.users.activity.overview.tags.title', 'Enrollment tags')}
              {(keapTags.length + crmTagSlugs.length) > 0 && (
                <span className="ms-auto text-xs font-normal text-muted-foreground tabular-nums">
                  {keapTags.length + crmTagSlugs.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTags ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : keapTags.length === 0 && crmTagSlugs.length === 0 ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  'admin.users.activity.overview.tags.empty',
                  'No tags assigned yet — products this user has enrolled in have no Keap or CRM tags configured.',
                )}
              </p>
            ) : (
              <div className="space-y-4">
                {keapTags.length > 0 && (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                        {t('admin.users.activity.overview.tags.keapHeading', 'Keap tags')}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {keapTags.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {keapTags.map((tag) => (
                        <Badge
                          key={`keap-${tag.value}`}
                          variant="secondary"
                          className="font-normal"
                          title={t(
                            'admin.users.activity.overview.tags.fromProducts',
                            { products: tag.from_products.join(', ') },
                          )}
                        >
                          {tag.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {keapTags.length > 0 && crmTagSlugs.length > 0 && (
                  <div className="border-t border-border" aria-hidden="true" />
                )}
                {crmTagSlugs.length > 0 && (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                        {t('admin.users.activity.overview.tags.crmHeading', 'CRM tags')}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {crmTagSlugs.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {crmTagSlugs.map((tag) => (
                        <Badge
                          key={`crm-${tag.value}`}
                          variant="outline"
                          className="font-normal"
                          title={t(
                            'admin.users.activity.overview.tags.fromProducts',
                            { products: tag.from_products.join(', ') },
                          )}
                        >
                          {tag.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ShieldCheck, AlertTriangle, XCircle, Tag } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useCrmTagNames } from '@/hooks/useCrmTagNames';

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

export function UserOverviewTab({ userId, summary, onSwitchToTab }: UserOverviewTabProps) {
  const { t } = useAdminLanguage();
  const [crmTagSlugs, setCrmTagSlugs] = useState<EnrichedTag[]>([]);
  // The tags' names from the CRM, in the admin's language.
  const { label: tagLabel } = useCrmTagNames();
  const [loadingTags, setLoadingTags] = useState(true);

  // Enrollment tags — CRM tag slugs aggregated across every
  // product this user is enrolled in. Read-only here (assignment is on
  // the product, not the user).
  useEffect(() => {
    if (!userId || userId === 'null' || userId === 'undefined') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/tags`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) {
          setCrmTagSlugs(data.crm_tag_slugs || []);
        }
      } catch {
        if (!cancelled) {
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

      {/* Recent activity has its own section in the user drawer, so only the tags are here. */}
      <div>
        {/* Enrollment tags — sidebar. Compact: the CRM tags, with
            the heading inline next to a count. Badges carry
            a title attr listing the contributing product(s) so the
            admin can trace "why does this user have tag X?". */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {t('admin.users.activity.overview.tags.title', 'Enrollment tags')}
              {crmTagSlugs.length > 0 && (
                <span className="ms-auto text-xs font-normal text-muted-foreground tabular-nums">
                  {crmTagSlugs.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTags ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : crmTagSlugs.length === 0 ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  'admin.users.activity.overview.tags.empty',
                  'No tags assigned yet — products this user has enrolled in have no CRM tags configured.',
                )}
              </p>
            ) : (
              <div className="space-y-4">
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
                          title={`${tag.value} · ${t(
                            'admin.users.activity.overview.tags.fromProducts',
                            { products: tag.from_products.join(', ') },
                          )}`}
                        >
                          {tagLabel(tag.value)}
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

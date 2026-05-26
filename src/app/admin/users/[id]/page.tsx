'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Pencil, KeyRound, UserX, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminLanguage } from '@/context/AppContext';
import { UserDetailDrawer } from '@/components/admin/users/UserDetailDrawer';
import { PasswordResetDialog } from '@/components/admin/users/PasswordResetDialog';
import { DeactivateUserDialog } from '@/components/admin/users/DeactivateUserDialog';
import { UserOverviewTab, type UserSummary } from '@/components/admin/users/activity/UserOverviewTab';
import { UserActivityTab } from '@/components/admin/users/activity/UserActivityTab';
import { UserAccessTab } from '@/components/admin/users/activity/UserAccessTab';
import { UserEnrollmentsTab } from '@/components/admin/users/activity/UserEnrollmentsTab';
import { UserPaymentsTab } from '@/components/admin/users/activity/UserPaymentsTab';
import { UserAttendanceTab } from '@/components/admin/users/activity/UserAttendanceTab';
import { UserGradesTab } from '@/components/admin/users/activity/UserGradesTab';
import { UserNotificationsTab } from '@/components/admin/users/activity/UserNotificationsTab';
import { UserEmailsTab } from '@/components/admin/users/activity/UserEmailsTab';
import { UserMessagesTab } from '@/components/admin/users/activity/UserMessagesTab';

const VALID_TABS = [
  'overview', 'activity', 'enrollments', 'payments',
  'attendance', 'grades', 'notifications', 'emails', 'messages', 'access',
] as const;
type TabKey = typeof VALID_TABS[number];

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// "Last activity" chip — keep it short so the chip doesn't crowd its
// neighbours. Drop the year unless the activity is from a different
// year; use 24-hour time to skip the "PM" suffix; no comma separator.
// Match the platform's existing timestamp style (no custom "Xh ago"
// strings — those read in fallback fonts and look out of place).
function formatLastActivity(iso: string | null, neverLabel: string, locale?: string) {
  if (!iso) return neverLabel;
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const datePart = d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const timePart = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} · ${timePart}`;
}

function roleBadgeVariant(role: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const r = role?.toLowerCase();
  if (r === 'owner' || r === 'super_admin') return 'destructive';
  if (r === 'admin') return 'default';
  if (r === 'instructor') return 'secondary';
  return 'outline';
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status?.toLowerCase();
  if (s === 'active') return 'default';
  if (s === 'suspended' || s === 'deleted') return 'destructive';
  if (s === 'inactive' || s === 'invited') return 'secondary';
  return 'outline';
}

export default function UserActivityPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const { t, direction } = useAdminLanguage();
  const dateLocale = direction === 'rtl' ? 'he-IL' : undefined;

  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'other' | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const initialTab = (() => {
    const raw = searchParams.get('tab') as TabKey | null;
    return raw && (VALID_TABS as readonly string[]).includes(raw) ? raw : 'overview';
  })();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const handleTabChange = (value: string) => {
    const next = (VALID_TABS as readonly string[]).includes(value) ? (value as TabKey) : 'overview';
    setActiveTab(next);
    const qs = new URLSearchParams(searchParams.toString());
    qs.set('tab', next);
    router.replace(`/admin/users/${userId}?${qs.toString()}`);
  };

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/summary`);
      if (!res.ok) {
        setError(res.status === 404 ? 'not_found' : 'other');
        return;
      }
      const data = (await res.json()) as UserSummary;
      setSummary(data);
    } catch {
      setError('other');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (error === 'not_found' || !summary) {
    return (
      <AdminLayout>
        <div className="max-w-6xl p-4 md:p-6 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/settings/users')}>
            <ArrowLeft className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('admin.users.activity.backToUsers', 'Back to users')}
          </Button>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('admin.users.activity.error', 'Failed to load. Try refreshing the page.')}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const u = summary.user;
  const fullName = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email;
  const initials = (u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '') || u.email[0];
  const neverLabel = t('admin.users.activity.never', 'Never');

  return (
    <AdminLayout>
      {/* Match the platform convention used by every other admin page:
          `max-w-6xl` so the layout stays comfortable instead of stretching
          to the full sidebar-content width. Padding scales down on phones
          (`p-4`) so the hero + chip grid don't lose 48px to gutters. */}
      <div className="max-w-6xl p-4 md:p-6 space-y-6">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/settings/users')}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t('admin.users.activity.backToUsers', 'Back to users')}
        </Button>

        {/* Modern hero — gradient backdrop, ring avatar, generous spacing.
            Mirrors the user-dashboard WelcomeHero treatment for consistency. */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 sm:p-6 md:p-8">
          {/* Decorative blurs */}
          <div className="absolute top-0 end-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
          <div className="absolute bottom-0 start-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-5">
            {/* Identity */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {/* Avatar with primary ring + status dot. Smaller on phones
                  so the 320px screens don't sacrifice the name to a
                  large 80px square. */}
              <div className="relative shrink-0">
                <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xl sm:text-2xl font-bold flex items-center justify-center overflow-hidden ring-4 ring-background shadow-lg">
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar_url} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    initials.toUpperCase()
                  )}
                </div>
                {/* Status dot */}
                <span
                  className={`absolute -bottom-1 -end-1 h-5 w-5 rounded-full border-4 border-background ${
                    u.is_active ? 'bg-green-500' : (u.status === 'suspended' ? 'bg-destructive' : 'bg-muted-foreground')
                  }`}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words leading-tight">
                  {fullName}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={roleBadgeVariant(u.role)} className="font-medium">
                    {t(`admin.users.roles.${u.role.toLowerCase()}`, u.role)}
                  </Badge>
                  <Badge variant={statusBadgeVariant(u.status ?? (u.is_active ? 'active' : 'inactive'))} className="font-medium">
                    {t(
                      `admin.users.status.${(u.status ?? (u.is_active ? 'active' : 'inactive')).toLowerCase()}`,
                      u.status ?? (u.is_active ? 'Active' : 'Inactive')
                    )}
                  </Badge>
                </div>

                {/* Email + phone */}
                <p className="text-sm text-muted-foreground mt-3 break-all">
                  {u.email}{u.phone ? ` · ${u.phone}` : ''}
                </p>

                {/* Joined / Last login */}
                <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                  <span>
                    {t('admin.users.activity.joined', 'Joined')}: {new Date(u.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    {t('admin.users.activity.lastLogin', 'Last login')}: {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : neverLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions — primary CTA gets default fill, others ghost */}
            <div className="flex flex-wrap gap-2 lg:shrink-0">
              <Button size="sm" onClick={() => setEditDrawerOpen(true)} className="shadow-sm">
                <Pencil className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('admin.users.activity.editProfile', 'Edit profile')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setResetPwOpen(true)} className="bg-background/60 backdrop-blur">
                <KeyRound className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('admin.users.activity.resetPassword', 'Reset password')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeactivateOpen(true)} className="bg-background/60 backdrop-blur">
                <UserX className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {u.is_active
                  ? t('admin.users.activity.deactivate', 'Deactivate')
                  : t('admin.users.activity.activate', 'Activate')}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary chips — outstanding goes amber when > 0; overdue chip turns
            red when overdue_count > 0; low attendance turns red when < 80%. */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <SummaryChip
            label={t('admin.users.activity.summary.enrollments', 'Enrollments')}
            value={String(summary.enrollments_total)}
          />
          <SummaryChip
            label={t('admin.users.activity.summary.active', 'Active')}
            value={String(summary.enrollments_active)}
          />
          <SummaryChip
            label={t('admin.users.activity.summary.lifetimeSpend', 'Lifetime spend')}
            value={formatMoney(Number(summary.lifetime_spend || 0))}
          />
          <SummaryChip
            label={t('admin.users.activity.summary.outstanding', 'Outstanding')}
            value={formatMoney(Number(summary.outstanding || 0))}
            tone={summary.overdue_count > 0 ? 'error' : Number(summary.outstanding || 0) > 0 ? 'warn' : 'neutral'}
            onClick={() => handleTabChange('payments')}
          />
          <SummaryChip
            label={t('admin.users.activity.summary.attendance', 'Attendance')}
            value={summary.attendance_rate !== null ? `${summary.attendance_rate}%` : '—'}
            tone={summary.attendance_rate !== null && summary.attendance_rate < 80 ? 'error' : 'neutral'}
            onClick={() => handleTabChange('attendance')}
          />
          <SummaryChip
            label={t('admin.users.activity.summary.lastActivity', 'Last activity')}
            value={formatLastActivity(summary.last_activity_at, neverLabel, dateLocale)}
            onClick={() => handleTabChange('activity')}
          />
        </div>

        {/* Tabs — 9 of them, too wide for phones. Disable wrap and put
            them inside a horizontal scroller so phone users swipe
            through tabs instead of seeing them stacked into 3 rows. */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="h-auto justify-start w-max">
              <TabsTrigger value="overview">{t('admin.users.activity.tabs.overview', 'Overview')}</TabsTrigger>
              <TabsTrigger value="activity">{t('admin.users.activity.tabs.activity', 'Activity')}</TabsTrigger>
              <TabsTrigger value="enrollments">{t('admin.users.activity.tabs.enrollments', 'Enrollments')}</TabsTrigger>
              <TabsTrigger value="payments">{t('admin.users.activity.tabs.payments', 'Payments')}</TabsTrigger>
              <TabsTrigger value="attendance">{t('admin.users.activity.tabs.attendance', 'Attendance')}</TabsTrigger>
              <TabsTrigger value="grades">{t('admin.users.activity.tabs.grades', 'Grades')}</TabsTrigger>
              <TabsTrigger value="notifications">{t('admin.users.activity.tabs.notifications', 'Notifications')}</TabsTrigger>
              <TabsTrigger value="emails">{t('admin.users.activity.tabs.emails', 'Emails')}</TabsTrigger>
              <TabsTrigger value="messages">{t('admin.users.activity.tabs.messages', 'Messages')}</TabsTrigger>
              <TabsTrigger value="access">{t('admin.users.activity.tabs.access', 'Access')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <UserOverviewTab
              userId={userId}
              summary={summary}
              onSwitchToActivity={() => handleTabChange('activity')}
              onSwitchToTab={(tab) => handleTabChange(tab)}
            />
          </TabsContent>
          <TabsContent value="activity" className="mt-6">
            <UserActivityTab userId={userId} />
          </TabsContent>
          <TabsContent value="enrollments" className="mt-6">
            <UserEnrollmentsTab userId={userId} />
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            <UserPaymentsTab userId={userId} />
          </TabsContent>
          <TabsContent value="attendance" className="mt-6">
            <UserAttendanceTab userId={userId} />
          </TabsContent>
          <TabsContent value="grades" className="mt-6">
            <UserGradesTab userId={userId} />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <UserNotificationsTab userId={userId} />
          </TabsContent>
          <TabsContent value="emails" className="mt-6">
            <UserEmailsTab userId={userId} />
          </TabsContent>
          <TabsContent value="messages" className="mt-6">
            <UserMessagesTab userId={userId} />
          </TabsContent>
          <TabsContent value="access" className="mt-6">
            <UserAccessTab userId={userId} />
          </TabsContent>
        </Tabs>

        {/* Action dialogs — reuse existing drawer/dialogs */}
        <UserDetailDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          userId={userId}
          onUpdate={loadSummary}
        />
        <PasswordResetDialog
          open={resetPwOpen}
          onOpenChange={setResetPwOpen}
          user={{
            user_id: userId,
            users: {
              email: u.email,
              first_name: u.first_name,
              last_name: u.last_name,
            },
          }}
        />
        <DeactivateUserDialog
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          user={{
            user_id: userId,
            status: u.is_active ? 'active' : 'inactive',
            users: {
              email: u.email,
              first_name: u.first_name,
              last_name: u.last_name,
            },
          }}
          onUpdate={loadSummary}
        />
      </div>
    </AdminLayout>
  );
}

function SummaryChip({
  label,
  value,
  tone = 'neutral',
  onClick,
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'warn' | 'error';
  onClick?: () => void;
}) {
  const toneRing =
    tone === 'error'
      ? 'border-destructive/40 bg-destructive/5'
      : tone === 'warn'
      ? 'border-amber-500/40 bg-amber-500/5'
      : '';
  const valueColor =
    tone === 'error' ? 'text-destructive' : tone === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-foreground';

  // Long values (a formatted date can be ~15 chars; an outstanding
  // amount is much shorter) make `text-base` overflow the chip. Drop
  // a notch for anything >10 chars so the chip stays roughly the same
  // visual weight across the row.
  const isLongValue = value.length > 10;
  return (
    <Card
      className={`${toneRing} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`${isLongValue ? 'text-sm' : 'text-base'} font-semibold mt-1 break-words ${valueColor}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

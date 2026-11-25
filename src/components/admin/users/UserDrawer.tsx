'use client';

import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import {
  Activity,
  Award,
  Bell,
  CalendarCheck,
  Check,
  Copy,
  CreditCard,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAdminLanguage } from '@/context/AppContext';
import { UserProfileForm } from '@/components/admin/users/UserProfileForm';
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
import { PasswordResetDialog } from '@/components/admin/users/PasswordResetDialog';
import { SetPasswordDialog } from '@/components/admin/users/SetPasswordDialog';
import { DeactivateUserDialog } from '@/components/admin/users/DeactivateUserDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { isUserTab, type UserTabKey } from '@/components/admin/users/userTabs';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

// The drawer sections, in the admin template's drawer look: a soft purple
// heading with an icon, a white body.
const sectionClass = 'scroll-mt-4 overflow-hidden rounded-[14px] border border-border bg-card data-[state=open]:border-primary/30';
const sectionTriggerClass =
  'min-h-[48px] bg-primary/[0.06] px-3.5 py-2.5 text-start text-sm font-bold text-primary [font-family:inherit] hover:bg-primary/10 hover:no-underline data-[state=open]:bg-primary/10 [&>svg]:text-primary';
const sectionBodyClass = 'border-t border-border px-4 pb-4 pt-4';

/** Each section's icon, so the eleven headings are easy to tell apart. */
const SECTION_ICON: Record<UserTabKey, LucideIcon> = {
  overview: LayoutDashboard,
  profile: Pencil,
  activity: Activity,
  enrollments: GraduationCap,
  payments: CreditCard,
  attendance: CalendarCheck,
  grades: Award,
  notifications: Bell,
  emails: Mail,
  messages: MessageSquare,
  access: ShieldCheck,
};
function SectionLabel({ tab, children }: { tab: UserTabKey; children: ReactNode }) {
  const Icon = SECTION_ICON[tab];
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm" aria-hidden>
        <Icon className="h-[15px] w-[15px]" />
      </span>
      {children}
    </span>
  );
}

/** The activity sections under the details, in order. */
const ACTIVITY_SECTIONS: [Exclude<UserTabKey, 'overview'>, ComponentType<{ userId: string }>][] = [
  ['activity', UserActivityTab],
  ['enrollments', UserEnrollmentsTab],
  ['payments', UserPaymentsTab],
  ['attendance', UserAttendanceTab],
  ['grades', UserGradesTab],
  ['notifications', UserNotificationsTab],
  ['emails', UserEmailsTab],
  ['messages', UserMessagesTab],
  ['access', UserAccessTab],
];

const quietButton =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border bg-card px-3 text-sm font-semibold transition-colors';

/**
 * Everything about one user, in the drawer design of the IParentingSchool
 * CRM: who they are, then tabs. The first tab has one highlighted number,
 * their details as label / value rows and the overview; the other nine are
 * the activity tabs. The actions stay as full-width buttons at the bottom.
 * Opens from the left in Hebrew. There is no separate user page any more.
 */
/** What the list already knows about the user, so the drawer can open with it at once. */
export type UserPreview = Pick<UserSummary['user'], 'id' | 'email' | 'first_name' | 'last_name' | 'role' | 'is_active'> &
  Partial<Pick<UserSummary['user'], 'status' | 'phone' | 'avatar_url' | 'last_login_at'>>;

export function UserDrawer({
  userId,
  preview,
  tab,
  onTabChange,
  onClose,
  onChanged,
}: {
  userId: string | null;
  /** Shown straight away while the full summary loads. */
  preview?: UserPreview | null;
  /** The open tab, when the caller keeps it (the Users list keeps it in the address). */
  tab?: UserTabKey;
  onTabChange?: (tab: UserTabKey) => void;
  onClose: () => void;
  /** After an edit or a status change, so the list can refresh. */
  onChanged?: () => void;
}) {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const dateLocale = rtl ? 'he-IL' : undefined;

  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [setPwOpen, setSetPwOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [ownTab, setOwnTab] = useState<UserTabKey>('overview');
  const activeTab = tab ?? ownTab;
  // Unsaved profile edits: leaving the section or closing the drawer asks first.
  const [profileDirty, setProfileDirty] = useState(false);
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const guard = (action: () => void) => {
    if (profileDirty) setPendingLeave(() => action);
    else action();
  };

  const goToTab = (next: UserTabKey) => {
    setAllClosed(false);
    if (onTabChange) onTabChange(next);
    else setOwnTab(next);
    // Bring the section that just opened to the top of the drawer.
    setTimeout(() => {
      document.getElementById(`user-section-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
  };
  const changeTab = (value: string) => {
    const next = isUserTab(value) ? value : 'overview';
    if (next === openSection) return;
    if (openSection === 'profile') guard(() => goToTab(next));
    else goToTab(next);
  };
  const requestClose = () => guard(onClose);
  // Pressing the open section closes it, leaving every section closed.
  const [allClosed, setAllClosed] = useState(false);
  const openSection = allClosed ? '' : activeTab;
  const openSectionChange = (value: string) => {
    if (value) changeTab(value);
    else if (openSection === 'profile') guard(() => setAllClosed(true));
    else setAllClosed(true);
  };

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/admin/users/${id}/summary`);
      if (!res.ok) {
        setFailed(true);
        return;
      }
      setSummary((await res.json()) as UserSummary);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    setSummary(null);
    setOwnTab('overview');
    setAllClosed(false);
    void load(userId);
  }, [userId, load]);

  const changed = () => {
    if (userId) void load(userId);
    onChanged?.();
  };

  // The list's copy of the user paints the header at once; the summary replaces it when it arrives.
  const u: UserSummary['user'] | undefined =
    summary?.user ?? (preview && preview.id === userId ? { tenant_id: '', created_at: '', ...preview } : undefined);
  const fullName = u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email : '';
  const initials = u ? ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '') || u.email[0]).toUpperCase() : '';
  const status = u ? u.status ?? (u.is_active ? 'active' : 'inactive') : '';
  const statusDot = status === 'active' ? 'bg-green-500' : status === 'suspended' ? 'bg-red-500' : status === 'invited' ? 'bg-amber-500' : 'bg-muted-foreground/50';
  const never = t('admin.users.activity.never', 'Never');

  const owes = Number(summary?.outstanding || 0);
  const overdue = (summary?.overdue_count ?? 0) > 0;

  const copyEmail = async () => {
    if (!u) return;
    try {
      await navigator.clipboard.writeText(u.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Copying was refused; the address is still there to select.
    }
  };

  const rows: { label: string; value: ReactNode }[] = u && summary
    ? [
        { label: t('admin.users.activity.joined', 'Joined'), value: new Date(u.created_at).toLocaleDateString(dateLocale) },
        { label: t('admin.users.activity.summary.lifetimeSpend', 'Lifetime spend'), value: formatMoney(Number(summary.lifetime_spend || 0)) },
        {
          label: t('admin.users.activity.summary.lastActivity', 'Last activity'),
          value: summary.last_activity_at ? new Date(summary.last_activity_at).toLocaleString(dateLocale) : never,
        },
      ]
    : [];

  const tabLabel = (tab: UserTabKey) => t(`admin.users.activity.tabs.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1));
  const dialogUser = u
    ? { user_id: userId as string, status: u.is_active ? 'active' : 'inactive', users: { email: u.email, first_name: u.first_name, last_name: u.last_name } }
    : null;

  return (
    <Sheet open={!!userId} onOpenChange={(v) => !v && requestClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest?.('.pac-container')) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest?.('.pac-container')) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest?.('.pac-container')) e.preventDefault();
        }}
        className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[880px] [&>[data-default-close]]:hidden"
      >
        <button
          type="button"
          onClick={requestClose}
          aria-label={t('common.close', 'Close')}
          className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Who they are and the numbers that matter, always in view */}
        {u && (
          <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
            <p className="inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold text-muted-foreground">
              <i className={`h-2 w-2 rounded-full ${statusDot}`} aria-hidden />
              {t(`admin.users.roles.${u.role.toLowerCase()}`, u.role)} · {t(`admin.users.status.${status.toLowerCase()}`, status)}
            </p>
            <div className="mt-1 flex items-center gap-3 pe-10">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-base font-semibold text-primary">
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <div className="min-w-0">
                <SheetTitle className="text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]">
                  <bdi>{fullName}</bdi>
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <a href={`mailto:${u.email}`} dir="ltr" className="break-all hover:text-primary hover:underline">{u.email}</a>
                      <button
                        type="button"
                        onClick={copyEmail}
                        aria-label={copied ? t('admin.users.drawer.copied', 'Copied') : t('admin.users.drawer.copy', 'Copy')}
                        title={copied ? t('admin.users.drawer.copied', 'Copied') : t('admin.users.drawer.copy', 'Copy')}
                        className="grid h-7 w-7 place-items-center rounded-md text-primary hover:bg-muted"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </span>
                    {u.phone && (
                      <a href={`tel:${u.phone}`} dir="ltr" className="hover:text-primary hover:underline">{u.phone}</a>
                    )}
                  </div>
                </SheetDescription>
              </div>
            </div>

            {!summary ? (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-card px-3 py-2.5">
                    <span className="block h-3 w-2/3 animate-pulse rounded bg-muted" />
                    <span className="mt-2 block h-5 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HeaderStat
                label={t('admin.users.drawer.enrollmentsActiveTotal', 'Enrollments (active / all)')}
                value={`${summary.enrollments_active} / ${summary.enrollments_total}`}
                onClick={() => changeTab('enrollments')}
              />
              <HeaderStat
                label={t('admin.users.activity.summary.outstanding', 'Outstanding')}
                value={formatMoney(owes)}
                tone={overdue ? 'error' : owes > 0 ? 'warn' : 'neutral'}
                onClick={() => changeTab('payments')}
              />
              <HeaderStat
                label={t('admin.users.activity.summary.attendance', 'Attendance')}
                value={summary.attendance_rate !== null ? `${summary.attendance_rate}%` : '—'}
                tone={summary.attendance_rate !== null && summary.attendance_rate < 80 ? 'error' : 'neutral'}
                onClick={() => changeTab('attendance')}
              />
              <HeaderStat
                label={t('admin.users.activity.lastLogin', 'Last login')}
                value={u.last_login_at ? new Date(u.last_login_at).toLocaleDateString(dateLocale) : never}
                onClick={() => changeTab('activity')}
              />
            </div>
            )}
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {!summary ? (
            <>
              {!u && (
                <>
                  <SheetTitle className="sr-only">{t('admin.users.drawer.title', 'User details')}</SheetTitle>
                  <SheetDescription className="sr-only">{t('admin.users.drawer.description', 'Profile, actions and activity')}</SheetDescription>
                </>
              )}
              {failed ? (
                <p className="flex min-h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
                  {t('admin.users.activity.error', 'Failed to load. Try refreshing the page.')}
                </p>
              ) : u ? (
                // The section headings keep their place while the rest loads.
                <div className="space-y-3.5" aria-busy="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-[14px] border border-border bg-primary/[0.04]" />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[300px] items-center justify-center">
                  {loading && <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Sections: opening one closes the one that was open */}
              <Accordion type="single" collapsible value={openSection} onValueChange={openSectionChange} className="space-y-3.5">
                <AccordionItem value="overview" id="user-section-overview" className={sectionClass}>
                  <AccordionTrigger className={sectionTriggerClass}>
                    <SectionLabel tab="overview">{tabLabel('overview')}</SectionLabel>
                  </AccordionTrigger>
                  <AccordionContent className={sectionBodyClass}>
                  {/* Details */}
                  <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-3">
                    {rows.map((row) => (
                      <div key={row.label}>
                        <dt className="text-[13px] text-muted-foreground">{row.label}</dt>
                        <dd className="m-0 [overflow-wrap:anywhere]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5">
                    <UserOverviewTab
                      userId={userId as string}
                      summary={summary}
                      onSwitchToTab={(next) => changeTab(next)}
                    />
                  </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="profile" id="user-section-profile" className={sectionClass}>
                  <AccordionTrigger className={sectionTriggerClass}>
                    <SectionLabel tab="profile">{t('admin.users.activity.editProfile', 'Edit profile')}</SectionLabel>
                  </AccordionTrigger>
                  <AccordionContent className={sectionBodyClass}>
                    {userId && <UserProfileForm userId={userId} onSaved={changed} onDirtyChange={setProfileDirty} actionsSlot={actionsSlot} />}
                  </AccordionContent>
                </AccordionItem>
                {ACTIVITY_SECTIONS.map(([key, Section]) => (
                  <AccordionItem key={key} value={key} id={`user-section-${key}`} className={sectionClass}>
                    <AccordionTrigger className={sectionTriggerClass}>
                      <SectionLabel tab={key}>{tabLabel(key)}</SectionLabel>
                    </AccordionTrigger>
                    <AccordionContent className={sectionBodyClass}>
                      {/* While the drawer closes the user is already cleared: nothing loads for "null". */}
                      {userId && <Section userId={userId} />}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </div>

        {/* While the profile has unsaved changes, Save / Discard take the footer's place */}
        {u && summary && profileDirty && <footer ref={setActionsSlot} className="flex min-h-[77px] shrink-0 items-center border-t border-border bg-card px-6 py-4" />}
        {u && summary && !profileDirty && (
          <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card px-6 py-4 sm:grid-cols-4">
            <button type="button" onClick={() => changeTab('profile')} className={`${quietButton} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}>
              <Pencil className="h-4 w-4" />
              {t('admin.users.activity.editProfile', 'Edit profile')}
            </button>
              <button type="button" onClick={() => setResetPwOpen(true)} className={`${quietButton} border-border text-primary hover:bg-muted`}>
                <Mail className="h-4 w-4" />
                {t('admin.users.activity.resetPassword', 'Reset password')}
              </button>
              <button type="button" onClick={() => setSetPwOpen(true)} className={`${quietButton} border-border text-primary hover:bg-muted`}>
                <KeyRound className="h-4 w-4" />
                {t('admin.users.actions.set_password', 'Set Password')}
              </button>
            <button
              type="button"
              onClick={() => setDeactivateOpen(true)}
              className={`${quietButton} ${
                u.is_active
                  ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40'
                  : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/40'
              }`}
            >
              {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              {u.is_active ? t('admin.users.activity.deactivate', 'Deactivate') : t('admin.users.activity.activate', 'Activate')}
            </button>
          </footer>
        )}

        {/* The same dialogs as before */}
        {userId && (
          <>
            <PasswordResetDialog open={resetPwOpen} onOpenChange={setResetPwOpen} user={dialogUser} />
            <SetPasswordDialog open={setPwOpen} onOpenChange={setSetPwOpen} user={dialogUser} />
            <DeactivateUserDialog open={deactivateOpen} onOpenChange={setDeactivateOpen} user={dialogUser} onUpdate={changed} />
          </>
        )}
        <AlertDialog open={!!pendingLeave} onOpenChange={(v) => !v && setPendingLeave(null)}>
          <AlertDialogContent dir={direction}>
            <AlertDialogHeader className="text-start">
              <AlertDialogTitle>{t('admin.users.drawer.unsavedChanges.title', 'Unsaved Changes')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('admin.users.drawer.unsavedChanges', 'You have unsaved changes. Are you sure you want to close?')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>{t('admin.users.drawer.unsavedChanges.stay', 'Stay')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => {
                  const action = pendingLeave;
                  setPendingLeave(null);
                  setProfileDirty(false);
                  action?.();
                }}
              >
                {t('admin.users.drawer.unsavedChanges.discard', 'Discard Changes')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

/** A small number in the pinned header; pressing it opens its section. */
function HeaderStat({
  label,
  value,
  tone = 'neutral',
  onClick,
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'warn' | 'error';
  onClick: () => void;
}) {
  const border = tone === 'error' ? 'border-red-200 dark:border-red-900' : tone === 'warn' ? 'border-amber-200 dark:border-amber-900' : 'border-border';
  const text = tone === 'error' ? 'text-red-700 dark:text-red-300' : tone === 'warn' ? 'text-amber-700 dark:text-amber-300' : 'text-foreground';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-xl border bg-card px-3 py-2.5 text-start transition-colors hover:border-primary/40 hover:bg-primary/[0.03] ${border}`}
    >
      <span className="block truncate text-[12.5px] text-muted-foreground">{label}</span>
      <span className={`block truncate text-xl font-extrabold tabular-nums ${text}`}>{value}</span>
    </button>
  );
}

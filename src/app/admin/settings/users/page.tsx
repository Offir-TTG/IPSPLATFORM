'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Ban, RefreshCw, Search, UserCheck, UserPlus, UserX, Users, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { InviteUserDialog } from '@/components/admin/users/InviteUserDialog';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserDrawer } from '@/components/admin/users/UserDrawer';
import { isUserTab, type UserTabKey } from '@/components/admin/users/userTabs';
import {
  ClearFilters,
  FilterSelect,
  IconButton,
  KpiItem,
  KpiStrip,
  ListCell,
  ListFooter,
  ListPanel,
  ListRow,
  ListRowMain,
  ListSearch,
  ListSkeleton,
  ListState,
  PageTitle,
  QuickPills,
  StatusDot,
  kitButton,
} from '@/components/admin/notifications/kit';

interface User {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  last_accessed_at?: string;
  users: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
    last_login_at?: string;
    avatar_url?: string | null;
  };
}

const PAGE_SIZE = 10;
const ROLES = ['student', 'instructor', 'staff', 'admin'] as const;
const STATUSES = ['active', 'inactive', 'suspended'] as const;
type StatusFilter = 'all' | (typeof STATUSES)[number];

/** The role word's colour: admins stand out, everyone else is plain. */
function roleTone(role: string) {
  const r = role?.toLowerCase();
  if (r === 'owner' || r === 'super_admin') return 'font-semibold text-red-700 dark:text-red-300';
  if (r === 'admin') return 'font-semibold text-primary';
  if (r === 'instructor') return 'font-medium text-blue-700 dark:text-blue-300';
  return '';
}

/**
 * The school's users, in the admin list template: the numbers strip (each
 * number filters by status), then one card with search, role, status pills,
 * the users and paging. Pressing a user opens all their details in the
 * drawer. Search, filters, pages and every action work as before.
 */
export default function UsersPage() {
  const { t, direction } = useAdminLanguage();
  const { tenantName, isAdmin } = useTenant();
  const rtl = direction === 'rtl';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [counts, setCounts] = useState<{ all: number; active: number; inactive: number; suspended: number } | null>(null);

  // The open user and tab live in the address (?user=&tab=), so a link to
  // one user's payments, say, opens straight there.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openUserId = searchParams.get('user');
  const rawTab = searchParams.get('tab');
  const openTab: UserTabKey = isUserTab(rawTab) ? rawTab : 'overview';
  const setDrawer = (userId: string | null, tab: UserTabKey = 'overview') => {
    const qs = new URLSearchParams(searchParams.toString());
    if (userId) {
      qs.set('user', userId);
      if (tab === 'overview') qs.delete('tab');
      else qs.set('tab', tab);
    } else {
      qs.delete('user');
      qs.delete('tab');
    }
    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const setOpenUserId = (userId: string | null) => setDrawer(userId);

  const [inviteOpen, setInviteOpen] = useState(false);

  // Search waits a moment after typing, as before.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Back to page 1 when the filters change.
  const filterKey = `${debouncedSearch}|${role}|${status}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const query = useCallback(
    (extra: Record<string, string>) =>
      new URLSearchParams({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(role !== 'all' && { role }),
        ...extra,
      }),
    [debouncedSearch, role],
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = query({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(status !== 'all' && { status }),
      });
      const response = await fetch(`/api/admin/tenant/users?${params}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
        setLoadError(false);
        // The list answer carries the status counts, so no extra requests are needed.
        if (data.data.counts) setCounts(data.data.counts);
        else void loadCountsRef.current();
      } else {
        setLoadError(true);
        toast.error(data.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setLoadError(true);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [query, page, status]);

  // The numbers and pill counts cover everyone matching search and role,
  // not just this page: one small request per status.
  const loadCounts = useCallback(async () => {
    try {
      const totalFor = async (s?: string) => {
        const response = await fetch(`/api/admin/tenant/users?${query({ page: '1', limit: '1', ...(s && { status: s }) })}`);
        const data = await response.json();
        return data.success ? (data.data.pagination.total as number) : 0;
      };
      const [all, active, inactive, suspended] = await Promise.all([
        totalFor(),
        totalFor('active'),
        totalFor('inactive'),
        totalFor('suspended'),
      ]);
      setCounts({ all, active, inactive, suspended });
    } catch (err) {
      console.error('Error counting users:', err);
    }
  }, [query]);

  // Older servers don't send counts with the list: then count separately.
  const loadCountsRef = useRef(loadCounts);
  loadCountsRef.current = loadCounts;

  useEffect(() => {
    if (isAdmin) void loadUsers();
  }, [isAdmin, loadUsers]);

  const refresh = () => {
    void loadUsers();
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="max-w-6xl space-y-6 p-6" dir={direction}>
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">{t('admin.users.access_required', 'Admin access required')}</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const relativeTime = (dateString?: string) => {
    if (!dateString) return t('admin.users.table.time.never', 'Never');
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (days === 0) return t('admin.users.table.time.today', 'Today');
    if (days === 1) return t('admin.users.table.time.yesterday', 'Yesterday');
    if (days < 7) return t('admin.users.table.time.days_ago', `${days} days ago`).replace('{{days}}', String(days));
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return t('admin.users.table.time.weeks_ago', `${weeks} weeks ago`).replace('{{weeks}}', String(weeks));
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return t('admin.users.table.time.months_ago', `${months} months ago`).replace('{{months}}', String(months));
    }
    const years = Math.floor(days / 365);
    return t('admin.users.table.time.years_ago', `${years} years ago`).replace('{{years}}', String(years));
  };
  const statusLabel = (s: string) => t(`admin.users.status.${s.toLowerCase()}`, s);
  const statusTone = (s: string): 'green' | 'grey' | 'orange' | 'red' =>
    s === 'active' ? 'green' : s === 'suspended' ? 'red' : s === 'invited' ? 'orange' : 'grey';
  const num = (n: number) => n.toLocaleString();
  const COLS = 'minmax(0,1fr) 140px 130px 140px';
  const filtersOn = !!search || role !== 'all' || status !== 'all';
  const clearFilters = () => {
    setSearch('');
    setRole('all');
    setStatus('all');
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const inviteButton = (
    <button type="button" onClick={() => setInviteOpen(true)} className={kitButton.primary}>
      <UserPlus className="h-4 w-4" aria-hidden />
      {t('admin.users.invite_user', 'Invite User')}
    </button>
  );

  // Loading, nothing yet, no results, or could not load: shown in place of the rows.
  let state: ReactNode = undefined;
  if (!loaded || (loading && users.length === 0)) state = <ListSkeleton />;
  else if (loadError && users.length === 0)
    state = (
      <ListState
        icon={WifiOff}
        tone="red"
        title={t('admin.list.loadError', "We couldn't load the list")}
        text={t('admin.list.loadErrorText', 'The internet connection may have dropped. Nothing was deleted.')}
        action={
          <button type="button" onClick={refresh} className={kitButton.primary}>
            {t('admin.list.retry', 'Try again')}
          </button>
        }
      />
    );
  else if (users.length === 0 && filtersOn)
    state = (
      <ListState
        icon={Search}
        tone="grey"
        title={t('admin.users.empty.title', 'No users found')}
        text={t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.')}
        action={
          <button type="button" onClick={clearFilters} className={kitButton.secondary}>
            {t('admin.users.filters.clear', 'Clear Filters')}
          </button>
        }
      />
    );
  else if (users.length === 0)
    state = (
      <ListState
        icon={Users}
        title={t('admin.users.empty.title', 'No users found')}
        text={t('admin.users.empty.description', 'Try adjusting your filters or invite new users to get started.')}
        action={inviteButton}
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={Users}
          title={t('admin.users.title', 'User Management')}
          badge={counts ? num(counts.all) : undefined}
          description={`${t('admin.users.subtitle', 'Manage users for')} ${tenantName ?? ''}`.trim()}
          actions={inviteButton}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem icon={<Users />} label={t('admin.users.stats.total', 'Total Users')} value={counts ? num(counts.all) : '—'} onClick={() => setStatus('all')} />
          <KpiItem
            icon={<UserCheck />}
            tone="green"
            label={t('admin.users.stats.active', 'Active')}
            value={counts ? num(counts.active) : '—'}
            onClick={() => toggleStatus('active')}
            active={status === 'active'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<UserX />}
            tone="grey"
            label={t('admin.users.stats.inactive', 'Inactive')}
            value={counts ? num(counts.inactive) : '—'}
            onClick={() => toggleStatus('inactive')}
            active={status === 'inactive'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Ban />}
            tone={counts && counts.suspended > 0 ? 'amber' : 'grey'}
            label={t('admin.users.stats.suspended', 'Suspended')}
            value={counts ? num(counts.suspended) : '—'}
            onClick={() => toggleStatus('suspended')}
            active={status === 'suspended'}
            activeNote={filteredNow}
          />
        </KpiStrip>

        <ListPanel
          label={t('admin.users.title', 'User Management')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.users.filters.search_placeholder', 'Search by name or email...')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
              />
              <FilterSelect
                label={t('admin.users.table.role', 'Role')}
                value={role}
                onChange={setRole}
                dir={direction}
                options={[
                  { value: 'all', label: t('admin.users.filters.all_roles', 'All Roles') },
                  ...ROLES.map((r) => ({ value: r, label: t(`admin.users.filters.role_${r}`, r) })),
                ]}
              />
              <IconButton label={t('common.refresh', 'Refresh')} onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills<StatusFilter>
                joined
                label={t('admin.users.table.status', 'Status')}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: t('admin.users.filters.all_status', 'All Status'), count: counts?.all },
                  ...STATUSES.map((s) => ({
                    value: s,
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${s === 'active' ? 'bg-green-500' : s === 'suspended' ? 'bg-red-500' : 'bg-slate-400'}`}
                          aria-hidden
                        />
                        {t(`admin.users.filters.status_${s}`, s)}
                      </span>
                    ),
                    count: counts?.[s],
                  })),
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.users.filters.clear', 'Clear Filters')} onClear={clearFilters} />
              </span>
            </>
          }
          columns={COLS}
          head={[
            t('admin.users.table.user', 'User'),
            t('admin.users.table.role', 'Role'),
            t('admin.users.table.status', 'Status'),
            t('admin.users.table.last_active', 'Last Active'),
          ]}
          state={state}
          footer={
            total > 0 ? (
              <ListFooter
                showingText={t('admin.users.list.showingRange', 'Showing {from}–{to} of {total}')
                  .replace('{from}', num((page - 1) * PAGE_SIZE + 1))
                  .replace('{to}', num(Math.min(page * PAGE_SIZE, total)))
                  .replace('{total}', num(total))}
                pageText={t('admin.users.list.pageOf', 'Page {page} of {pages}').replace('{page}', String(page)).replace('{pages}', String(totalPages))}
                page={page}
                totalPages={totalPages}
                onPage={setPage}
                prevLabel={t('admin.users.list.prevPage', 'Previous page')}
                nextLabel={t('admin.users.list.nextPage', 'Next page')}
                rtl={rtl}
              />
            ) : undefined
          }
        >
          {users.map((user) => {
            const name = `${user.users.first_name ?? ''} ${user.users.last_name ?? ''}`.trim() || user.users.email;
            const initials = ((user.users.first_name?.[0] ?? '') + (user.users.last_name?.[0] ?? '')).toUpperCase() || '?';
            return (
              <ListRow
                key={user.id}
                columns={COLS}
                onOpen={() => setOpenUserId(user.user_id)}
                label={name}
                selected={openUserId === user.user_id}
                rtl={rtl}
              >
                <ListRowMain
                  lead={
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {user.users.avatar_url ? (
                        <Image src={user.users.avatar_url} alt="" width={40} height={40} className="h-10 w-10 object-cover" />
                      ) : (
                        initials
                      )}
                    </span>
                  }
                  title={<bdi className="font-semibold">{name}</bdi>}
                  sub={<span dir="ltr">{user.users.email}</span>}
                />
                <ListCell label={t('admin.users.table.role', 'Role')}>
                  <span className={roleTone(user.role)}>{t(`admin.users.roles.${user.role.toLowerCase()}`, user.role)}</span>
                </ListCell>
                <ListCell label={t('admin.users.table.status', 'Status')}>
                  <StatusDot tone={statusTone(user.status)}>{statusLabel(user.status)}</StatusDot>
                </ListCell>
                <ListCell label={t('admin.users.table.last_active', 'Last Active')} muted>
                  {relativeTime(user.users.last_login_at || user.last_accessed_at)}
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>

      {/* One user, in the CRM drawer design. From the left in Hebrew, no frame. */}
      <UserDrawer
        userId={openUserId}
        preview={(() => {
          const row = users.find((u) => u.user_id === openUserId);
          return row
            ? {
                id: row.user_id,
                email: row.users.email,
                first_name: row.users.first_name,
                last_name: row.users.last_name,
                role: row.role,
                status: row.status,
                is_active: row.users.is_active,
                phone: row.users.phone,
                avatar_url: row.users.avatar_url ?? undefined,
                last_login_at: row.users.last_login_at,
              }
            : null;
        })()}
        tab={openTab}
        onTabChange={(next) => openUserId && setDrawer(openUserId, next)}
        onClose={() => setOpenUserId(null)}
        onChanged={refresh}
      />

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} onSuccess={refresh} />
    </AdminLayout>
  );
}

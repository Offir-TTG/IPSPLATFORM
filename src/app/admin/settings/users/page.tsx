'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserTable } from '@/components/admin/users/UserTable';
import { UserFilters } from '@/components/admin/users/UserFilters';
import { UserDetailDrawer } from '@/components/admin/users/UserDetailDrawer';
import { PasswordResetDialog } from '@/components/admin/users/PasswordResetDialog';
import { SetPasswordDialog } from '@/components/admin/users/SetPasswordDialog';
import { DeactivateUserDialog } from '@/components/admin/users/DeactivateUserDialog';
import { InviteUserDialog } from '@/components/admin/users/InviteUserDialog';
import { UserPlus, Users, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

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
  };
}

export default function UsersPage() {
  const { t, direction } = useAdminLanguage();
  const { tenantName, isAdmin } = useTenant();
  const isRtl = direction === 'rtl';

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [mounted, setMounted] = useState(false);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`/api/admin/tenant/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination((prev) => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        }));
      } else {
        toast.error(data.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (mounted) {
      loadUsers();
    }
  }, [mounted, pagination.page, pagination.limit, filters.search, filters.role, filters.status]);

  // Handlers
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  }, []);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordResetOpen(true);
  };

  const handleSetPassword = (user: User) => {
    setSelectedUser(user);
    setSetPasswordOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    setSelectedUser(user);
    setDeactivateOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">{t('admin.users.access_required', 'Admin access required')}</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Don't render until mounted (prevents hydration errors)
  if (!mounted) {
    return null;
  }

  // Calculate stats
  const stats = {
    total: pagination.total,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 suppressHydrationWarning style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              {t('admin.users.title', 'User Management')}
            </h1>
            <p suppressHydrationWarning style={{
              color: 'hsl(var(--muted-foreground))',
              fontSize: 'var(--font-size-sm)',
              marginTop: '0.25rem'
            }}>
              {t('admin.users.subtitle', 'Manage users for')} {tenantName}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('admin.users.stats.total', 'Total Users')}</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('admin.users.stats.active', 'Active')}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('admin.users.stats.inactive', 'Inactive')}</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <UserX className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('admin.users.stats.suspended', 'Suspended')}</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.suspended}</p>
                </div>
                <UserX className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="p-6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }} className="md:flex-row md:items-center">
              <div className="flex-1 w-full">
                <UserFilters onFilterChange={handleFilterChange} />
              </div>
              <Button className="w-full md:w-auto" onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t('admin.users.invite_user', 'Invite User')}
              </Button>
            </div>
          </CardContent>
        </Card>

      {/* User Table */}
      <Card>
        <CardContent className="p-6">
          <UserTable
            users={users}
            isLoading={loading}
            onEdit={handleEdit}
            onResetPassword={handleResetPassword}
            onSetPassword={handleSetPassword}
            onToggleStatus={handleToggleStatus}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.users.pagination.showing', 'Showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('admin.users.pagination.to', 'to')}{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} {t('admin.users.pagination.of', 'of')}{' '}
                {pagination.total} {t('admin.users.pagination.users', 'users')}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <span className="text-sm">
                  {t('admin.users.pagination.page', 'Page')} {pagination.page} {t('admin.users.pagination.of', 'of')} {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        </Card>

        {/* Dialogs */}
        <UserDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          userId={selectedUser?.user_id || null}
          onUpdate={loadUsers}
        />

        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onSuccess={loadUsers}
        />

        <PasswordResetDialog
          open={passwordResetOpen}
          onOpenChange={setPasswordResetOpen}
          user={selectedUser}
        />

        <SetPasswordDialog
          open={setPasswordOpen}
          onOpenChange={setSetPasswordOpen}
          user={selectedUser}
        />

        <DeactivateUserDialog
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          user={selectedUser}
          onUpdate={loadUsers}
        />
      </div>
    </AdminLayout>
  );
}

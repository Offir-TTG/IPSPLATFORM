'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Mail,
  MoreVertical,
  UserCheck,
  UserX,
  KeyRound,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminLanguage } from '@/context/AppContext';

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

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onSetPassword: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

export function UserTable({
  users,
  isLoading = false,
  onEdit,
  onResetPassword,
  onSetPassword,
  onToggleStatus,
}: UserTableProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'instructor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return t('admin.users.table.time.never', 'Never');
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return t('admin.users.table.time.today', 'Today');
    if (days === 1) return t('admin.users.table.time.yesterday', 'Yesterday');
    if (days < 7) {
      const translation = t('admin.users.table.time.days_ago', `${days} days ago`);
      return translation.replace('{{days}}', days.toString());
    }
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      const translation = t('admin.users.table.time.weeks_ago', `${weeks} weeks ago`);
      return translation.replace('{{weeks}}', weeks.toString());
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      const translation = t('admin.users.table.time.months_ago', `${months} months ago`);
      return translation.replace('{{months}}', months.toString());
    }
    const years = Math.floor(days / 365);
    const translation = t('admin.users.table.time.years_ago', `${years} years ago`);
    return translation.replace('{{years}}', years.toString());
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {t('admin.users.empty.title', 'No users found')}
        </h3>
        <p className="text-muted-foreground">
          {t('admin.users.empty.description', 'Try adjusting your filters or invite new users to get started.')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table dir={direction}>
        <TableHeader>
          <TableRow>
            <TableHead style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('admin.users.table.user', 'User')}
            </TableHead>
            <TableHead className="hidden md:table-cell" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('admin.users.table.email', 'Email')}
            </TableHead>
            <TableHead style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('admin.users.table.role', 'Role')}
            </TableHead>
            <TableHead style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('admin.users.table.status', 'Status')}
            </TableHead>
            <TableHead className="hidden lg:table-cell" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('admin.users.table.last_active', 'Last Active')}
            </TableHead>
            <TableHead style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('admin.users.table.actions', 'Actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onEdit(user)}
            >
              <TableCell style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {getInitials(user.users.first_name, user.users.last_name)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium" dir="auto">
                      {user.users.first_name} {user.users.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {user.users.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                {user.users.email}
              </TableCell>
              <TableCell style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <Badge variant={getRoleBadgeColor(user.role)}>
                  {t(`admin.users.roles.${user.role.toLowerCase()}`, user.role)}
                </Badge>
              </TableCell>
              <TableCell style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <Badge variant={getStatusBadgeColor(user.status)}>
                  {t(`admin.users.status.${user.status.toLowerCase()}`, user.status)}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                {getRelativeTime(user.users.last_login_at || user.last_accessed_at)}
              </TableCell>
              <TableCell style={{ textAlign: isRtl ? 'left' : 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(user);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRtl ? 'start' : 'end'}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onResetPassword(user);
                        }}
                      >
                        <Mail className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {t('admin.users.actions.reset_password', 'Reset Password')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetPassword(user);
                        }}
                      >
                        <KeyRound className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {t('admin.users.actions.set_password', 'Set Password')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(user);
                        }}
                      >
                        {user.status === 'active' ? (
                          <>
                            <UserX className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            {t('admin.users.actions.deactivate', 'Deactivate')}
                          </>
                        ) : (
                          <>
                            <UserCheck className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            {t('admin.users.actions.activate', 'Activate')}
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

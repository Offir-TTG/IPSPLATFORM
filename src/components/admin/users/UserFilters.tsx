'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

interface UserFiltersProps {
  onFilterChange: (filters: {
    search: string;
    role: string;
    status: string;
  }) => void;
}

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange({
      search: debouncedSearch,
      role: role === 'all' ? '' : role,
      status: status === 'all' ? '' : status,
    });
  }, [debouncedSearch, role, status, onFilterChange]);

  const hasActiveFilters = search || role !== 'all' || status !== 'all';

  const clearFilters = () => {
    setSearch('');
    setRole('all');
    setStatus('all');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
      {/* Search Input */}
      <div className="relative flex-1 w-full md:max-w-sm">
        <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
        <Input
          placeholder={t('admin.users.filters.search_placeholder', 'Search by name or email...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={isRtl ? 'pr-9 pl-9' : 'pl-9 pr-9'}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role Filter */}
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder={t('admin.users.filters.all_roles', 'All Roles')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('admin.users.filters.all_roles', 'All Roles')}</SelectItem>
          <SelectItem value="student">{t('admin.users.filters.role_student', 'Student')}</SelectItem>
          <SelectItem value="instructor">{t('admin.users.filters.role_instructor', 'Instructor')}</SelectItem>
          <SelectItem value="staff">{t('admin.users.filters.role_staff', 'Staff')}</SelectItem>
          <SelectItem value="admin">{t('admin.users.filters.role_admin', 'Admin')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder={t('admin.users.filters.all_status', 'All Status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('admin.users.filters.all_status', 'All Status')}</SelectItem>
          <SelectItem value="active">{t('admin.users.filters.status_active', 'Active')}</SelectItem>
          <SelectItem value="inactive">{t('admin.users.filters.status_inactive', 'Inactive')}</SelectItem>
          <SelectItem value="suspended">{t('admin.users.filters.status_suspended', 'Suspended')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full md:w-auto"
        >
          <X className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('admin.users.filters.clear', 'Clear Filters')}
        </Button>
      )}
    </div>
  );
}

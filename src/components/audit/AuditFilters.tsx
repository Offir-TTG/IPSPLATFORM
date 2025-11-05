'use client';

import { useState, useEffect } from 'react';
import { X, Search, Calendar } from 'lucide-react';

interface AuditFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  isAdmin?: boolean;
  t?: (key: string, fallback: string) => string;
}

export interface FilterState {
  dateFrom?: string;
  dateTo?: string;
  eventTypes?: string[];
  eventCategories?: string[];
  resourceTypes?: string[];
  riskLevels?: string[];
  status?: string[];
  search?: string;
}

export function AuditFilters({ onFilterChange, isAdmin = false, t = (_, fallback) => fallback }: AuditFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const eventTypes = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'ACCESS'];
  const eventCategories = [
    { value: 'ALL', label: t('admin.audit.filters.allCategories', 'All Categories') },
    { value: 'SECURITY', label: t('admin.audit.filters.category.security', 'Security') },
    { value: 'AUTH', label: t('admin.audit.filters.category.auth', 'Authentication') },
    { value: 'CONFIG', label: t('admin.audit.filters.category.config', 'Configuration') },
    { value: 'DATA', label: t('admin.audit.filters.category.data', 'Data') },
    { value: 'ADMIN', label: t('admin.audit.filters.category.admin', 'Admin') },
    { value: 'STUDENT_RECORD', label: t('admin.audit.filters.category.studentRecord', 'Student Records') },
    { value: 'GRADE', label: t('admin.audit.filters.category.grade', 'Grades') },
    { value: 'ATTENDANCE', label: t('admin.audit.filters.category.attendance', 'Attendance') },
  ];
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const statusOptions = ['success', 'failure', 'partial'];

  // Smart debouncing for search
  useEffect(() => {
    if (searchTerm.length === 0 || searchTerm.length <= 2) {
      setDebouncedSearchTerm(searchTerm);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update filters when debounced search changes
  useEffect(() => {
    updateFilter('search', debouncedSearchTerm || undefined);
  }, [debouncedSearchTerm]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const current = (filters[key] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, newValue.length > 0 ? newValue : undefined);
  };

  const setCategory = (category: string) => {
    if (category === 'ALL') {
      updateFilter('eventCategories', undefined);
    } else {
      updateFilter('eventCategories', [category]);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setDebouncedSearchTerm('');
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => {
    if (v === undefined || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });

  const selectedCategory = filters.eventCategories?.[0] || 'ALL';

  return (
    <div style={{
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'calc(var(--radius) * 2)',
      overflow: 'hidden'
    }}>
      {/* Search Bar */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              type="text"
              placeholder={t('admin.audit.filters.searchPlaceholder', 'Search actions, descriptions, users...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--text-body))',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary))';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
              }}
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                border: '1px solid hsl(var(--destructive))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                backgroundColor: 'transparent',
                color: 'hsl(var(--destructive))',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                fontFamily: 'var(--font-family-primary)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X className="h-4 w-4" />
              {t('common.clear', 'Clear All')}
            </button>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-body))',
              marginBottom: '0.5rem'
            }}>
              <Calendar className="h-4 w-4" />
              {t('admin.audit.filters.dateFrom', 'From Date')}
            </label>
            <input
              type="datetime-local"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--text-body))',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary))';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-body))',
              marginBottom: '0.5rem'
            }}>
              <Calendar className="h-4 w-4" />
              {t('admin.audit.filters.dateTo', 'To Date')}
            </label>
            <input
              type="datetime-local"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--text-body))',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary))';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
              }}
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        borderBottom: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--muted) / 0.3)'
      }}>
        {eventCategories.map((category) => {
          const isSelected = selectedCategory === category.value;
          return (
            <button
              key={category.value}
              onClick={() => setCategory(category.value)}
              style={{
                padding: '0.875rem 1.5rem',
                fontSize: 'var(--font-size-sm)',
                fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                fontFamily: 'var(--font-family-primary)',
                color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                backgroundColor: isSelected ? 'hsl(var(--background))' : 'transparent',
                borderBottom: isSelected ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                border: 'none',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.color = 'hsl(var(--text-body))';
                  e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.color = 'hsl(var(--text-muted))';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Filter Pills */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* Event Types */}
        <div>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            fontFamily: 'var(--font-family-primary)',
            color: 'hsl(var(--text-heading))',
            marginBottom: '0.75rem'
          }}>
            {t('admin.audit.filters.eventTypes', 'Event Types')}
          </div>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => {
              const isSelected = (filters.eventTypes || []).includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleArrayFilter('eventTypes', type)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'calc(var(--radius) * 4)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                    backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text-body))',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                    }
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Risk Levels */}
        <div>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            fontFamily: 'var(--font-family-primary)',
            color: 'hsl(var(--text-heading))',
            marginBottom: '0.75rem'
          }}>
            {t('admin.audit.filters.riskLevels', 'Risk Levels')}
          </div>
          <div className="flex flex-wrap gap-2">
            {riskLevels.map((level) => {
              const isSelected = (filters.riskLevels || []).includes(level);
              const colors = {
                low: { bg: '142 71% 45%', text: 'white' },
                medium: { bg: '45 93% 47%', text: 'white' },
                high: { bg: '25 95% 53%', text: 'white' },
                critical: { bg: '0 84% 60%', text: 'white' },
              };
              const levelColor = colors[level as keyof typeof colors];

              return (
                <button
                  key={level}
                  onClick={() => toggleArrayFilter('riskLevels', level)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'calc(var(--radius) * 4)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                    backgroundColor: isSelected ? `hsl(${levelColor.bg})` : 'hsl(var(--muted))',
                    color: isSelected ? levelColor.text : 'hsl(var(--text-body))',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                    }
                  }}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            fontFamily: 'var(--font-family-primary)',
            color: 'hsl(var(--text-heading))',
            marginBottom: '0.75rem'
          }}>
            {t('admin.audit.filters.status', 'Status')}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((stat) => {
              const isSelected = (filters.status || []).includes(stat);
              return (
                <button
                  key={stat}
                  onClick={() => toggleArrayFilter('status', stat)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'calc(var(--radius) * 4)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                    backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text-body))',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                    }
                  }}
                >
                  {stat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

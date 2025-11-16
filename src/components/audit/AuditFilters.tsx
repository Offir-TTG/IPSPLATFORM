'use client';

import { useState, useEffect } from 'react';
import { X, Search, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { EventType, RiskLevel, EventStatus } from '@/lib/audit/types';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const eventTypes: EventType[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'ACCESS'];
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
  const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
  const statusOptions: EventStatus[] = ['success', 'failure', 'partial'];

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

  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.eventTypes?.length,
    filters.riskLevels?.length,
    filters.status?.length,
    selectedCategory !== 'ALL' ? 1 : 0
  ].filter(Boolean).length;

  return (
    <div style={{
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'calc(var(--radius) * 2)',
      overflow: 'hidden'
    }}>
      {/* Compact Header */}
      <div style={{
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Search Input - Compact */}
        <div className="flex-1 relative" style={{ minWidth: '250px' }}>
          <Search
            className="h-4 w-4"
            style={{
              position: 'absolute',
              insetInlineStart: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--text-muted))'
            }}
          />
          <input
            type="text"
            placeholder={t('admin.audit.filters.searchPlaceholder', 'Search...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingInlineStart: '2.25rem',
              paddingInlineEnd: '0.75rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
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

        {/* Category Tabs - Inline */}
        <div className="flex flex-wrap gap-1">
          {eventCategories.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: '0.375rem 0.625rem',
                  borderRadius: 'calc(var(--radius) * 3)',
                  fontSize: '0.6875rem',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontFamily: 'var(--font-family-primary)',
                  backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                  color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text-body))',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap'
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
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            border: isExpanded ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
            borderRadius: 'calc(var(--radius) * 1.5)',
            backgroundColor: isExpanded ? 'hsl(var(--primary) / 0.1)' : 'transparent',
            color: isExpanded ? 'hsl(var(--primary))' : 'hsl(var(--text-body))',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            fontFamily: 'var(--font-family-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.borderColor = 'hsl(var(--primary))';
              e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
            }
          }}
          onMouseLeave={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.borderColor = 'hsl(var(--border))';
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Filter className="h-4 w-4" />
          {t('admin.audit.filters.filters', 'Filters')}
          {activeFilterCount > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '1.25rem',
              height: '1.25rem',
              padding: '0 0.25rem',
              borderRadius: '999px',
              backgroundColor: 'hsl(var(--primary))',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              border: 'none',
              borderRadius: 'calc(var(--radius) * 1.5)',
              backgroundColor: 'transparent',
              color: 'hsl(var(--destructive))',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: 'var(--font-family-primary)',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="h-4 w-4" />
            {t('common.clear', 'Clear')}
          </button>
        )}
      </div>

      {/* Expandable Advanced Filters */}
      {isExpanded && (
        <div style={{
          padding: '0 1.5rem 1.5rem 1.5rem',
          borderTop: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--muted) / 0.2)'
        }}>
          {/* Date Range - Horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ marginBottom: '1rem', paddingTop: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.375rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.filters.dateFrom', 'From')}
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
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.375rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.filters.dateTo', 'To')}
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
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Event Types */}
            <div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.filters.eventTypes', 'Types')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {eventTypes.map((type) => {
                  const isSelected = (filters.eventTypes || []).includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleArrayFilter('eventTypes', type)}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: 'calc(var(--radius) * 3)',
                        fontSize: '0.6875rem',
                        fontWeight: 'var(--font-weight-medium)',
                        fontFamily: 'var(--font-family-primary)',
                        backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                        color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text-body))',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {t(`admin.audit.filters.eventType.${type.toLowerCase()}`, type)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Risk Levels */}
            <div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.filters.riskLevels', 'Risk')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {riskLevels.map((level) => {
                  const isSelected = (filters.riskLevels || []).includes(level);
                  const colorMap = {
                    low: { bg: 'var(--success)', fg: 'var(--success-foreground)' },
                    medium: { bg: 'var(--warning)', fg: 'var(--warning-foreground)' },
                    high: { bg: 'var(--warning)', fg: 'var(--warning-foreground)' },
                    critical: { bg: 'var(--destructive)', fg: 'var(--destructive-foreground)' },
                  };
                  const levelColors = colorMap[level];

                  return (
                    <button
                      key={level}
                      onClick={() => toggleArrayFilter('riskLevels', level)}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: 'calc(var(--radius) * 3)',
                        fontSize: '0.6875rem',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontFamily: 'var(--font-family-primary)',
                        backgroundColor: isSelected ? `hsl(${levelColors.bg})` : 'hsl(var(--muted))',
                        color: isSelected ? `hsl(${levelColors.fg})` : 'hsl(var(--text-body))',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textTransform: 'uppercase'
                      }}
                    >
                      {t(`admin.audit.filters.riskLevel.${level}`, level.toUpperCase())}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.filters.status', 'Status')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((stat) => {
                  const isSelected = (filters.status || []).includes(stat);
                  return (
                    <button
                      key={stat}
                      onClick={() => toggleArrayFilter('status', stat)}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: 'calc(var(--radius) * 3)',
                        fontSize: '0.6875rem',
                        fontWeight: 'var(--font-weight-medium)',
                        fontFamily: 'var(--font-family-primary)',
                        backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                        color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text-body))',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textTransform: 'capitalize'
                      }}
                    >
                      {t(`admin.audit.filters.statusValue.${stat}`, stat.charAt(0).toUpperCase() + stat.slice(1))}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

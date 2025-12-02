'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AuditEventsTable } from '@/components/audit/AuditEventsTable';
import { AuditFilters, FilterState } from '@/components/audit/AuditFilters';
import { useAdminLanguage } from '@/context/AppContext';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { AuditEvent } from '@/lib/audit/types';

export default function AdminAuditPage() {
  const { t } = useAdminLanguage();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [stats, setStats] = useState({
    totalEvents: 0,
    highRiskEvents: 0,
    failedEvents: 0,
    todayEvents: 0,
  });

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [filters, page]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query params
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.eventTypes) params.append('event_types', filters.eventTypes.join(','));
      if (filters.eventCategories) params.append('event_categories', filters.eventCategories.join(','));
      if (filters.resourceTypes) params.append('resource_types', filters.resourceTypes.join(','));
      if (filters.riskLevels) params.append('risk_levels', filters.riskLevels.join(','));
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/audit/events?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load audit events');
      }

      setEvents(data.data || []);
      setTotalCount(data.count || 0);
    } catch (err: any) {
      console.error('Load events error:', err);
      setError(err.message || 'Failed to load audit events');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get stats from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [totalRes, highRiskRes, failedRes, todayRes] = await Promise.all([
        fetch('/api/audit/events?limit=1'), // Just to get total count
        fetch(`/api/audit/events?risk_levels=high,critical&limit=1`),
        fetch(`/api/audit/events?status=failure&limit=1`),
        fetch(`/api/audit/events?date_from=${yesterday.toISOString()}&limit=1`),
      ]);

      const [total, highRisk, failed, today] = await Promise.all([
        totalRes.json(),
        highRiskRes.json(),
        failedRes.json(),
        todayRes.json(),
      ]);

      setStats({
        totalEvents: total.count || 0,
        highRiskEvents: highRisk.count || 0,
        failedEvents: failed.count || 0,
        todayEvents: today.count || 0,
      });
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };

  const handleExport = async () => {
    try {
      // TODO: Implement export functionality
      alert('Export functionality coming soon');
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Shield className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
            {t('admin.audit.title', 'Audit Trail')}
          </h1>
          <p style={{
            color: 'hsl(var(--text-muted))',
            marginTop: '0.5rem',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            {t('admin.audit.subtitle', 'Monitor all system activities and compliance events')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div style={{
            backgroundColor: 'hsl(var(--card))',
            padding: '1rem',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              fontFamily: 'var(--font-family-heading)'
            }}>{stats.totalEvents.toLocaleString()}</div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.audit.stats.total', 'Total Events')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'hsl(var(--card))',
            padding: '1rem',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--destructive))',
              fontFamily: 'var(--font-family-heading)'
            }}>{stats.highRiskEvents.toLocaleString()}</div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.audit.stats.highRisk', 'High Risk')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'hsl(var(--card))',
            padding: '1rem',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--destructive))',
              fontFamily: 'var(--font-family-heading)'
            }}>{stats.failedEvents.toLocaleString()}</div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.audit.stats.failed', 'Failed Actions')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'hsl(var(--card))',
            padding: '1rem',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--primary))',
              fontFamily: 'var(--font-family-heading)'
            }}>{stats.todayEvents.toLocaleString()}</div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.audit.stats.today', 'Last 24 Hours')}
            </div>
          </div>
        </div>

        {/* Filters */}
        <AuditFilters onFilterChange={handleFilterChange} isAdmin={true} t={t} />

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive))',
            color: 'hsl(var(--destructive))',
            padding: '0.75rem 1rem',
            borderRadius: 'calc(var(--radius) * 1.5)',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            <p>{error}</p>
          </div>
        )}

        {/* Events Table */}
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '16rem',
            backgroundColor: 'hsl(var(--card))',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <RefreshCw className="h-8 w-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
          </div>
        ) : (
          <>
            <AuditEventsTable events={events} isAdmin={true} t={t} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) * 2)'
              }}>
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'hsl(var(--text-muted))',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  {t('common.page', 'Page')} {page + 1} {t('common.of', 'of')} {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0 || loading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--secondary-foreground))',
                      borderRadius: 'var(--radius)',
                      cursor: page === 0 || loading ? 'not-allowed' : 'pointer',
                      opacity: page === 0 || loading ? 0.5 : 1,
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: 'none'
                    }}
                    className="hover:opacity-90 transition-opacity"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('common.previous', 'Previous')}
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1 || loading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderRadius: 'var(--radius)',
                      cursor: page >= totalPages - 1 || loading ? 'not-allowed' : 'pointer',
                      opacity: page >= totalPages - 1 || loading ? 0.5 : 1,
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: 'none'
                    }}
                    className="hover:opacity-90 transition-opacity"
                  >
                    {t('common.next', 'Next')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

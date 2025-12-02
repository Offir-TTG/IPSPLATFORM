'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AuditEventsTable } from '@/components/audit/AuditEventsTable';
import { AuditFilters, FilterState } from '@/components/audit/AuditFilters';
import { useUserLanguage } from '@/context/AppContext';
import { Eye, Shield, AlertCircle, RefreshCw, Info } from 'lucide-react';
import type { AuditEvent } from '@/lib/audit/types';

export default function MyActivityPage() {
  const { t } = useUserLanguage();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(25);

  useEffect(() => {
    loadMyActivity();
  }, [filters, page]);

  const loadMyActivity = async () => {
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
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/audit/events?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load activity');
      }

      setEvents(data.data || []);
      setTotalCount(data.count || 0);
    } catch (err: any) {
      console.error('Load activity error:', err);
      setError(err.message || 'Failed to load your activity');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(0);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
              <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              {t('myActivity.title', 'My Activity')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('myActivity.subtitle', 'View your account activity and access history')}
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">
                  {t('myActivity.info.title', 'Privacy & Transparency')}
                </p>
                <p>
                  {t(
                    'myActivity.info.description',
                    'This page shows all activities performed on your account. We keep this record for your security and to comply with educational privacy laws (FERPA).'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('myActivity.stats.total', 'Total Activities')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {totalCount.toLocaleString()}
                  </p>
                </div>
                <Eye className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('myActivity.stats.thisPage', 'On This Page')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {events.length}
                  </p>
                </div>
                <Shield className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('myActivity.stats.protected', 'Data Protected')}
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                    FERPA Compliant
                  </p>
                </div>
                <AlertCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <AuditFilters onFilterChange={handleFilterChange} isAdmin={false} />

          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={loadMyActivity}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh', 'Refresh')}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          {/* Events Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <AuditEventsTable events={events} isAdmin={false} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('common.showing', 'Showing')} {page * limit + 1} {t('common.to', 'to')}{' '}
                    {Math.min((page + 1) * limit, totalCount)} {t('common.of', 'of')} {totalCount}{' '}
                    {t('common.activities', 'activities')}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('common.previous', 'Previous')}
                    </button>

                    <span className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.page', 'Page')} {page + 1} {t('common.of', 'of')} {totalPages}
                    </span>

                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('common.next', 'Next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Privacy Notice */}
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">
              {t('myActivity.privacy.title', 'Your Privacy Rights')}
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                {t(
                  'myActivity.privacy.ferpa',
                  'Your educational records are protected under FERPA regulations'
                )}
              </li>
              <li>
                {t(
                  'myActivity.privacy.access',
                  'You have the right to review who accessed your information'
                )}
              </li>
              <li>
                {t(
                  'myActivity.privacy.retention',
                  'Activity logs are retained for 7 years for compliance purposes'
                )}
              </li>
              <li>
                {t(
                  'myActivity.privacy.security',
                  'All activity is encrypted and tamper-proof for your security'
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

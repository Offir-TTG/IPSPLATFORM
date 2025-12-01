'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SuperAdminLayout } from '@/components/admin/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Stats {
  overview: {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    total_courses: number;
    recent_tenants_30d: number;
  };
  by_tier: Record<string, number>;
  monthly_growth: Record<string, number>;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/superadmin/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to load statistics');
      }
    } catch (err) {
      setError('Error loading statistics');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (error) {
    return (
      <SuperAdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
            {error}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            If you are not a super admin, you do not have access to this page.
          </p>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="p-3 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Super Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Platform-wide overview and management</p>
        </div>
        <Button onClick={() => router.push('/superadmin/tenants')} className="w-full sm:w-auto">
          Manage Tenants
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tenants</h3>
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.overview.total_tenants || 0}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {stats?.overview.active_tenants || 0} active
          </p>
        </div>

        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</h3>
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.overview.total_users || 0}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Across all tenants
          </p>
        </div>

        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Courses</h3>
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.overview.total_courses || 0}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Platform-wide
          </p>
        </div>

        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">New Tenants (30d)</h3>
            <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.overview.recent_tenants_30d || 0}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Last 30 days
          </p>
        </div>
      </div>

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Tenants by Subscription Tier</h2>
          <div className="space-y-3">
            {stats?.by_tier && Object.keys(stats.by_tier).length > 0 ? (
              Object.entries(stats.by_tier).map(([tier, count]) => (
                <div key={tier} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
                      tier === 'enterprise' ? 'bg-purple-500' :
                      tier === 'professional' ? 'bg-blue-500' :
                      tier === 'basic' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`}></span>
                    <span className="capitalize text-foreground">{tier}</span>
                  </div>
                  <span className="font-semibold text-foreground">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Monthly Growth (Last 6 Months)</h2>
          <div className="space-y-3">
            {stats?.monthly_growth && Object.keys(stats.monthly_growth).length > 0 ? (
              Object.entries(stats.monthly_growth)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([month, count]) => (
                  <div key={month} className="flex justify-between items-center">
                    <span className="text-foreground">
                      {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 bg-muted rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min((count as number) * 20, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-foreground w-8 text-end">{count}</span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Button
            onClick={() => router.push('/superadmin/tenants')}
            className="w-full justify-start"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            View All Tenants
          </Button>
          <Button
            onClick={() => router.push('/superadmin/tenants/create')}
            className="w-full justify-start"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Tenant
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="w-full justify-start bg-gray-500 hover:bg-gray-600"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Statistics
          </Button>
        </div>
      </div>
      </div>
    </SuperAdminLayout>
  );
}

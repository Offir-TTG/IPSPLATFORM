'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SuperAdminLayout } from '@/components/admin/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tenant } from '@/lib/tenant/types';

export default function TenantsListPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgTypeFilter, setOrgTypeFilter] = useState('all');
  const [orgSizeFilter, setOrgSizeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [healthScoreFilter, setHealthScoreFilter] = useState('all');
  const [onboardingFilter, setOnboardingFilter] = useState('all');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/tenants');
      const data = await response.json();

      if (data.success) {
        setTenants(data.data);
      } else {
        setError(data.error || 'Failed to load tenants');
      }
    } catch (err) {
      setError('Error loading tenants');
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete tenant "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/tenants/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setTenants(tenants.filter((t) => t.id !== id));
      } else {
        alert(data.error || 'Failed to delete tenant');
      }
    } catch (err) {
      alert('Error deleting tenant');
      console.error('Error deleting tenant:', err);
    }
  };

  // Filter tenants based on all active filters
  const filteredTenants = tenants.filter((tenant) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !tenant.name.toLowerCase().includes(query) &&
        !tenant.slug.toLowerCase().includes(query) &&
        !tenant.admin_email.toLowerCase().includes(query) &&
        !(tenant.country?.toLowerCase() || '').includes(query)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && tenant.status !== statusFilter) {
      return false;
    }

    // Organization type filter
    if (orgTypeFilter !== 'all' && tenant.organization_type !== orgTypeFilter) {
      return false;
    }

    // Organization size filter
    if (orgSizeFilter !== 'all' && tenant.organization_size !== orgSizeFilter) {
      return false;
    }

    // Country filter
    if (countryFilter !== 'all' && tenant.country !== countryFilter) {
      return false;
    }

    // Health score filter
    if (healthScoreFilter !== 'all') {
      const score = tenant.health_score || 0;
      if (healthScoreFilter === 'high' && score < 80) return false;
      if (healthScoreFilter === 'medium' && (score < 50 || score >= 80)) return false;
      if (healthScoreFilter === 'low' && score >= 50) return false;
    }

    // Onboarding filter
    if (onboardingFilter !== 'all') {
      if (onboardingFilter === 'completed' && !tenant.onboarding_completed) return false;
      if (onboardingFilter === 'in_progress' && (tenant.onboarding_completed || tenant.onboarding_step === 0)) return false;
      if (onboardingFilter === 'pending' && tenant.onboarding_step !== 0) return false;
    }

    // Subscription status filter
    if (subscriptionStatusFilter !== 'all' && tenant.subscription_status !== subscriptionStatusFilter) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      trial: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      suspended: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
      cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getHealthScoreBadge = (score: number | null) => {
    if (score === null) return { color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700', label: 'N/A' };
    if (score >= 80) return { color: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800', label: `${score}` };
    if (score >= 50) return { color: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800', label: `${score}` };
    return { color: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800', label: `${score}` };
  };

  const getOnboardingBadge = (tenant: Tenant) => {
    if (tenant.onboarding_completed) {
      return { color: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800', label: 'Completed' };
    }
    if (tenant.onboarding_step > 0) {
      return { color: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800', label: `Step ${tenant.onboarding_step}/6` };
    }
    return { color: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800', label: 'Pending' };
  };

  const getOrgTypeIcon = (type: string | null) => {
    const icons = {
      university: '🎓',
      college: '📚',
      school: '🏫',
      training_center: '📖',
      corporate: '🏢',
      non_profit: '🤝',
      government: '🏛️',
      other: '🏷️',
    };
    return type ? icons[type as keyof typeof icons] || '🏷️' : '—';
  };

  const getCountryFlag = (country: string | null) => {
    const flags: Record<string, string> = {
      US: '🇺🇸',
      IL: '🇮🇱',
      GB: '🇬🇧',
      CA: '🇨🇦',
      AU: '🇦🇺',
      DE: '🇩🇪',
      FR: '🇫🇷',
      ES: '🇪🇸',
      IT: '🇮🇹',
      NL: '🇳🇱',
    };
    return country ? flags[country] || '🌍' : '—';
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOrgTypeFilter('all');
    setOrgSizeFilter('all');
    setCountryFilter('all');
    setHealthScoreFilter('all');
    setOnboardingFilter('all');
    setSubscriptionStatusFilter('all');
  };

  const activeFiltersCount = [
    statusFilter !== 'all',
    orgTypeFilter !== 'all',
    orgSizeFilter !== 'all',
    countryFilter !== 'all',
    healthScoreFilter !== 'all',
    onboardingFilter !== 'all',
    subscriptionStatusFilter !== 'all',
  ].filter(Boolean).length;

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
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-4 text-red-800 dark:text-red-200">
            {error}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="p-3 sm:p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Organization Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage all platform organizations • {filteredTenants.length} of {tenants.length} organization{tenants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => router.push('/superadmin/tenants/create')} className="w-full sm:w-auto">
            Create Organization
          </Button>
        </div>

        {/* Search and Filter Toggle */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, slug, email, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 text-sm sm:text-base border border-border rounded bg-background text-foreground"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="relative w-full sm:w-auto whitespace-nowrap"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-card rounded-lg shadow border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
              {activeFiltersCount > 0 && (
                <Button onClick={resetFilters} variant="outline" size="sm">
                  Reset All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Organization Type</label>
                <select
                  value={orgTypeFilter}
                  onChange={(e) => setOrgTypeFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                >
                  <option value="all">All Types</option>
                  <option value="university">University</option>
                  <option value="college">College</option>
                  <option value="school">School</option>
                  <option value="training_center">Training Center</option>
                  <option value="corporate">Corporate</option>
                  <option value="non_profit">Non-Profit</option>
                  <option value="government">Government</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Organization Size</label>
                <select
                  value={orgSizeFilter}
                  onChange={(e) => setOrgSizeFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                >
                  <option value="all">All Sizes</option>
                  <option value="1-50">1-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Country</label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                >
                  <option value="all">All Countries</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="IL">🇮🇱 Israel</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="FR">🇫🇷 France</option>
                  <option value="ES">🇪🇸 Spain</option>
                  <option value="IT">🇮🇹 Italy</option>
                  <option value="NL">🇳🇱 Netherlands</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Health Score</label>
                <select
                  value={healthScoreFilter}
                  onChange={(e) => setHealthScoreFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                >
                  <option value="all">All Scores</option>
                  <option value="high">High (80+)</option>
                  <option value="medium">Medium (50-79)</option>
                  <option value="low">Low (&lt;50)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Onboarding Status</label>
                <select
                  value={onboardingFilter}
                  onChange={(e) => setOnboardingFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Subscription Status</label>
                <select
                  value={subscriptionStatusFilter}
                  onChange={(e) => setSubscriptionStatusFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                  <option value="trialing">Trialing</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden lg:block bg-card rounded-lg shadow border border-border overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Country
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Health
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Onboarding
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredTenants.map((tenant) => {
                const healthBadge = getHealthScoreBadge(tenant.health_score);
                const onboardingBadge = getOnboardingBadge(tenant);

                return (
                  <tr key={tenant.id} className="hover:bg-muted/30">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-foreground">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                        <div className="text-xs text-muted-foreground">{tenant.admin_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-2xl" title={tenant.organization_type || 'Not set'}>
                        {getOrgTypeIcon(tenant.organization_type)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-2xl" title={tenant.country || 'Not set'}>
                        {getCountryFlag(tenant.country)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${healthBadge.color}`}>
                        {healthBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${onboardingBadge.color}`}>
                        {onboardingBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {tenant.tags && tenant.tags.length > 0 ? (
                          tenant.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {tenant.tags && tenant.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                            +{tenant.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {tenant.last_activity_at
                        ? new Date(tenant.last_activity_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/superadmin/tenants/${tenant.id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTenants.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || activeFiltersCount > 0 ? 'No tenants match your filters' : 'No tenants found'}
            </div>
          )}
        </div>

        {/* Mobile Card View - Shown on Mobile */}
        <div className="lg:hidden space-y-4">
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg shadow border border-border">
              {searchQuery || activeFiltersCount > 0 ? 'No tenants match your filters' : 'No tenants found'}
            </div>
          ) : (
            filteredTenants.map((tenant) => {
              const healthBadge = getHealthScoreBadge(tenant.health_score);
              const onboardingBadge = getOnboardingBadge(tenant);

              return (
                <div key={tenant.id} className="bg-card rounded-lg shadow border border-border p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-base truncate">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{tenant.slug}</div>
                      <div className="text-xs text-muted-foreground truncate">{tenant.admin_email}</div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <span className="text-xl" title={tenant.organization_type || 'Not set'}>
                        {getOrgTypeIcon(tenant.organization_type)}
                      </span>
                      <span className="text-xl" title={tenant.country || 'Not set'}>
                        {getCountryFlag(tenant.country)}
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(tenant.status)}`}>
                      {tenant.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${healthBadge.color}`}>
                      Health: {healthBadge.label}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${onboardingBadge.color}`}>
                      {onboardingBadge.label}
                    </span>
                  </div>

                  {/* Tags */}
                  {tenant.tags && tenant.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tenant.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                      {tenant.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          +{tenant.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Last Activity */}
                  <div className="text-xs text-muted-foreground mb-3">
                    Last activity: {tenant.last_activity_at ? new Date(tenant.last_activity_at).toLocaleDateString() : 'Never'}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => router.push(`/superadmin/tenants/${tenant.id}`)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tenant.id, tenant.name)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded hover:bg-red-100 dark:hover:bg-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

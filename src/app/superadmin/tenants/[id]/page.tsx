'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SuperAdminLayout } from '@/components/admin/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tenant } from '@/lib/tenant/types';

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenantData, setTenantData] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resendingInvitation, setResendingInvitation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    admin_name: '',
    admin_email: '',

    // Organization Details
    organization_type: '',
    industry: '',
    organization_size: '',
    website_url: '',
    description: '',

    // Contact Information
    phone_number: '',
    support_email: '',
    support_phone: '',
    billing_email: '',
    notification_email: '',
    technical_contact_name: '',
    technical_contact_email: '',
    technical_contact_phone: '',

    // Address
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',

    // Tax & Legal
    legal_name: '',
    tax_id: '',
    registration_number: '',

    // Regional Settings (Language is fixed to English, shown as read-only)
    timezone: 'UTC',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    time_format: '12h' as '12h' | '24h',
    week_start: 'sunday' as 'sunday' | 'monday',

    // Resource Limits
    max_users: 100,
    max_courses: 50,
    max_storage_gb: 10,
    max_instructors: 10,
    max_storage_per_user_mb: 500,
    max_file_upload_size_mb: 100,
    max_video_duration_minutes: 120,
    max_concurrent_sessions: 1,

    // Subscription & Status
    status: 'active' as 'active' | 'trial' | 'suspended' | 'cancelled',
    subscription_tier: 'basic' as 'basic' | 'professional' | 'enterprise' | 'custom',
    domain: '',

    // Features (all enabled by default)
    enabled_features: {
      courses: true,
      zoom: true,
      docusign: true,
    },

    // Customer Success (Editable)
    health_score: null as number | null,
    churn_risk: '' as '' | 'low' | 'medium' | 'high',
    customer_success_manager: '',

    // Super Admin Fields
    internal_notes: '',
    tags: [] as string[],
    referral_source: '',
    partner_id: '',
    campaign_source: '',
  });

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/superadmin/tenants/${tenantId}`);
      const data = await response.json();

      if (data.success) {
        const tenant = data.data;
        setTenantData(tenant);

        setFormData({
          name: tenant.name || '',
          admin_name: tenant.admin_name || '',
          admin_email: tenant.admin_email || '',

          organization_type: tenant.organization_type || '',
          industry: tenant.industry || '',
          organization_size: tenant.organization_size || '',
          website_url: tenant.website_url || '',
          description: tenant.description || '',

          phone_number: tenant.phone_number || '',
          support_email: tenant.support_email || '',
          support_phone: tenant.support_phone || '',
          billing_email: tenant.billing_email || '',
          notification_email: tenant.notification_email || '',
          technical_contact_name: tenant.technical_contact_name || '',
          technical_contact_email: tenant.technical_contact_email || '',
          technical_contact_phone: tenant.technical_contact_phone || '',

          address_line1: tenant.address_line1 || '',
          address_line2: tenant.address_line2 || '',
          city: tenant.city || '',
          state_province: tenant.state_province || '',
          postal_code: tenant.postal_code || '',
          country: tenant.country || '',

          legal_name: tenant.legal_name || '',
          tax_id: tenant.tax_id || '',
          registration_number: tenant.registration_number || '',

          timezone: tenant.timezone || 'UTC',
          currency: tenant.currency || 'USD',
          date_format: tenant.date_format || 'MM/DD/YYYY',
          time_format: tenant.time_format || '12h',
          week_start: tenant.week_start || 'sunday',

          max_users: tenant.max_users || 100,
          max_courses: tenant.max_courses || 50,
          max_storage_gb: tenant.max_storage_gb || 10,
          max_instructors: tenant.max_instructors || 10,
          max_storage_per_user_mb: tenant.max_storage_per_user_mb || 500,
          max_file_upload_size_mb: tenant.max_file_upload_size_mb || 100,
          max_video_duration_minutes: tenant.max_video_duration_minutes || 120,
          max_concurrent_sessions: tenant.max_concurrent_sessions || 1,

          status: tenant.status || 'active',
          subscription_tier: tenant.subscription_tier || 'basic',
          domain: tenant.domain || '',

          enabled_features: tenant.enabled_features || {
            courses: true,
            zoom: true,
            docusign: true,
          },

          health_score: tenant.health_score,
          churn_risk: tenant.churn_risk || '',
          customer_success_manager: tenant.customer_success_manager || '',

          internal_notes: tenant.internal_notes || '',
          tags: tenant.tags || [],
          referral_source: tenant.referral_source || '',
          partner_id: tenant.partner_id || '',
          campaign_source: tenant.campaign_source || '',
        });
      } else {
        setError(data.error || 'Failed to load tenant');
      }
    } catch (err) {
      setError('Error loading tenant');
      console.error('Error loading tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Tenant updated successfully');
        setTenantData(data.data);
        // Reload to get latest data
        await loadTenantData();
      } else {
        setError(data.error || 'Failed to update tenant');
      }
    } catch (err) {
      setError('Error updating tenant');
      console.error('Error updating tenant:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureToggle = (feature: keyof typeof formData.enabled_features) => {
    setFormData({
      ...formData,
      enabled_features: {
        ...formData.enabled_features,
        [feature]: !formData.enabled_features[feature],
      },
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleResendInvitation = async () => {
    setResendingInvitation(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/invitation`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Invitation sent successfully');
        await loadTenantData();
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Error sending invitation');
      console.error('Error sending invitation:', err);
    } finally {
      setResendingInvitation(false);
    }
  };

  const getHealthScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getChurnRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      medium: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      high: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
    };
    return colors[risk as keyof typeof colors] || '';
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      past_due: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
      canceled: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
      trialing: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
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

  if (error && !tenantData) {
    return (
      <SuperAdminLayout>
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-4 text-red-800 dark:text-red-200">{error}</div>
          <Button onClick={() => router.push('/superadmin/tenants')} variant="secondary" className="mt-4">
            Back to Tenants
          </Button>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="p-3 sm:p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Organization Details: {tenantData?.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Identifier: {tenantData?.slug}</p>
          </div>
          <Button onClick={() => router.push('/superadmin/tenants')} variant="secondary" className="w-full sm:w-auto">
            Back to List
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 sm:p-4 text-sm sm:text-base bg-destructive/10 border border-destructive/20 rounded text-destructive">{error}</div>
        )}

        {success && (
          <div className="mb-4 p-3 sm:p-4 text-sm sm:text-base bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200">{success}</div>
        )}

        {/* Onboarding Status Section (Read-only) */}
        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Onboarding Status</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Onboarding Completed</label>
              {tenantData?.onboarding_completed ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                  ✓ Completed
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                  In Progress
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Current Step</label>
              <p className="text-foreground font-medium">{tenantData?.onboarding_step || 0} of 6</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Invitation Sent</label>
              <p className="text-foreground">
                {tenantData?.invitation_sent_at
                  ? new Date(tenantData.invitation_sent_at).toLocaleDateString()
                  : 'Not sent'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Invitation Accepted</label>
              <p className="text-foreground">
                {tenantData?.invitation_accepted_at
                  ? new Date(tenantData.invitation_accepted_at).toLocaleDateString()
                  : 'Pending'}
              </p>
            </div>
          </div>

          {!tenantData?.invitation_accepted_at && tenantData?.invitation_sent_at && (
            <div className="mt-4">
              <Button
                onClick={handleResendInvitation}
                disabled={resendingInvitation}
                variant="outline"
              >
                {resendingInvitation ? 'Sending...' : 'Resend Invitation'}
              </Button>
            </div>
          )}
        </div>

        {/* Subscription Information Section (Read-only) */}
        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Subscription Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Subscription Status</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSubscriptionStatusBadge(tenantData?.subscription_status || 'pending')}`}>
                {tenantData?.subscription_status?.toUpperCase() || 'PENDING'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Current Period</label>
              <p className="text-foreground text-sm">
                {tenantData?.subscription_current_period_start && tenantData?.subscription_current_period_end
                  ? `${new Date(tenantData.subscription_current_period_start).toLocaleDateString()} - ${new Date(tenantData.subscription_current_period_end).toLocaleDateString()}`
                  : 'Not set'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Next Billing Date</label>
              <p className="text-foreground">
                {tenantData?.next_billing_date
                  ? new Date(tenantData.next_billing_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Payment Method</label>
              <p className="text-foreground capitalize">
                {tenantData?.payment_method_type || 'Not set'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Subscription is managed through the onboarding flow. Tenants select their plan during initial setup.
          </div>
        </div>

        {/* Customer Success Section (Editable) */}
        <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Customer Success Management</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Health Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.health_score || ''}
                onChange={(e) => setFormData({ ...formData, health_score: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full p-2 border border-border rounded bg-background text-foreground"
                placeholder="0-100"
              />
              {formData.health_score !== null && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${formData.health_score >= 80 ? 'bg-green-500' : formData.health_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${formData.health_score}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getHealthScoreColor(formData.health_score)}`}>
                      {formData.health_score}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Churn Risk</label>
              <select
                value={formData.churn_risk}
                onChange={(e) => setFormData({ ...formData, churn_risk: e.target.value as '' | 'low' | 'medium' | 'high' })}
                className="w-full p-2 border border-border rounded bg-background text-foreground"
              >
                <option value="">Not Set</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {formData.churn_risk && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getChurnRiskBadge(formData.churn_risk)}`}>
                    {formData.churn_risk.toUpperCase()} RISK
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Customer Success Manager</label>
              <input
                type="email"
                value={formData.customer_success_manager}
                onChange={(e) => setFormData({ ...formData, customer_success_manager: e.target.value })}
                className="w-full p-2 border border-border rounded bg-background text-foreground"
                placeholder="csm@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Last Activity</label>
              <p className="text-foreground p-2 bg-muted rounded">
                {tenantData?.last_activity_at
                  ? new Date(tenantData.last_activity_at).toLocaleString()
                  : 'No activity recorded'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Auto-updated on tenant actions</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card rounded-lg shadow border border-border mb-6 overflow-hidden">
          <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'basic'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Basic Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('organization')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'organization'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Organization
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'contact'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Contact & Address
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('legal')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'legal'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Legal & Tax
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'settings'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Regional Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('limits')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'limits'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Resource Limits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'admin'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Admin Settings
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="bg-card rounded-lg shadow border border-border p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Slug</label>
                  <input
                    type="text"
                    disabled
                    value={tenantData?.slug || ''}
                    className="w-full p-2 border rounded bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Slug cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Admin Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Admin Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Custom Domain</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Organization Details Tab */}
          {activeTab === 'organization' && (
            <div className="bg-card rounded-lg shadow border border-border p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Organization Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Organization Type</label>
                  <select
                    value={formData.organization_type}
                    onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="">Select Type</option>
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
                  <label className="block text-sm font-medium mb-2 text-foreground">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="e.g., Education, Technology"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Organization Size</label>
                  <select
                    value={formData.organization_size}
                    onChange={(e) => setFormData({ ...formData, organization_size: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="">Select Size</option>
                    <option value="1-50">1-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Website URL</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="Brief description of the organization"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-card rounded-lg shadow border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Contact Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="+1-555-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Support Email</label>
                    <input
                      type="email"
                      value={formData.support_email}
                      onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="support@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Support Phone</label>
                    <input
                      type="tel"
                      value={formData.support_phone}
                      onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="+1-555-0001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Billing Email</label>
                    <input
                      type="email"
                      value={formData.billing_email}
                      onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="billing@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Notification Email</label>
                    <input
                      type="email"
                      value={formData.notification_email}
                      onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="notifications@example.com"
                    />
                  </div>

                  <div className="md:col-span-2 border-t border-border pt-4 mt-2">
                    <h3 className="text-md font-medium mb-3 text-foreground">Technical Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Name</label>
                        <input
                          type="text"
                          value={formData.technical_contact_name}
                          onChange={(e) => setFormData({ ...formData, technical_contact_name: e.target.value })}
                          className="w-full p-2 border border-border rounded bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                        <input
                          type="email"
                          value={formData.technical_contact_email}
                          onChange={(e) => setFormData({ ...formData, technical_contact_email: e.target.value })}
                          className="w-full p-2 border border-border rounded bg-background text-foreground"
                          placeholder="tech@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Phone</label>
                        <input
                          type="tel"
                          value={formData.technical_contact_phone}
                          onChange={(e) => setFormData({ ...formData, technical_contact_phone: e.target.value })}
                          className="w-full p-2 border border-border rounded bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-card rounded-lg shadow border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Address</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-foreground">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-foreground">Address Line 2</label>
                    <input
                      type="text"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">State/Province</label>
                    <input
                      type="text"
                      value={formData.state_province}
                      onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="IL">Israel</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="ES">Spain</option>
                      <option value="IT">Italy</option>
                      <option value="NL">Netherlands</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal & Tax Tab */}
          {activeTab === 'legal' && (
            <div className="bg-card rounded-lg shadow border border-border p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Legal & Tax Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Legal Name</label>
                  <input
                    type="text"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="Official registered business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Tax ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="VAT/EIN/Tax Number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Registration Number</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="Business registration number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Regional Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-card rounded-lg shadow border border-border p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Regional Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Default Language</label>
                  <input
                    type="text"
                    disabled
                    value="English"
                    className="w-full p-2 border rounded bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Fixed to English for all tenants</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="America/Chicago">America/Chicago (CST)</option>
                    <option value="America/Denver">America/Denver (MST)</option>
                    <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Asia/Jerusalem">Asia/Jerusalem (IST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="ILS">ILS - Israeli Shekel</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Date Format</label>
                  <select
                    value={formData.date_format}
                    onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Time Format</label>
                  <select
                    value={formData.time_format}
                    onChange={(e) => setFormData({ ...formData, time_format: e.target.value as '12h' | '24h' })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Week Start</label>
                  <select
                    value={formData.week_start}
                    onChange={(e) => setFormData({ ...formData, week_start: e.target.value as 'sunday' | 'monday' })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Resource Limits Tab */}
          {activeTab === 'limits' && (
            <div className="bg-card rounded-lg shadow border border-border p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Resource Limits</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Users</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Courses</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_courses}
                    onChange={(e) => setFormData({ ...formData, max_courses: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Storage (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_storage_gb}
                    onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Instructors</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_instructors}
                    onChange={(e) => setFormData({ ...formData, max_instructors: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Storage Per User (MB)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_storage_per_user_mb}
                    onChange={(e) => setFormData({ ...formData, max_storage_per_user_mb: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_file_upload_size_mb}
                    onChange={(e) => setFormData({ ...formData, max_file_upload_size_mb: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Video Duration (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_video_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, max_video_duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Concurrent Sessions</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_concurrent_sessions}
                    onChange={(e) => setFormData({ ...formData, max_concurrent_sessions: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Admin Settings Tab */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              {/* Subscription Tier */}
              <div className="bg-card rounded-lg shadow border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Subscription Tier</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Subscription Tier</label>
                    <select
                      value={formData.subscription_tier}
                      onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value as any })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                    >
                      <option value="basic">Basic</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="custom">Custom</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">For reference only. Actual subscription managed via onboarding.</p>
                  </div>
                </div>
              </div>

              {/* Platform Features */}
              <div className="bg-card rounded-lg shadow border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Platform Features</h2>

                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled_features.courses}
                      onChange={() => handleFeatureToggle('courses')}
                      className="mr-3 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">Courses (Core LMS features)</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled_features.zoom}
                      onChange={() => handleFeatureToggle('zoom')}
                      className="mr-3 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">Zoom Integration (Video conferencing)</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled_features.docusign}
                      onChange={() => handleFeatureToggle('docusign')}
                      className="mr-3 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">DocuSign Integration (Digital signatures)</span>
                  </label>
                </div>
              </div>

              {/* Administrative Settings */}
              <div className="bg-card rounded-lg shadow border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Administrative Settings</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Internal Notes</label>
                    <textarea
                      value={formData.internal_notes}
                      onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                      rows={4}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="Internal notes visible only to super admins"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 p-2 border border-border rounded bg-background text-foreground"
                        placeholder="Add a tag and press Enter"
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline">
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Referral Source</label>
                      <input
                        type="text"
                        value={formData.referral_source}
                        onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                        placeholder="How did they find us?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Partner ID</label>
                      <input
                        type="text"
                        value={formData.partner_id}
                        onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                        placeholder="Partner reference ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Campaign Source</label>
                      <input
                        type="text"
                        value={formData.campaign_source}
                        onChange={(e) => setFormData({ ...formData, campaign_source: e.target.value })}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                        placeholder="Marketing campaign"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons - Always Visible */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={loadTenantData} variant="outline">
              Reset Changes
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}

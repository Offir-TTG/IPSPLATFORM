'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuperAdminLayout } from '@/components/admin/SuperAdminLayout';
import { Button } from '@/components/ui/button';

export default function CreateTenantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sendInvitation, setSendInvitation] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    // Basic Information (Required)
    name: '',
    slug: '',
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

    // Regional Settings
    default_language: 'en', // Fixed to English
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

    // Features (all enabled by default)
    enabled_features: {
      courses: true,
      zoom: true,
      docusign: true,
    },

    // Super Admin Fields
    internal_notes: '',
    tags: [] as string[],
    customer_success_manager: '',
    referral_source: '',
    partner_id: '',
    campaign_source: '',
  });

  const [tagInput, setTagInput] = useState('');

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        send_invitation: sendInvitation,
      };

      const response = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/superadmin/tenants');
      } else {
        setError(data.error || 'Failed to create tenant');
      }
    } catch (err) {
      setError('Error creating tenant');
      console.error('Error creating tenant:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="p-3 sm:p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Create New Organization</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Onboard a new organization to the platform</p>
          </div>
          <Button onClick={() => router.push('/superadmin/tenants')} variant="secondary" className="w-full sm:w-auto">
            Back to List
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 sm:p-4 text-sm sm:text-base bg-destructive/10 border border-destructive/20 rounded text-destructive">
            {error}
          </div>
        )}

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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="Harvard University"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="harvard"
                    pattern="^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lowercase letters, numbers, and hyphens only. Will be used in URLs.
                  </p>
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
                    placeholder="John Doe"
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
                    placeholder="admin@harvard.edu"
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
                    <option value="">Select type...</option>
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
                    placeholder="Education, Healthcare, Technology..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Organization Size</label>
                  <select
                    value={formData.organization_size}
                    onChange={(e) => setFormData({ ...formData, organization_size: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  >
                    <option value="">Select size...</option>
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
                    placeholder="https://harvard.edu"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    rows={3}
                    placeholder="Brief description of the organization..."
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
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Support Email</label>
                    <input
                      type="email"
                      value={formData.support_email}
                      onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="support@harvard.edu"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Support Phone</label>
                    <input
                      type="tel"
                      value={formData.support_phone}
                      onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Billing Email</label>
                    <input
                      type="email"
                      value={formData.billing_email}
                      onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="billing@harvard.edu"
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
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                        <input
                          type="email"
                          value={formData.technical_contact_email}
                          onChange={(e) => setFormData({ ...formData, technical_contact_email: e.target.value })}
                          className="w-full p-2 border border-border rounded bg-background text-foreground"
                          placeholder="tech@harvard.edu"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Phone</label>
                        <input
                          type="tel"
                          value={formData.technical_contact_phone}
                          onChange={(e) => setFormData({ ...formData, technical_contact_phone: e.target.value })}
                          className="w-full p-2 border border-border rounded bg-background text-foreground"
                          placeholder="+1 (555) 111-2222"
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
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-foreground">Address Line 2</label>
                    <input
                      type="text"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="Suite 100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="Cambridge"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">State/Province</label>
                    <input
                      type="text"
                      value={formData.state_province}
                      onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="Massachusetts"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="02138"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                    >
                      <option value="">Select country...</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="IL">Israel</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="ES">Spain</option>
                      <option value="IT">Italy</option>
                      <option value="NL">Netherlands</option>
                      <option value="IN">India</option>
                      <option value="JP">Japan</option>
                      <option value="CN">China</option>
                      <option value="BR">Brazil</option>
                      <option value="MX">Mexico</option>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-foreground">Legal Name</label>
                  <input
                    type="text"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="Harvard University Corporation"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Official registered business name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Tax ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="12-3456789"
                  />
                  <p className="text-xs text-muted-foreground mt-1">VAT/EIN/Tax number</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Registration Number</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                    placeholder="REG123456"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Business registration number</p>
                </div>
              </div>
            </div>
          )}

          {/* Regional Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-card rounded-lg shadow border border-border p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Regional Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Default Language</label>
                  <input
                    type="text"
                    value="English"
                    disabled
                    className="w-full p-2 border border-border rounded bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Platform default language (English only)</p>
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
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
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
                  <label className="block text-sm font-medium mb-2 text-foreground">Week Starts On</label>
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
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 100 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Courses</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_courses}
                    onChange={(e) => setFormData({ ...formData, max_courses: parseInt(e.target.value) || 50 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Storage (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_storage_gb}
                    onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Instructors</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_instructors}
                    onChange={(e) => setFormData({ ...formData, max_instructors: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Storage Per User (MB)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_storage_per_user_mb}
                    onChange={(e) => setFormData({ ...formData, max_storage_per_user_mb: parseInt(e.target.value) || 500 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_file_upload_size_mb}
                    onChange={(e) => setFormData({ ...formData, max_file_upload_size_mb: parseInt(e.target.value) || 100 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Max Video (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_video_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, max_video_duration_minutes: parseInt(e.target.value) || 120 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Concurrent Sessions</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_concurrent_sessions}
                    onChange={(e) => setFormData({ ...formData, max_concurrent_sessions: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Administrative Settings Tab */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Administrative Settings</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Internal Notes</label>
                    <textarea
                      value={formData.internal_notes}
                      onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                      className="w-full p-2 border border-border rounded bg-background text-foreground"
                      rows={3}
                      placeholder="Private notes visible only to super admins..."
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
                        placeholder="Add a tag..."
                      />
                      <Button type="button" onClick={handleAddTag}>Add</Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
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
                      <label className="block text-sm font-medium mb-2 text-foreground">Customer Success Manager</label>
                      <input
                        type="email"
                        value={formData.customer_success_manager}
                        onChange={(e) => setFormData({ ...formData, customer_success_manager: e.target.value })}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                        placeholder="csm@platform.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Referral Source</label>
                      <input
                        type="text"
                        value={formData.referral_source}
                        onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                        placeholder="Google Ads, Partner, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Partner ID</label>
                      <input
                        type="text"
                        value={formData.partner_id}
                        onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                        placeholder="PARTNER123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Campaign Source</label>
                      <input
                        type="text"
                        value={formData.campaign_source}
                        onChange={(e) => setFormData({ ...formData, campaign_source: e.target.value })}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                        placeholder="summer2024"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Invitation */}
              <div className="bg-card rounded-lg shadow border border-border p-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="sendInvitation"
                    checked={sendInvitation}
                    onChange={(e) => setSendInvitation(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <label htmlFor="sendInvitation" className="block text-sm font-medium text-foreground cursor-pointer">
                      Send invitation to admin email
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      The admin will receive an email with a link to complete onboarding and set up their account.
                      If unchecked, the tenant will be created but marked as "pending onboarding".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons - Always Visible */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => router.push('/superadmin/tenants')}
              className="bg-muted hover:bg-muted/80 text-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating Tenant...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}

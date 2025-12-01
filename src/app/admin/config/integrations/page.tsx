'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import {
  FileSignature,
  CreditCard,
  Video,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  TestTube,
  Save,
  Key,
  Globe,
  Shield,
  Settings,
  Plug,
  Users
} from 'lucide-react';

interface Integration {
  id: string;
  integration_key: string;
  integration_name: string;
  is_enabled: boolean;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  webhook_url?: string;
  status?: 'connected' | 'disconnected' | 'error';
}

interface IntegrationConfig {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'url' | 'textarea';
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
  }[];
  settings?: {
    key: string;
    label: string;
    type: 'text' | 'select' | 'toggle';
    placeholder?: string;
    options?: { value: string; label: string }[];
  }[];
}

export default function IntegrationsPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('docusign');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Responsive breakpoints
  const isMobile = windowWidth <= 640;
  const isTablet = windowWidth > 640 && windowWidth <= 768;
  const isDesktop = windowWidth > 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Integration configurations
  const integrationConfigs: IntegrationConfig[] = [
    {
      key: 'docusign',
      name: 'DocuSign',
      description: t('admin.integrations.docusign.description', 'Electronic signature and agreement cloud platform'),
      icon: <FileSignature className="h-5 w-5" />,
      fields: [
        {
          key: 'account_id',
          label: t('admin.integrations.docusign.accountId', 'Account ID'),
          type: 'text',
          placeholder: t('admin.integrations.docusign.accountIdPlaceholder', 'Your DocuSign Account ID'),
          required: true
        },
        {
          key: 'integration_key',
          label: t('admin.integrations.docusign.integrationKey', 'Integration Key'),
          type: 'password',
          placeholder: t('admin.integrations.docusign.integrationKeyPlaceholder', 'Your DocuSign Integration Key'),
          required: true
        },
        {
          key: 'user_id',
          label: t('admin.integrations.docusign.userId', 'User ID (GUID)'),
          type: 'text',
          placeholder: t('admin.integrations.docusign.userIdPlaceholder', 'Your DocuSign User ID'),
          required: true
        },
        {
          key: 'private_key',
          label: t('admin.integrations.docusign.privateKey', 'RSA Private Key'),
          type: 'textarea',
          placeholder: t('admin.integrations.docusign.privateKeyPlaceholder', 'Paste your RSA Private Key (including BEGIN/END lines)'),
          required: true
        },
        {
          key: 'oauth_base_path',
          label: t('admin.integrations.docusign.oauthBasePath', 'OAuth Base Path'),
          type: 'select',
          required: true,
          options: [
            { value: 'https://account-d.docusign.com', label: t('admin.integrations.environment.sandbox', 'Demo/Sandbox') },
            { value: 'https://account.docusign.com', label: t('admin.integrations.environment.production', 'Production') }
          ]
        },
        {
          key: 'base_path',
          label: t('admin.integrations.docusign.apiBasePath', 'API Base Path'),
          type: 'select',
          required: true,
          options: [
            { value: 'https://demo.docusign.net/restapi', label: t('admin.integrations.environment.sandbox', 'Demo/Sandbox') },
            { value: 'https://www.docusign.net/restapi', label: t('admin.integrations.environment.production', 'Production') }
          ]
        },
        {
          key: 'webhook_secret',
          label: t('admin.integrations.docusign.webhookSecret', 'Webhook Secret (HMAC Key)'),
          type: 'password',
          placeholder: t('admin.integrations.docusign.webhookSecretPlaceholder', 'Optional: HMAC key from DocuSign Connect'),
          required: false
        }
      ],
      settings: [
        {
          key: 'auto_send',
          label: t('admin.integrations.docusign.autoSend', 'Auto-send envelopes'),
          type: 'toggle'
        },
        {
          key: 'reminder_days',
          label: t('admin.integrations.docusign.reminderDays', 'Reminder after (days)'),
          type: 'text',
          placeholder: '3'
        },
        {
          key: 'expiration_days',
          label: t('admin.integrations.docusign.expirationDays', 'Expiration after (days)'),
          type: 'text',
          placeholder: '30'
        }
      ]
    },
    {
      key: 'stripe',
      name: 'Stripe',
      description: t('admin.integrations.stripe.description', 'Online payment processing platform'),
      icon: <CreditCard className="h-5 w-5" />,
      fields: [
        {
          key: 'secret_key',
          label: t('admin.integrations.stripe.secretKey', 'Secret Key'),
          type: 'password',
          placeholder: 'sk_test_...',
          required: true
        },
        {
          key: 'publishable_key',
          label: t('admin.integrations.stripe.publishableKey', 'Publishable Key'),
          type: 'text',
          placeholder: 'pk_test_...',
          required: true
        },
        {
          key: 'webhook_secret',
          label: t('admin.integrations.stripe.webhookSecret', 'Webhook Signing Secret'),
          type: 'password',
          placeholder: 'whsec_...',
          required: false
        }
      ],
      settings: [
        {
          key: 'currency',
          label: t('admin.integrations.stripe.currency', 'Default Currency'),
          type: 'select',
          options: [
            { value: 'usd', label: 'USD' },
            { value: 'eur', label: 'EUR' },
            { value: 'gbp', label: 'GBP' },
            { value: 'ils', label: 'ILS' }
          ]
        },
        {
          key: 'statement_descriptor',
          label: t('admin.integrations.stripe.statementDescriptor', 'Statement Descriptor'),
          type: 'text',
          placeholder: t('admin.integrations.stripe.statementDescriptorPlaceholder', 'Your Company Name')
        }
      ]
    },
    {
      key: 'zoom',
      name: 'Zoom',
      description: t('admin.integrations.zoom.description', 'Video conferencing and online meetings'),
      icon: <Video className="h-5 w-5" />,
      fields: [
        {
          key: 'account_id',
          label: t('admin.integrations.zoom.accountId', 'Account ID'),
          type: 'text',
          placeholder: t('admin.integrations.zoom.accountIdPlaceholder', 'Your Zoom Account ID'),
          required: true
        },
        {
          key: 'client_id',
          label: t('admin.integrations.zoom.clientId', 'Client ID'),
          type: 'text',
          placeholder: t('admin.integrations.zoom.clientIdPlaceholder', 'Your Zoom Client ID'),
          required: true
        },
        {
          key: 'client_secret',
          label: t('admin.integrations.zoom.clientSecret', 'Client Secret'),
          type: 'password',
          placeholder: t('admin.integrations.zoom.clientSecretPlaceholder', 'Your Zoom Client Secret'),
          required: true
        },
        {
          key: 'sdk_key',
          label: t('admin.integrations.zoom.sdkKey', 'SDK Key'),
          type: 'text',
          placeholder: t('admin.integrations.zoom.sdkKeyPlaceholder', 'Your Zoom SDK Key'),
          required: false
        },
        {
          key: 'sdk_secret',
          label: t('admin.integrations.zoom.sdkSecret', 'SDK Secret'),
          type: 'password',
          placeholder: t('admin.integrations.zoom.sdkSecretPlaceholder', 'Your Zoom SDK Secret'),
          required: false
        }
      ],
      settings: [
        {
          key: 'default_meeting_duration',
          label: t('admin.integrations.zoom.defaultDuration', 'Default Meeting Duration (minutes)'),
          type: 'text',
          placeholder: '60'
        },
        {
          key: 'auto_recording',
          label: t('admin.integrations.zoom.autoRecording', 'Auto Recording'),
          type: 'select',
          options: [
            { value: 'none', label: t('admin.integrations.zoom.recordingNone', 'None') },
            { value: 'local', label: t('admin.integrations.zoom.recordingLocal', 'Local') },
            { value: 'cloud', label: t('admin.integrations.zoom.recordingCloud', 'Cloud') }
          ]
        }
      ]
    },
    {
      key: 'sendgrid',
      name: 'SendGrid',
      description: t('admin.integrations.sendgrid.description', 'Email delivery service'),
      icon: <Mail className="h-5 w-5" />,
      fields: [
        {
          key: 'api_key',
          label: t('admin.integrations.sendgrid.apiKey', 'API Key'),
          type: 'password',
          placeholder: 'SG.xxxx...',
          required: true
        },
        {
          key: 'from_email',
          label: t('admin.integrations.sendgrid.fromEmail', 'From Email'),
          type: 'text',
          placeholder: 'noreply@yourdomain.com',
          required: true
        },
        {
          key: 'from_name',
          label: t('admin.integrations.sendgrid.fromName', 'From Name'),
          type: 'text',
          placeholder: t('admin.integrations.sendgrid.fromNamePlaceholder', 'Your Company'),
          required: true
        }
      ],
      settings: [
        {
          key: 'sandbox_mode',
          label: t('admin.integrations.sendgrid.sandboxMode', 'Sandbox Mode'),
          type: 'toggle'
        },
        {
          key: 'tracking',
          label: t('admin.integrations.sendgrid.emailTracking', 'Email Tracking'),
          type: 'toggle'
        }
      ]
    },
    {
      key: 'twilio',
      name: 'Twilio',
      description: t('admin.integrations.twilio.description', 'SMS and voice communication'),
      icon: <MessageSquare className="h-5 w-5" />,
      fields: [
        {
          key: 'account_sid',
          label: t('admin.integrations.twilio.accountSid', 'Account SID'),
          type: 'text',
          placeholder: 'ACxxxx...',
          required: true
        },
        {
          key: 'auth_token',
          label: t('admin.integrations.twilio.authToken', 'Auth Token'),
          type: 'password',
          placeholder: t('admin.integrations.twilio.authTokenPlaceholder', 'Your Auth Token'),
          required: true
        },
        {
          key: 'phone_number',
          label: t('admin.integrations.twilio.phoneNumber', 'Phone Number'),
          type: 'text',
          placeholder: '+1234567890',
          required: true
        }
      ],
      settings: [
        {
          key: 'messaging_service_sid',
          label: t('admin.integrations.twilio.messagingServiceSid', 'Messaging Service SID'),
          type: 'text',
          placeholder: 'MGxxxx...'
        }
      ]
    },
    {
      key: 'keap',
      name: 'Keap (Infusionsoft)',
      description: t('admin.integrations.keap.description', 'CRM and marketing automation platform'),
      icon: <Users className="h-5 w-5" />,
      fields: [
        {
          key: 'client_id',
          label: t('admin.integrations.keap.clientId', 'Client ID'),
          type: 'text',
          placeholder: t('admin.integrations.keap.clientIdPlaceholder', 'Your Keap Client ID'),
          required: true
        },
        {
          key: 'client_secret',
          label: t('admin.integrations.keap.clientSecret', 'Client Secret'),
          type: 'password',
          placeholder: t('admin.integrations.keap.clientSecretPlaceholder', 'Your Keap Client Secret'),
          required: true
        },
        {
          key: 'access_token',
          label: t('admin.integrations.keap.accessToken', 'Access Token'),
          type: 'password',
          placeholder: t('admin.integrations.keap.accessTokenPlaceholder', 'Generated after OAuth authorization'),
          required: false
        },
        {
          key: 'refresh_token',
          label: t('admin.integrations.keap.refreshToken', 'Refresh Token'),
          type: 'password',
          placeholder: t('admin.integrations.keap.refreshTokenPlaceholder', 'Generated after OAuth authorization'),
          required: false
        }
      ],
      settings: [
        {
          key: 'auto_sync_contacts',
          label: t('admin.integrations.keap.autoSyncContacts', 'Auto-sync Contacts'),
          type: 'toggle'
        },
        {
          key: 'default_tag_category',
          label: t('admin.integrations.keap.defaultTagCategory', 'Default Tag Category'),
          type: 'text',
          placeholder: t('admin.integrations.keap.defaultTagCategoryPlaceholder', 'LMS Students')
        },
        {
          key: 'sync_frequency',
          label: t('admin.integrations.keap.syncFrequency', 'Sync Frequency'),
          type: 'select',
          options: [
            { value: 'realtime', label: t('admin.integrations.keap.syncRealtime', 'Real-time') },
            { value: 'hourly', label: t('admin.integrations.keap.syncHourly', 'Hourly') },
            { value: 'daily', label: t('admin.integrations.keap.syncDaily', 'Daily') },
            { value: 'manual', label: t('admin.integrations.keap.syncManual', 'Manual') }
          ]
        }
      ]
    }
  ];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Handle OAuth callbacks (Keap, DocuSign, etc.)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        // Determine which integration based on URL or state
        const keapIntegration = integrations.find(i => i.integration_key === 'keap');

        if (keapIntegration) {
          try {
            toast.info('Processing Keap authorization...');

            // Exchange code for tokens
            const response = await fetch('/api/admin/integrations/keap/oauth-callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code }),
            });

            if (response.ok) {
              const result = await response.json();
              toast.success('Keap authorization successful! Tokens have been saved.');

              // Refresh integrations to show new tokens
              await fetchIntegrations();

              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              const error = await response.json();
              toast.error(`Keap authorization failed: ${error.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('OAuth callback error:', error);
            toast.error('Failed to process Keap authorization');
          }
        }
      }
    };

    if (integrations.length > 0) {
      handleOAuthCallback();
    }
  }, [integrations]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/admin/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast.error(t('admin.integrations.errors.loadFailed', 'Failed to load integrations'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (integrationKey: string) => {
    setSaving(integrationKey);
    try {
      const integration = integrations.find(i => i.integration_key === integrationKey);
      const config = integrationConfigs.find(c => c.key === integrationKey);

      // If no integration exists, create a default one
      const dataToSave = integration || {
        integration_key: integrationKey,
        integration_name: config?.name || integrationKey,
        is_enabled: false,
        credentials: {},
        settings: {}
      };

      const response = await fetch(`/api/admin/integrations/${integrationKey}`, {
        method: 'PUT', // Always use PUT since the API handles both create and update
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dataToSave,
          integration_key: integrationKey,
          integration_name: config?.name || integrationKey
        }),
      });

      if (response.ok) {
        toast.success(t('admin.integrations.success.saved', `${config?.name || integrationKey} configuration saved successfully`));
        await fetchIntegrations();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving integration:', error);
      toast.error(t('admin.integrations.errors.saveFailed', `Failed to save ${integrationKey} configuration: ${error instanceof Error ? error.message : 'Unknown error'}`));
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (integrationKey: string) => {
    setTesting(integrationKey);
    try {
      const response = await fetch(`/api/admin/integrations/${integrationKey}/test`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || t('admin.integrations.success.testPassed', `${integrationKey} connection test successful`));
        setIntegrations(prev =>
          prev.map(i =>
            i.integration_key === integrationKey
              ? { ...i, status: 'connected' }
              : i
          )
        );
      } else {
        // Check for consent_required error
        if (result.error?.includes('consent_required')) {
          const integration = integrations.find(i => i.integration_key === integrationKey);
          if (integration?.credentials?.integration_key && integration?.credentials?.oauth_base_path) {
            const consentUrl = `${integration.credentials.oauth_base_path}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integration.credentials.integration_key}&redirect_uri=${window.location.origin}/admin/config/integrations`;

            // Show consent URL in toast
            toast.error(
              <div>
                <p>DocuSign consent required.</p>
                <a href={consentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Click here to grant consent
                </a>
              </div>,
              { duration: 10000 }
            );
          } else {
            toast.error('DocuSign consent required. Please fill in Integration Key and OAuth Base Path first.');
          }
        } else {
          toast.error(result.error || result.message || 'Connection test failed');
        }
        throw new Error(result.error || result.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      toast.error(t('admin.integrations.errors.testFailed', `${integrationKey} connection test failed`));
      setIntegrations(prev =>
        prev.map(i =>
          i.integration_key === integrationKey
            ? { ...i, status: 'error' }
            : i
        )
      );
    } finally {
      setTesting(null);
    }
  };

  const updateIntegrationField = (
    integrationKey: string,
    fieldType: 'credentials' | 'settings',
    fieldKey: string,
    value: any
  ) => {
    setIntegrations(prev => {
      const existing = prev.find(i => i.integration_key === integrationKey);
      if (existing) {
        return prev.map(i =>
          i.integration_key === integrationKey
            ? {
                ...i,
                [fieldType]: {
                  ...i[fieldType],
                  [fieldKey]: value
                }
              }
            : i
        );
      } else {
        const config = integrationConfigs.find(c => c.key === integrationKey);
        return [...prev, {
          id: '',
          integration_key: integrationKey,
          integration_name: config?.name || integrationKey,
          is_enabled: false,
          credentials: fieldType === 'credentials' ? { [fieldKey]: value } : {},
          settings: fieldType === 'settings' ? { [fieldKey]: value } : {}
        }];
      }
    });
  };

  const toggleIntegration = (integrationKey: string) => {
    setIntegrations(prev => {
      const existing = prev.find(i => i.integration_key === integrationKey);
      if (existing) {
        return prev.map(i =>
          i.integration_key === integrationKey
            ? { ...i, is_enabled: !i.is_enabled }
            : i
        );
      } else {
        const config = integrationConfigs.find(c => c.key === integrationKey);
        return [...prev, {
          id: '',
          integration_key: integrationKey,
          integration_name: config?.name || integrationKey,
          is_enabled: true,
          credentials: {},
          settings: {}
        }];
      }
    });
  };

  const getIntegrationData = (integrationKey: string): Integration | undefined => {
    return integrations.find(i => i.integration_key === integrationKey);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              {t('admin.integrations.title', 'Integrations')}
            </h1>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t('admin.integrations.description', 'Connect and configure third-party services to enhance your platform capabilities')}
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'hsl(var(--muted-foreground))'
          }}>
            <Plug className="h-5 w-5" />
            <span>{integrations.filter(i => i.is_enabled).length} {t('admin.integrations.active', 'active')}</span>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'hsl(var(--accent))',
          borderRadius: 'calc(var(--radius) * 1.5)',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <Shield className="h-4 w-4" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: 'var(--font-size-sm)' }}>
            {t('admin.integrations.securityNote', 'All credentials are encrypted and stored securely. We recommend using API keys with minimal required permissions.')}
          </p>
        </div>

        {/* Integration Tabs */}
        <div style={{
          backgroundColor: 'hsl(var(--card))',
          borderRadius: 'calc(var(--radius) * 1.5)',
          border: '1px solid hsl(var(--border))',
          overflow: 'hidden'
        }}>
          {/* Tab Headers */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--muted))',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            {integrationConfigs.map(config => (
              <button
                key={config.key}
                onClick={() => setActiveTab(config.key)}
                style={{
                  padding: isMobile ? '1rem 1.25rem' : '0.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: 'none',
                  backgroundColor: activeTab === config.key ? 'hsl(var(--card))' : 'transparent',
                  borderBottom: activeTab === config.key ? '2px solid hsl(var(--primary))' : 'none',
                  marginBottom: activeTab === config.key ? '-1px' : '0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: isMobile ? '0.875rem' : 'var(--font-size-sm)',
                  fontWeight: activeTab === config.key ? '600' : '400',
                  color: activeTab === config.key ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  whiteSpace: 'nowrap',
                  minHeight: isMobile ? '48px' : 'auto'
                }}
              >
                {config.icon}
                <span>{config.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {integrationConfigs.map(config => {
            const integration = getIntegrationData(config.key);
            const isEnabled = integration?.is_enabled || false;
            const status = integration?.status || 'disconnected';

            // Check if required credentials are filled
            const hasRequiredCredentials = config.fields
              .filter(field => field.required)
              .every(field => integration?.credentials?.[field.key]);

            return (
              <div
                key={config.key}
                style={{
                  display: activeTab === config.key ? 'block' : 'none',
                  padding: isMobile ? '1rem' : '1.5rem'
                }}
              >
                {/* Integration Header */}
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid hsl(var(--border))',
                  gap: isMobile ? '1rem' : '0'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      backgroundColor: 'hsl(var(--accent))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {config.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {config.name}
                      </h2>
                      <p style={{
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: 'var(--font-size-sm)',
                        wordBreak: 'break-word'
                      }}>
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    justifyContent: isMobile ? 'space-between' : 'flex-end',
                    flexShrink: 0
                  }}>
                    {/* Status Badge */}
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'calc(var(--radius) * 1)',
                      backgroundColor: status === 'connected'
                        ? 'hsl(142.1 76.2% 36.3% / 0.1)'
                        : status === 'error'
                        ? 'hsl(var(--destructive) / 0.1)'
                        : 'hsl(var(--muted))',
                      color: status === 'connected'
                        ? 'hsl(142.1 76.2% 36.3%)'
                        : status === 'error'
                        ? 'hsl(var(--destructive))'
                        : 'hsl(var(--muted-foreground))',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {status === 'connected' && <CheckCircle className="h-3 w-3" />}
                      {status === 'error' && <XCircle className="h-3 w-3" />}
                      {status === 'connected' ? t('admin.integrations.status.connected', 'Connected') :
                       status === 'error' ? t('admin.integrations.status.error', 'Error') :
                       t('admin.integrations.status.disconnected', 'Disconnected')}
                    </div>
                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => toggleIntegration(config.key)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '9999px',
                        backgroundColor: isEnabled ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: '2px',
                        transition: 'transform 0.2s',
                        transform: isEnabled
                          ? (isRtl ? 'translateX(-20px)' : 'translateX(20px)')
                          : 'translateX(2px)'
                      }} />
                    </button>
                  </div>
                </div>

                {/* Credentials Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Key className="h-4 w-4" />
                      {t('admin.integrations.credentials', 'API Credentials')}
                    </h3>
                    <button
                      onClick={() => setShowCredentials(prev => ({
                        ...prev,
                        [config.key]: !prev[config.key]
                      }))}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'calc(var(--radius) * 1)',
                        backgroundColor: 'transparent',
                        border: '1px solid hsl(var(--border))',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--accent))'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {showCredentials[config.key] ? (
                        <><EyeOff className="h-3 w-3" /> {t('admin.integrations.hide', 'Hide')}</>
                      ) : (
                        <><Eye className="h-3 w-3" /> {t('admin.integrations.show', 'Show')}</>
                      )}
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                    gap: '1rem'
                  }}>
                    {config.fields.map(field => (
                      <div
                        key={field.key}
                        style={{
                          gridColumn: field.type === 'textarea' ? 'span 2' : undefined
                        }}
                      >
                        <label style={{
                          display: 'block',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '500',
                          marginBottom: '0.25rem'
                        }}>
                          {field.label}
                          {field.required && <span style={{ color: 'hsl(var(--destructive))', marginLeft: '0.25rem' }}>*</span>}
                        </label>

                        {field.type === 'select' ? (
                          <select
                            value={integration?.credentials?.[field.key] || ''}
                            onChange={(e) => updateIntegrationField(
                              config.key,
                              'credentials',
                              field.key,
                              e.target.value
                            )}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'calc(var(--radius) * 1.5)',
                              border: '1px solid hsl(var(--border))',
                              backgroundColor: 'hsl(var(--background))',
                              fontSize: 'var(--font-size-sm)',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">{t('admin.integrations.select', 'Select')} {field.label}</option>
                            {field.options?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            value={integration?.credentials?.[field.key] || ''}
                            onChange={(e) => updateIntegrationField(
                              config.key,
                              'credentials',
                              field.key,
                              e.target.value
                            )}
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'calc(var(--radius) * 1.5)',
                              border: '1px solid hsl(var(--border))',
                              backgroundColor: 'hsl(var(--background))',
                              fontSize: 'var(--font-size-sm)',
                              fontFamily: 'monospace'
                            }}
                          />
                        ) : (
                          <input
                            type={
                              field.type === 'password' && !showCredentials[config.key]
                                ? 'password'
                                : 'text'
                            }
                            placeholder={field.placeholder}
                            value={integration?.credentials?.[field.key] || ''}
                            onChange={(e) => updateIntegrationField(
                              config.key,
                              'credentials',
                              field.key,
                              e.target.value
                            )}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'calc(var(--radius) * 1.5)',
                              border: '1px solid hsl(var(--border))',
                              backgroundColor: 'hsl(var(--background))',
                              fontSize: 'var(--font-size-sm)'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings Section */}
                {config.settings && config.settings.length > 0 && (
                  <div style={{
                    paddingTop: '1.5rem',
                    borderTop: '1px solid hsl(var(--border))',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <Settings className="h-4 w-4" />
                      {t('admin.integrations.settings', 'Integration Settings')}
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                      gap: '1rem'
                    }}>
                      {config.settings.map(setting => (
                        <div key={setting.key}>
                          {setting.type === 'toggle' ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <label style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500'
                              }}>
                                {setting.label}
                              </label>
                              <button
                                onClick={() => updateIntegrationField(
                                  config.key,
                                  'settings',
                                  setting.key,
                                  !integration?.settings?.[setting.key]
                                )}
                                style={{
                                  width: '44px',
                                  height: '24px',
                                  borderRadius: '9999px',
                                  backgroundColor: integration?.settings?.[setting.key]
                                    ? 'hsl(var(--primary))'
                                    : 'hsl(var(--muted))',
                                  border: 'none',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  transition: 'background-color 0.2s'
                                }}
                              >
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  backgroundColor: 'white',
                                  position: 'absolute',
                                  top: '2px',
                                  transition: 'transform 0.2s',
                                  transform: integration?.settings?.[setting.key]
                                    ? (isRtl ? 'translateX(-20px)' : 'translateX(20px)')
                                    : 'translateX(2px)'
                                }} />
                              </button>
                            </div>
                          ) : setting.type === 'select' ? (
                            <div>
                              <label style={{
                                display: 'block',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                marginBottom: '0.25rem'
                              }}>
                                {setting.label}
                              </label>
                              <select
                                value={integration?.settings?.[setting.key] || ''}
                                onChange={(e) => updateIntegrationField(
                                  config.key,
                                  'settings',
                                  setting.key,
                                  e.target.value
                                )}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: 'calc(var(--radius) * 1.5)',
                                  border: '1px solid hsl(var(--border))',
                                  backgroundColor: 'hsl(var(--background))',
                                  fontSize: 'var(--font-size-sm)',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="">{t('admin.integrations.select', 'Select')} {setting.label}</option>
                                {setting.options?.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <label style={{
                                display: 'block',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                marginBottom: '0.25rem'
                              }}>
                                {setting.label}
                              </label>
                              <input
                                type="text"
                                placeholder={setting.placeholder}
                                value={integration?.settings?.[setting.key] || ''}
                                onChange={(e) => updateIntegrationField(
                                  config.key,
                                  'settings',
                                  setting.key,
                                  e.target.value
                                )}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: 'calc(var(--radius) * 1.5)',
                                  border: '1px solid hsl(var(--border))',
                                  backgroundColor: 'hsl(var(--background))',
                                  fontSize: 'var(--font-size-sm)'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Webhook URL Section */}
                {['stripe', 'zoom', 'docusign'].includes(config.key) && (
                  <div style={{
                    paddingTop: '1.5rem',
                    borderTop: '1px solid hsl(var(--border))',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <Globe className="h-4 w-4" />
                      {t('admin.integrations.webhookUrl', 'Webhook URL')}
                    </h3>
                    <p style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--muted-foreground))',
                      marginBottom: '0.5rem'
                    }}>
                      {t('admin.integrations.webhookDescription', `Configure this URL in your ${config.name} webhook settings`)}
                    </p>
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: '0.5rem'
                    }}>
                      <input
                        type="text"
                        value={`${window.location.origin}/api/webhooks/${config.key}`}
                        readOnly
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'calc(var(--radius) * 1.5)',
                          border: '1px solid hsl(var(--border))',
                          backgroundColor: 'hsl(var(--muted))',
                          fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)',
                          fontFamily: 'monospace',
                          width: isMobile ? '100%' : 'auto',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/api/webhooks/${config.key}`
                          );
                          toast.success(t('admin.integrations.copied', 'Webhook URL copied to clipboard'));
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 'calc(var(--radius) * 1.5)',
                          border: '1px solid hsl(var(--border))',
                          backgroundColor: 'hsl(var(--background))',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                          transition: 'background-color 0.2s',
                          whiteSpace: 'nowrap',
                          width: isMobile ? '100%' : 'auto'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--accent))'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--background))'}
                      >
                        {t('admin.integrations.copy', 'Copy')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid hsl(var(--border))'
                }}>
                  <button
                    onClick={() => handleTest(config.key)}
                    disabled={!hasRequiredCredentials || testing === config.key}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      cursor: !hasRequiredCredentials || testing === config.key ? 'not-allowed' : 'pointer',
                      opacity: !hasRequiredCredentials || testing === config.key ? 0.5 : 1,
                      fontSize: 'var(--font-size-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'background-color 0.2s',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      if (hasRequiredCredentials && testing !== config.key) {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                      }
                    }}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--background))'}
                  >
                    {testing === config.key ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {t('admin.integrations.testing', 'Testing...')}</>
                    ) : (
                      <><TestTube className="h-4 w-4" /> {t('admin.integrations.testConnection', 'Test Connection')}</>
                    )}
                  </button>
                  <button
                    onClick={() => handleSave(config.key)}
                    disabled={saving === config.key}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      border: 'none',
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      cursor: saving === config.key ? 'not-allowed' : 'pointer',
                      opacity: saving === config.key ? 0.7 : 1,
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'opacity 0.2s',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      if (saving !== config.key) {
                        e.currentTarget.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (saving !== config.key) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                  >
                    {saving === config.key ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {t('admin.integrations.saving', 'Saving...')}</>
                    ) : (
                      <><Save className="h-4 w-4" /> {t('admin.integrations.save', 'Save Configuration')}</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
import axios, { AxiosInstance } from 'axios';
import { createClient } from '@/lib/supabase/server';

export interface KeapCredentials {
  client_id: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
}

export interface KeapSettings {
  default_tag_category?: string;
  auto_sync_contacts?: boolean;
  sync_frequency?: string;
}

export interface KeapContact {
  id?: number;
  email_addresses?: Array<{
    email: string;
    field: string;
  }>;
  given_name?: string;
  family_name?: string;
  phone_numbers?: Array<{
    number: string;
    field: string;
    type?: string;
  }>;
  tag_ids?: number[];
  custom_fields?: Array<{
    id: number;
    content: string;
  }>;
}

export interface KeapTag {
  id: number;
  name: string;
  description?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface KeapCampaign {
  id: number;
  name: string;
  created_date: string;
  error_message?: string;
  goals?: any[];
  published_date?: string;
  published_status?: string;
  published_time_zone?: string;
  time_zone?: string;
}

export class KeapClient {
  private api: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private settings: KeapSettings;
  private tokenExpiry: number = 0;

  constructor(credentials: KeapCredentials, settings?: KeapSettings) {
    this.clientId = credentials.client_id;
    this.clientSecret = credentials.client_secret;
    this.accessToken = credentials.access_token || null;
    this.refreshToken = credentials.refresh_token || null;
    this.settings = settings || {};

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Keap credentials are not configured properly');
    }

    this.api = axios.create({
      baseURL: 'https://api.infusionsoft.com/crm/rest/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include access token
    this.api.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Get OAuth access token
   * If refresh token exists, refresh it. Otherwise, throw error
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // If we have a refresh token, use it to get a new access token
    if (this.refreshToken) {
      try {
        const response = await axios.post(
          'https://api.infusionsoft.com/token',
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
          }),
          {
            auth: {
              username: this.clientId,
              password: this.clientSecret,
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        this.accessToken = response.data.access_token;
        this.refreshToken = response.data.refresh_token;
        // Set expiry to 5 minutes before actual expiry to be safe
        this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

        // Save new tokens to database
        await this.saveTokens();

        if (!this.accessToken) {
          throw new Error('Failed to obtain access token from Keap');
        }

        return this.accessToken;
      } catch (error) {
        console.error('Failed to refresh Keap access token:', error);
        throw new Error('Failed to refresh Keap access token. Please re-authenticate.');
      }
    }

    // No refresh token available
    throw new Error('Keap integration requires OAuth authentication. Please complete the OAuth flow.');
  }

  /**
   * Save tokens to database
   */
  private async saveTokens(): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase
        .from('integrations')
        .update({
          credentials: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            access_token: this.accessToken,
            refresh_token: this.refreshToken,
          },
        })
        .eq('integration_key', 'keap');
    } catch (error) {
      console.error('Failed to save Keap tokens:', error);
    }
  }

  /**
   * Exchange authorization code for tokens (OAuth callback)
   */
  async exchangeAuthorizationCode(code: string, redirectUri: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://api.infusionsoft.com/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      // Save tokens to database
      await this.saveTokens();
    } catch (error) {
      console.error('Failed to exchange Keap authorization code:', error);
      throw new Error('Failed to complete Keap OAuth flow');
    }
  }

  /**
   * Test the connection to Keap API
   */
  async testConnection(): Promise<{ success: boolean; message: string; accountInfo?: any }> {
    try {
      // Get account info to verify credentials
      const response = await this.api.get('/account/profile');

      return {
        success: true,
        message: `Connected successfully to: ${response.data.company_name || 'Keap Account'}`,
        accountInfo: response.data,
      };
    } catch (error) {
      console.error('Keap connection test failed:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        return {
          success: false,
          message: `Connection failed: ${errorMsg}`,
        };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Create or update a contact
   */
  async upsertContact(contact: KeapContact): Promise<KeapContact> {
    try {
      // If contact has an ID, update it
      if (contact.id) {
        const response = await this.api.patch(`/contacts/${contact.id}`, contact);
        return response.data;
      }

      // Otherwise, create a new contact
      const response = await this.api.post('/contacts', contact);
      return response.data;
    } catch (error) {
      console.error('Failed to upsert Keap contact:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to upsert Keap contact: ${errorMsg}`);
      }
      throw new Error('Failed to upsert Keap contact');
    }
  }

  /**
   * Get a contact by ID
   */
  async getContact(contactId: number): Promise<KeapContact> {
    try {
      const response = await this.api.get(`/contacts/${contactId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Keap contact:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to get Keap contact: ${errorMsg}`);
      }
      throw new Error('Failed to get Keap contact');
    }
  }

  /**
   * Find contact by email
   */
  async findContactByEmail(email: string): Promise<KeapContact | null> {
    try {
      const response = await this.api.get('/contacts', {
        params: {
          email,
          limit: 1,
        },
      });

      if (response.data.contacts && response.data.contacts.length > 0) {
        return response.data.contacts[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to find Keap contact by email:', error);
      return null;
    }
  }

  /**
   * Add tag to contact
   */
  async addTagToContact(contactId: number, tagId: number): Promise<void> {
    try {
      await this.api.post(`/contacts/${contactId}/tags`, {
        tagIds: [tagId],
      });
    } catch (error) {
      console.error('Failed to add tag to Keap contact:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to add tag to contact: ${errorMsg}`);
      }
      throw new Error('Failed to add tag to contact');
    }
  }

  /**
   * Remove tag from contact
   */
  async removeTagFromContact(contactId: number, tagId: number): Promise<void> {
    try {
      await this.api.delete(`/contacts/${contactId}/tags/${tagId}`);
    } catch (error) {
      console.error('Failed to remove tag from Keap contact:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to remove tag from contact: ${errorMsg}`);
      }
      throw new Error('Failed to remove tag from contact');
    }
  }

  /**
   * List all tags
   */
  async listTags(): Promise<KeapTag[]> {
    try {
      const response = await this.api.get('/tags', {
        params: {
          limit: 1000,
        },
      });
      return response.data.tags || [];
    } catch (error) {
      console.error('Failed to list Keap tags:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to list Keap tags: ${errorMsg}`);
      }
      throw new Error('Failed to list Keap tags');
    }
  }

  /**
   * Create a new tag
   */
  async createTag(name: string, description?: string, categoryId?: number): Promise<KeapTag> {
    try {
      const response = await this.api.post('/tags', {
        name,
        description,
        category: categoryId ? { id: categoryId } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create Keap tag:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to create Keap tag: ${errorMsg}`);
      }
      throw new Error('Failed to create Keap tag');
    }
  }

  /**
   * Find or create a tag by name
   * This method will search for an existing tag first, and only create if not found
   */
  async findOrCreateTag(name: string, description?: string, categoryId?: number): Promise<KeapTag> {
    try {
      // First, try to find existing tag by name
      const tags = await this.listTags();
      const existingTag = tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());

      if (existingTag) {
        return existingTag;
      }

      // Tag doesn't exist, create it
      return await this.createTag(name, description, categoryId);
    } catch (error) {
      console.error('Failed to find or create Keap tag:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to find or create Keap tag: ${errorMsg}`);
      }
      throw new Error('Failed to find or create Keap tag');
    }
  }

  /**
   * List all campaigns
   */
  async listCampaigns(): Promise<KeapCampaign[]> {
    try {
      const response = await this.api.get('/campaigns', {
        params: {
          limit: 1000,
        },
      });
      return response.data.campaigns || [];
    } catch (error) {
      console.error('Failed to list Keap campaigns:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to list Keap campaigns: ${errorMsg}`);
      }
      throw new Error('Failed to list Keap campaigns');
    }
  }

  /**
   * Add contact to campaign
   */
  async addContactToCampaign(contactId: number, campaignId: number): Promise<void> {
    try {
      await this.api.post(`/campaigns/${campaignId}/sequences`, {
        contacts: [contactId],
      });
    } catch (error) {
      console.error('Failed to add contact to Keap campaign:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to add contact to campaign: ${errorMsg}`);
      }
      throw new Error('Failed to add contact to campaign');
    }
  }

  /**
   * Create a note for a contact
   */
  async createNote(contactId: number, title: string, body: string): Promise<void> {
    try {
      await this.api.post('/notes', {
        contact_id: contactId,
        title,
        body,
        type: 'Other',
      });
    } catch (error) {
      console.error('Failed to create Keap note:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to create note: ${errorMsg}`);
      }
      throw new Error('Failed to create note');
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(clientId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'full',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://signin.infusionsoft.com/app/oauth/authorize?${params.toString()}`;
  }
}

/**
 * Get Keap client with credentials from database
 */
export async function getKeapClient(): Promise<KeapClient> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[getKeapClient] Failed to get user:', userError);
      throw new Error('Authentication required. Please ensure you are logged in.');
    }

    // Get tenant_id from tenant_users relationship
    const { data: tenantUsers, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (tenantError || !tenantUsers) {
      console.error('[getKeapClient] Failed to get tenant:', tenantError);
      throw new Error('No active tenant found for user. Please contact support.');
    }

    const tenantId = tenantUsers.tenant_id;

    // Query integrations filtered by tenant_id
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'keap')
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true)
      .single();

    if (error || !integration) {
      console.error('[getKeapClient] Integration query error:', error);
      throw new Error('Keap integration is not enabled or not configured for this tenant');
    }

    const credentials = integration.credentials as KeapCredentials;
    const settings = integration.settings as KeapSettings;

    if (!credentials.client_id || !credentials.client_secret) {
      throw new Error('Keap credentials are incomplete. Please configure the integration in the admin panel.');
    }

    return new KeapClient(credentials, settings);
  } catch (error) {
    console.error('[getKeapClient] Failed to get Keap client:', error);
    throw error;
  }
}

/**
 * Get Keap client with specific credentials (for testing)
 */
export function createKeapClient(credentials: KeapCredentials, settings?: KeapSettings): KeapClient {
  return new KeapClient(credentials, settings);
}

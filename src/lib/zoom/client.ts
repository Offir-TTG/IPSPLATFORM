import axios, { AxiosInstance } from 'axios';
import { createClient } from '@/lib/supabase/server';

interface ZoomMeetingSettings {
  host_video?: boolean;
  participant_video?: boolean;
  join_before_host?: boolean;
  mute_upon_entry?: boolean;
  watermark?: boolean;
  use_pmi?: boolean;
  approval_type?: number;
  audio?: 'both' | 'telephony' | 'voip';
  auto_recording?: 'local' | 'cloud' | 'none';
  waiting_room?: boolean;
  meeting_authentication?: boolean;
  enable_waiting_room?: boolean;
}

interface CreateMeetingParams {
  topic: string;
  type: 2 | 8; // 2 = scheduled, 8 = recurring
  start_time?: string; // ISO 8601 format (optional for instant meetings)
  duration: number; // in minutes
  timezone?: string;
  password?: string;
  agenda?: string;
  settings?: ZoomMeetingSettings;
}

interface ZoomMeeting {
  id: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  start_url: string;
  password?: string;
  settings: ZoomMeetingSettings;
}

interface ZoomRecording {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_size: number;
  play_url: string;
  download_url: string;
  status: string;
}

interface ZoomRecordingResponse {
  uuid: string;
  id: number;
  host_id: string;
  topic: string;
  start_time: string;
  duration: number;
  recording_files: ZoomRecording[];
}

interface ZoomCredentials {
  account_id: string;
  client_id: string;
  client_secret: string;
  sdk_key?: string;
  sdk_secret?: string;
}

interface ZoomSettings {
  default_meeting_duration?: string;
  auto_recording?: 'local' | 'cloud' | 'none';
  waiting_room?: boolean;
  join_before_host?: boolean;
}

export class ZoomClient {
  private api: AxiosInstance;
  private accountId: string;
  private clientId: string;
  private clientSecret: string;
  private sdkKey?: string;
  private sdkSecret?: string;
  private settings: ZoomSettings;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: ZoomCredentials, settings?: ZoomSettings) {
    this.accountId = credentials.account_id;
    this.clientId = credentials.client_id;
    this.clientSecret = credentials.client_secret;
    this.sdkKey = credentials.sdk_key;
    this.sdkSecret = credentials.sdk_secret;
    this.settings = settings || {};

    if (!this.accountId || !this.clientId || !this.clientSecret) {
      throw new Error('Zoom credentials are not configured properly');
    }

    this.api = axios.create({
      baseURL: 'https://api.zoom.us/v2',
    });

    // Add request interceptor to include access token
    this.api.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Get OAuth access token using Server-to-Server OAuth
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'account_credentials',
            account_id: this.accountId,
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry to be safe
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken as string;
    } catch (error) {
      console.error('Failed to get Zoom access token:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.reason || error.response?.data?.error || error.message;
        throw new Error(`Failed to authenticate with Zoom: ${errorMsg}`);
      }
      throw new Error('Failed to authenticate with Zoom');
    }
  }

  /**
   * Test the connection to Zoom API
   */
  async testConnection(): Promise<{ success: boolean; message: string; userInfo?: any }> {
    try {
      // Try to get an access token
      await this.getAccessToken();

      // Get user info to verify credentials
      const response = await this.api.get('/users/me');

      return {
        success: true,
        message: `Connected successfully as: ${response.data.first_name} ${response.data.last_name} (${response.data.email})`,
        userInfo: response.data
      };
    } catch (error) {
      console.error('Zoom connection test failed:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        return {
          success: false,
          message: `Connection failed: ${errorMsg}`
        };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Create a new Zoom meeting
   */
  async createMeeting(params: CreateMeetingParams): Promise<ZoomMeeting> {
    try {
      const defaultDuration = parseInt(this.settings.default_meeting_duration || '60');
      const autoRecording = this.settings.auto_recording || 'none';

      const response = await this.api.post('/users/me/meetings', {
        topic: params.topic,
        type: params.type,
        start_time: params.start_time,
        duration: params.duration || defaultDuration,
        timezone: params.timezone || 'UTC',
        password: params.password,
        agenda: params.agenda,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: this.settings.join_before_host ?? false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 2, // no registration required
          audio: 'both',
          auto_recording: autoRecording,
          waiting_room: this.settings.waiting_room ?? true,
          ...params.settings,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to create Zoom meeting: ${errorMsg}`);
      }
      throw new Error('Failed to create Zoom meeting');
    }
  }

  /**
   * Create an instant meeting (starts immediately)
   */
  async createInstantMeeting(topic: string, duration?: number): Promise<ZoomMeeting> {
    return this.createMeeting({
      topic,
      type: 2, // Instant meeting
      duration: duration || parseInt(this.settings.default_meeting_duration || '60'),
    });
  }

  /**
   * Get meeting details
   */
  async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    try {
      const response = await this.api.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Zoom meeting:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to get Zoom meeting: ${errorMsg}`);
      }
      throw new Error('Failed to get Zoom meeting');
    }
  }

  /**
   * Update a meeting
   */
  async updateMeeting(
    meetingId: string,
    params: Partial<CreateMeetingParams>
  ): Promise<void> {
    try {
      await this.api.patch(`/meetings/${meetingId}`, params);
    } catch (error) {
      console.error('Failed to update Zoom meeting:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to update Zoom meeting: ${errorMsg}`);
      }
      throw new Error('Failed to update Zoom meeting');
    }
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await this.api.delete(`/meetings/${meetingId}`);
    } catch (error) {
      console.error('Failed to delete Zoom meeting:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to delete Zoom meeting: ${errorMsg}`);
      }
      throw new Error('Failed to delete Zoom meeting');
    }
  }

  /**
   * List all meetings for the user
   */
  async listMeetings(type: 'scheduled' | 'live' | 'upcoming' = 'upcoming'): Promise<ZoomMeeting[]> {
    try {
      const response = await this.api.get('/users/me/meetings', {
        params: {
          type,
          page_size: 300
        }
      });
      return response.data.meetings || [];
    } catch (error) {
      console.error('Failed to list Zoom meetings:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to list Zoom meetings: ${errorMsg}`);
      }
      throw new Error('Failed to list Zoom meetings');
    }
  }

  /**
   * Get meeting recordings
   */
  async getRecordings(meetingId: string): Promise<ZoomRecordingResponse> {
    try {
      const response = await this.api.get(`/meetings/${meetingId}/recordings`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Zoom recordings:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to get Zoom recordings: ${errorMsg}`);
      }
      throw new Error('Failed to get Zoom recordings');
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(meetingId: string): Promise<void> {
    try {
      await this.api.delete(`/meetings/${meetingId}/recordings`);
    } catch (error) {
      console.error('Failed to delete Zoom recording:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to delete Zoom recording: ${errorMsg}`);
      }
      throw new Error('Failed to delete Zoom recording');
    }
  }

  /**
   * Get past meeting participants
   */
  async getMeetingParticipants(meetingId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/past_meetings/${meetingId}/participants`);
      return response.data.participants || [];
    } catch (error) {
      console.error('Failed to get meeting participants:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Failed to get meeting participants: ${errorMsg}`);
      }
      throw new Error('Failed to get meeting participants');
    }
  }

  /**
   * Generate Zoom SDK JWT token for client-side integration
   * Note: This requires the SDK key and secret to be configured
   */
  generateSDKJWT(meetingNumber: string, role: 0 | 1): string {
    // Role: 0 = participant, 1 = host
    if (!this.sdkKey || !this.sdkSecret) {
      throw new Error('Zoom SDK credentials are not configured. Please add SDK Key and SDK Secret in the integration settings.');
    }

    // Use jsonwebtoken library to generate JWT
    const jwt = require('jsonwebtoken');

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 2; // 2 hours

    const payload = {
      sdkKey: this.sdkKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      appKey: this.sdkKey,
      tokenExp: exp
    };

    return jwt.sign(payload, this.sdkSecret);
  }
}

/**
 * Get Zoom client with credentials from database
 */
export async function getZoomClient(): Promise<ZoomClient> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[getZoomClient] Failed to get user:', userError);
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
      console.error('[getZoomClient] Failed to get tenant:', tenantError);
      throw new Error('No active tenant found for user. Please contact support.');
    }

    const tenantId = tenantUsers.tenant_id;

    // Query integrations filtered by tenant_id
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'zoom')
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true)
      .single();

    if (error || !integration) {
      console.error('[getZoomClient] Integration query error:', error);
      throw new Error('Zoom integration is not enabled or not configured for this tenant');
    }

    const credentials = integration.credentials as ZoomCredentials;
    const settings = integration.settings as ZoomSettings;

    if (!credentials.account_id || !credentials.client_id || !credentials.client_secret) {
      throw new Error('Zoom credentials are incomplete. Please configure the integration in the admin panel.');
    }

    return new ZoomClient(credentials, settings);
  } catch (error) {
    console.error('[getZoomClient] Failed to get Zoom client:', error);
    throw error;
  }
}

/**
 * Get Zoom client with specific credentials (for testing)
 */
export function createZoomClient(credentials: ZoomCredentials, settings?: ZoomSettings): ZoomClient {
  return new ZoomClient(credentials, settings);
}

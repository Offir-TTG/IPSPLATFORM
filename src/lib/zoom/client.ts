import axios, { AxiosInstance } from 'axios';

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
}

interface CreateMeetingParams {
  topic: string;
  type: 2 | 8; // 2 = scheduled, 8 = recurring
  start_time: string; // ISO 8601 format
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

export class ZoomClient {
  private api: AxiosInstance;
  private accountId: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.accountId = process.env.ZOOM_ACCOUNT_ID || '';
    this.clientId = process.env.ZOOM_CLIENT_ID || '';
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET || '';

    if (!this.accountId || !this.clientId || !this.clientSecret) {
      throw new Error('Zoom credentials are not configured');
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
      throw new Error('Failed to authenticate with Zoom');
    }
  }

  /**
   * Create a new Zoom meeting
   */
  async createMeeting(params: CreateMeetingParams): Promise<ZoomMeeting> {
    try {
      const response = await this.api.post('/users/me/meetings', {
        topic: params.topic,
        type: params.type,
        start_time: params.start_time,
        duration: params.duration,
        timezone: params.timezone || 'America/New_York',
        password: params.password,
        agenda: params.agenda,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 2, // no registration required
          audio: 'both',
          auto_recording: 'cloud',
          waiting_room: true,
          ...params.settings,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
      throw new Error('Failed to create Zoom meeting');
    }
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
      throw new Error('Failed to delete Zoom meeting');
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
      throw new Error('Failed to delete Zoom recording');
    }
  }

  /**
   * Get recording download token (for downloading cloud recordings)
   */
  async getRecordingDownloadToken(downloadUrl: string): Promise<string> {
    try {
      // Extract meeting UUID from download URL
      const urlParams = new URL(downloadUrl).searchParams;
      const meetingUUID = urlParams.get('meeting_id');

      if (!meetingUUID) {
        throw new Error('Invalid download URL');
      }

      const response = await this.api.get(
        `/meetings/${meetingUUID}/recordings/settings`
      );

      return response.data.download_access_token;
    } catch (error) {
      console.error('Failed to get recording download token:', error);
      throw new Error('Failed to get recording download token');
    }
  }

  /**
   * Generate Zoom SDK JWT token for client-side integration
   */
  generateSDKJWT(meetingNumber: string, role: 0 | 1): string {
    // Role: 0 = participant, 1 = host
    // This is a simplified version - in production, use a proper JWT library
    const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY || '';
    const sdkSecret = process.env.NEXT_PUBLIC_ZOOM_SDK_SECRET || '';

    if (!sdkKey || !sdkSecret) {
      throw new Error('Zoom SDK credentials are not configured');
    }

    // In production, use jsonwebtoken library to generate JWT
    // For now, this is a placeholder
    throw new Error('SDK JWT generation not implemented - use jsonwebtoken library');
  }
}

// Singleton instance
let zoomClient: ZoomClient | null = null;

export function getZoomClient(): ZoomClient {
  if (!zoomClient) {
    zoomClient = new ZoomClient();
  }
  return zoomClient;
}

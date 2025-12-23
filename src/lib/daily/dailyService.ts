/**
 * Daily.co API Service
 * Handles room creation, token generation, and recording management
 */

import { createClient } from '@/lib/supabase/server';

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  api_created: boolean;
  privacy: 'private' | 'public';
  created_at: string;
  config: {
    exp?: number;
    enable_recording?: string;
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
  };
}

export interface DailyMeetingToken {
  token: string;
}

export interface DailyRecording {
  id: string;
  room_name: string;
  start_ts: number;
  duration: number;
  share_token: string;
  download_link?: string;
  status: 'finished' | 'processing' | 'error';
}

class DailyService {
  private baseUrl = 'https://api.daily.co/v1';

  /**
   * Get Daily.co API key from database integrations
   */
  private async getApiKey(): Promise<string> {
    const supabase = await createClient();

    const { data: integration, error } = await supabase
      .from('integrations')
      .select('credentials, is_enabled')
      .eq('integration_key', 'daily')
      .single();

    if (error || !integration) {
      throw new Error('Daily.co integration not configured. Please add it in Admin > Settings > Integrations');
    }

    if (!integration.is_enabled) {
      throw new Error('Daily.co integration is disabled. Please enable it in Admin > Settings > Integrations');
    }

    const apiKey = integration.credentials?.api_key;
    if (!apiKey) {
      throw new Error('Daily.co API key not set. Please configure it in Admin > Settings > Integrations');
    }

    return apiKey;
  }

  /**
   * Create a new Daily.co room for a lesson
   */
  async createRoom(roomName: string, options?: {
    privacy?: 'private' | 'public';
    expiresInHours?: number;
    enableRecording?: boolean;
  }): Promise<DailyRoom> {
    const apiKey = await this.getApiKey();

    const expiresAt = options?.expiresInHours
      ? Math.floor(Date.now() / 1000) + (options.expiresInHours * 60 * 60)
      : Math.floor(Date.now() / 1000) + (24 * 60 * 60); // Default 24 hours

    const requestBody: any = {
      privacy: options?.privacy || 'private',
      properties: {
        exp: expiresAt,
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
      },
    };

    // Only add name if provided (Daily.co can auto-generate)
    if (roomName) {
      requestBody.name = roomName;
    }

    // Add recording if enabled
    if (options?.enableRecording) {
      requestBody.properties.enable_recording = 'cloud';
    }

    console.log('[Daily.co] Creating room with body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Daily.co] Room creation failed:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(`Failed to create Daily.co room: ${error.error || error.info || response.statusText}`);
    }

    const room = await response.json();
    console.log('[Daily.co] Room created successfully:', room);
    return room;
  }

  /**
   * Get room information
   */
  async getRoom(roomName: string): Promise<DailyRoom> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get Daily.co room: ${error.error || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update room properties
   * Note: Room name cannot be changed after creation
   */
  async updateRoom(roomName: string, options?: {
    privacy?: 'private' | 'public';
    expiresInHours?: number;
    enableRecording?: boolean;
  }): Promise<DailyRoom> {
    const apiKey = await this.getApiKey();

    const properties: any = {};

    // Update expiration if provided
    if (options?.expiresInHours !== undefined) {
      properties.exp = Math.floor(Date.now() / 1000) + (options.expiresInHours * 60 * 60);
    }

    // Update recording setting if provided
    if (options?.enableRecording !== undefined) {
      properties.enable_recording = options.enableRecording ? 'cloud' : 'off';
    }

    const requestBody: any = {};

    if (options?.privacy) {
      requestBody.privacy = options.privacy;
    }

    if (Object.keys(properties).length > 0) {
      requestBody.properties = properties;
    }

    console.log('[Daily.co] Updating room:', roomName, 'with:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Daily.co] Room update failed:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(`Failed to update Daily.co room: ${error.error || error.info || response.statusText}`);
    }

    const room = await response.json();
    console.log('[Daily.co] Room updated successfully');
    return room;
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName: string): Promise<void> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(`Failed to delete Daily.co room: ${error.error || response.statusText}`);
    }
  }

  /**
   * Generate a meeting token for a participant
   * This is where automatic role assignment happens!
   */
  async createMeetingToken(
    roomName: string,
    options: {
      isOwner: boolean; // 🔑 Key parameter for automatic role assignment
      userName: string;
      userId?: string;
      expiresInHours?: number;
      enableRecording?: boolean;
      startCloudRecording?: boolean;
    }
  ): Promise<DailyMeetingToken> {
    const apiKey = await this.getApiKey();

    const expiresAt = options.expiresInHours
      ? Math.floor(Date.now() / 1000) + (options.expiresInHours * 60 * 60)
      : Math.floor(Date.now() / 1000) + (4 * 60 * 60); // Default 4 hours

    const tokenProperties: any = {
      room_name: roomName,
      is_owner: options.isOwner, // ✅ Automatic role assignment
      user_name: options.userName,
      eject_at_token_exp: expiresAt,
    };

    // Add user_id if provided (useful for tracking)
    if (options.userId) {
      tokenProperties.user_id = options.userId;
    }

    // Only owners can control recording
    if (options.isOwner) {
      if (options.enableRecording) {
        tokenProperties.enable_recording = 'cloud';
      }
      if (options.startCloudRecording) {
        tokenProperties.start_cloud_recording = true;
      }
    }

    const response = await fetch(`${this.baseUrl}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: tokenProperties,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create meeting token: ${error.error || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get recordings for a room
   */
  async getRecordings(roomName: string): Promise<DailyRecording[]> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}/recordings?room_name=${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get recordings: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get a specific recording
   */
  async getRecording(recordingId: string): Promise<DailyRecording> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get recording: ${error.error || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(`Failed to delete recording: ${error.error || response.statusText}`);
    }
  }

  /**
   * Get download link for a recording
   */
  async getRecordingDownloadLink(recordingId: string): Promise<string> {
    const apiKey = await this.getApiKey();
    const recording = await this.getRecording(recordingId);

    if (recording.status !== 'finished') {
      throw new Error(`Recording is not ready yet (status: ${recording.status})`);
    }

    // Daily.co provides a download link via the recording access link
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}/access-link`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get recording access link: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    return data.download_link;
  }
}

export const dailyService = new DailyService();

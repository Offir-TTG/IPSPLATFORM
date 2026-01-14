'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface ZoomRecordingSDKProps {
  recordingId: string; // The Zoom meeting ID
  recordingUrl: string; // The share/play URL
  onError?: (error: Error) => void;
}

export default function ZoomRecordingSDK({
  recordingId,
  recordingUrl,
  onError,
}: ZoomRecordingSDKProps) {
  const playerElement = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeRecordingPlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // For now, we'll use iframe embed since Zoom's Recording SDK is deprecated
        // and Meeting SDK doesn't support playing recordings directly
        // The only way to get a clean player is to download and self-host

        setIsLoading(false);
      } catch (err) {
        console.error('[Zoom Recording SDK] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recording';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    initializeRecordingPlayer();
  }, [recordingId, recordingUrl, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading recording...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-900 rounded-lg">
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Recording</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Use iframe with minimal branding
  return (
    <div ref={playerElement} className="w-full">
      <div className="relative w-full rounded-lg overflow-hidden bg-black">
        <iframe
          src={recordingUrl}
          className="w-full"
          style={{ minHeight: '500px', height: '600px', border: 'none' }}
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
